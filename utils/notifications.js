import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ตั้งค่าการแสดง notification เมื่อแอปเปิดอยู่
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// สร้าง notification channel สำหรับ Android
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('queue', {
      name: 'ระบบคิว',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 150, 400],
      sound: 'default',
    });
  }
}

// ขอ permission และดึง Expo Push Token
export async function registerForPushNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  await setupNotificationChannel();

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'kkl1-66a9e',
    });
    return tokenData.data;
  } catch {
    // Expo Go SDK 53+ ไม่รองรับ remote push token — ใช้ in-app alert แทน
    return null;
  }
}

// ส่ง push notification ผ่าน Expo Push API (เรียกจาก admin)
export async function sendPushNotification(expoPushToken, queueNumber) {
  if (!expoPushToken) return;

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: expoPushToken,
        channelId: 'queue',
        title: '🔔 ถึงคิวของคุณแล้ว!',
        body: `คิวหมายเลข ${queueNumber} — กรุณามาที่เคาน์เตอร์`,
        sound: 'default',
        priority: 'high',
        data: { queueNumber },
      }),
    });
  } catch (e) {
    console.error('sendPushNotification:', e.message);
  }
}
