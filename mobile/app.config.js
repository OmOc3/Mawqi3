const appJson = require('./app.json');

module.exports = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    eas: {
      ...(appJson.expo.extra?.eas ?? {}),
      projectId: '3aa6c46b-a808-4b6d-971c-41fe7c7695eb',
    },
  },
};
