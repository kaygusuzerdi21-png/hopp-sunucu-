const admin = require('firebase-admin');

let initialized = false;

function getApp() {
  if (!initialized) {
    const { FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL } = process.env;

    if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
      throw new Error('Firebase env değişkenleri eksik (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL)');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: FIREBASE_CLIENT_EMAIL,
      }),
    });
    initialized = true;
  }
  return admin;
}

async function sendToToken(token, { title, body, data = {} }) {
  const app = getApp();
  return app.messaging().send({
    token,
    notification: { title, body },
    data,
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  });
}

async function sendToMultiple(tokens, payload) {
  if (!tokens.length) return { successCount: 0, failureCount: 0 };
  const app = getApp();
  const messages = tokens.map((token) => ({ token, notification: payload.notification, data: payload.data || {} }));
  const response = await app.messaging().sendEach(messages);
  return { successCount: response.successCount, failureCount: response.failureCount };
}

async function sendToTopic(topic, { title, body, data = {} }) {
  const app = getApp();
  return app.messaging().send({
    topic,
    notification: { title, body },
    data,
  });
}

module.exports = { sendToToken, sendToMultiple, sendToTopic };
