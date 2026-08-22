// URL ของ backend (Express) — ใช้ตอนเว็บส่ง Web Push ผ่าน VAPID (ต้องเซ็นด้วย private key ฝั่งเซิร์ฟเวอร์เท่านั้น)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
