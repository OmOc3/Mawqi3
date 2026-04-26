import { createContext, createElement, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/sync/firebase';
import type { AppUser } from '@/lib/sync/types';

export interface CurrentMobileUser {
  firebaseUser: FirebaseUser;
  profile: AppUser;
}

interface AuthContextValue {
  currentUser: CurrentMobileUser | null;
  ready: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isActiveAppUser(value: unknown, uid: string): value is AppUser {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const user = value as Partial<AppUser>;

  return user.uid === uid && user.isActive === true && typeof user.email === 'string' && typeof user.displayName === 'string';
}

async function loadUserProfile(user: FirebaseUser): Promise<AppUser | null> {
  const snapshot = await getDoc(doc(db, 'users', user.uid));
  const data = snapshot.data() as unknown;

  return isActiveAppUser(data, user.uid) ? data : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentMobileUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      async function resolveUser(): Promise<void> {
        setReady(false);

        if (!nextUser) {
          if (isMounted) {
            setCurrentUser(null);
            setReady(true);
          }
          return;
        }

        try {
          const profile = await loadUserProfile(nextUser);

          if (!profile) {
            await firebaseSignOut(auth);

            if (isMounted) {
              setCurrentUser(null);
            }
            return;
          }

          if (isMounted) {
            setCurrentUser({ firebaseUser: nextUser, profile });
          }
        } catch {
          await firebaseSignOut(auth);

          if (isMounted) {
            setCurrentUser(null);
          }
        } finally {
          if (isMounted) {
            setReady(true);
          }
        }
      }

      void resolveUser();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ currentUser, ready }), [currentUser, ready]);

  return createElement(AuthContext.Provider, { value }, children);
}

function useAuthContext(): AuthContextValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }

  return value;
}

export function useCurrentUser(): CurrentMobileUser | null {
  return useAuthContext().currentUser;
}

export function useAuthReady(): boolean {
  return useAuthContext().ready;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
