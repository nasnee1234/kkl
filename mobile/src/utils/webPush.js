import { auth } from '../config/firebase';
import { API_BASE_URL } from '../config/api';

// public key คู่กับ VAPID_PRIVATE_KEY ใน backend/.env — ไม่ใช่ความลับ ฝังในแอปได้
const VAPID_PUBLIC_KEY = 'BMcIJ01Uqkn3ZTCmxb4vf9Yp_tj0qmsnACS_wazvKW6p9NOZWknMKc4Ls1ho5ITax9vItc1vhpy8qJTU_7CxNKI';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// ขอสิทธิ์แจ้งเตือน + สมัคร Web Push บนเบราว์เซอร์ — คืนค่า subscription object เก็บไว้ในเอกสารคิว
export async function registerWebPush() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    return subscription.toJSON();
  } catch (e) {
    console.error('registerWebPush:', e.message);
    return null;
  }
}

// ส่ง Web Push ผ่าน backend (ต้องเซ็นด้วย VAPID private key ฝั่งเซิร์ฟเวอร์) — เรียกจากแอดมินตอนเรียกคิว
// ไม่ใส่ title/body จะใช้ข้อความเรียกคิวแบบเดิม (กำหนดค่าเริ่มต้นที่ backend)
export async function sendWebPush(subscription, queueNumber, title, body) {
  if (!subscription) return;

  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return;

    await fetch(`${API_BASE_URL}/api/admin/send-web-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ subscription, queueNumber, title, body }),
    });
  } catch (e) {
    console.error('sendWebPush:', e.message);
  }
}
