import Constants from 'expo-constants';

// Firebase client configuration for mobile sync; keep these values matched with the web Firebase app.
export interface FirebaseConfig {
  apiKey: string;
  appId: string;
  authDomain: string;
  messagingSenderId: string;
  projectId: string;
  storageBucket: string;
}

function readExtraConfig(key: keyof FirebaseConfig): string | undefined {
  const firebaseExtra = Constants.expoConfig?.extra?.firebase;

  if (!firebaseExtra || typeof firebaseExtra !== 'object') {
    return undefined;
  }

  const value = (firebaseExtra as Partial<Record<keyof FirebaseConfig, unknown>>)[key];

  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readConfigValue(key: keyof FirebaseConfig, expoName: string, nextName: string): string {
  return process.env[expoName] ?? process.env[nextName] ?? readExtraConfig(key) ?? '';
}

// Fill these from your Firebase console and expose them to Expo with EXPO_PUBLIC_*.
export const firebaseConfig: FirebaseConfig = {
  apiKey: readConfigValue('apiKey', 'EXPO_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY'),
  appId: readConfigValue('appId', 'EXPO_PUBLIC_FIREBASE_APP_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID'),
  authDomain: readConfigValue('authDomain', 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  messagingSenderId: readConfigValue(
    'messagingSenderId',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  ),
  projectId: readConfigValue('projectId', 'EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: readConfigValue(
    'storageBucket',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  ),
};
