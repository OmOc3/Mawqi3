const appJson = require('./app.json');

function readPublicEnv(expoName, nextName) {
  return process.env[expoName] || process.env[nextName] || '';
}

module.exports = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    firebase: {
      apiKey: readPublicEnv('EXPO_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY'),
      appId: readPublicEnv('EXPO_PUBLIC_FIREBASE_APP_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID'),
      authDomain: readPublicEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
      messagingSenderId: readPublicEnv(
        'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
        'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      ),
      projectId: readPublicEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
      storageBucket: readPublicEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    },
  },
};
