const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();

/**
 * Fires whenever a notification document is created under users/{userId}/notifications.
 * Reads the user's Expo push token and delivers the push via the Expo Push API.
 */
exports.sendPushNotification = onDocumentCreated(
  'users/{userId}/notifications/{notificationId}',
  async (event) => {
    const notification = event.data?.data();
    if (!notification) return;

    const { userId } = event.params;

    const userSnap = await getFirestore().doc(`users/${userId}`).get();
    const pushToken = userSnap.data()?.pushToken;

    if (!pushToken || !String(pushToken).startsWith('ExponentPushToken')) return;

    const payload = {
      to: pushToken,
      title: notification.title ?? 'Wishlane',
      body: notification.message ?? '',
      sound: 'default',
      data: {
        type: notification.type,
        relatedId: notification.relatedId ?? null,
      },
    };

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Expo push error:', res.status, text);
    }
  }
);
