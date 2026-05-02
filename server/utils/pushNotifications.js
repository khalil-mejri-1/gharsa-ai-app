const { Expo } = require('expo-server-sdk');
let expo = new Expo();

const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error(`Push token ${expoPushToken} is not a valid Expo push token`);
    return;
  }

  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  };

  try {
    const ticketChunk = await expo.sendPushNotificationsAsync([message]);
    console.log('Push notification sent:', ticketChunk);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

module.exports = { sendPushNotification };
