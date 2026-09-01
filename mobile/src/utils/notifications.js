import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerWebPush } from './webPush';

// ตั้งค่าการแสดง notification เมื่อแอปเปิดอยู่
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

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

// ขอ permission และดึงตัวรับแจ้งเตือน — มือถือได้ Expo Push Token, เว็บได้ Web Push subscription
export async function registerForPushNotifications() {
  if (Platform.OS === 'web') {
    const webPushSubscription = await registerWebPush();
    return { pushToken: null, webPushSubscription };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { pushToken: null, webPushSubscription: null };
  }

  await setupNotificationChannel();

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '17cc010d-3bcc-430d-b6cc-526054474624',
    });
    return { pushToken: tokenData.data, webPushSubscription: null };
  } catch {
    // Expo Go SDK 53+ ไม่รองรับ remote push token — ใช้ in-app alert แทน
    return { pushToken: null, webPushSubscription: null };
  }
}

// ส่ง push notification ผ่าน Expo Push API (เรียกจาก admin) — ไม่ใส่ title/body จะใช้ข้อความเรียกคิวแบบเดิม
export async function sendPushNotification(expoPushToken, queueNumber, title, body) {
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
        title: title || '🔔 ถึงคิวของคุณแล้ว!',
        body: body || `คิวหมายเลข ${queueNumber} — กรุณามาที่เคาน์เตอร์`,
        sound: 'default',
        priority: 'high',
        data: { queueNumber },
      }),
    });
  } catch (e) {
    console.error('sendPushNotification:', e.message);
  }
}
