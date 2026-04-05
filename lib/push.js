import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export const sendPushNotification = async (subscriptions, payload) => {
  if (!subscriptions || !Array.isArray(subscriptions)) return;
  const promises = subscriptions.map((sub) =>
    webpush.sendNotification(sub, JSON.stringify(payload)).catch((err) => {
      console.error('Error sending push notification', err);
      // Clean up invalid subscriptions would happen here in a real app
    })
  );
  await Promise.all(promises);
};
