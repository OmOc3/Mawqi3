import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface KeepAwakeContextValue {
  keepAwakeEnabled: boolean;
  setKeepAwakeEnabled: (enabled: boolean) => void;
}

const KeepAwakeContext = createContext<KeepAwakeContextValue | null>(null);
const keepAwakeStorageKey = 'mawqi3-keep-awake';
const keepAwakeTag = 'mawqi3-field-app';

export function KeepAwakeProvider({ children }: { children: ReactNode }) {
  const [keepAwakeEnabled, setKeepAwakeEnabledState] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateKeepAwake(): Promise<void> {
      const storedValue = await AsyncStorage.getItem(keepAwakeStorageKey);

      if (isMounted) {
        setKeepAwakeEnabledState(storedValue === 'true');
      }
    }

    void hydrateKeepAwake();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (keepAwakeEnabled) {
      void activateKeepAwakeAsync(keepAwakeTag);
      return;
    }

    deactivateKeepAwake(keepAwakeTag);
  }, [keepAwakeEnabled]);

  const setKeepAwakeEnabled = useCallback((enabled: boolean) => {
    setKeepAwakeEnabledState(enabled);
    void AsyncStorage.setItem(keepAwakeStorageKey, enabled ? 'true' : 'false');
  }, []);

  const value = useMemo<KeepAwakeContextValue>(
    () => ({ keepAwakeEnabled, setKeepAwakeEnabled }),
    [keepAwakeEnabled, setKeepAwakeEnabled],
  );

  return <KeepAwakeContext.Provider value={value}>{children}</KeepAwakeContext.Provider>;
}

export function useKeepAwakeMode() {
  const value = useContext(KeepAwakeContext);

  if (!value) {
    throw new Error('useKeepAwakeMode must be used inside KeepAwakeProvider');
  }

  return value;
}
