// Firebase client entrypoint for mobile auth and server-mediated sync.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { firebaseConfig } from "@/lib/sync/config";

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function initializeMobileAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = initializeMobileAuth();
export const db = getFirestore(app);
