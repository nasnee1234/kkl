import { Platform } from 'react-native';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebase';
import { API_BASE_URL } from '../config/api';

// ยืนยันตัวตนคนสั่งล่วงหน้าด้วย "เข้าสู่ระบบด้วย LINE" แทนเบอร์โทร+OTP — ฟรี ไม่ต้องเปิดบิลลิ่ง Firebase
// และคนไทยส่วนใหญ่คุ้นเคยกับการล็อกอิน LINE อยู่แล้ว บัญชี LINE จริงพิสูจน์ตัวตนได้แน่นหนากว่าเบอร์ที่พิมพ์เอง
// เปิดหน้า LINE ใน popup แทนการ redirect เต็มหน้า เพื่อไม่ให้ข้อมูลที่กรอกในฟอร์มสั่งของหายระหว่างล็อกอิน
const LINE_CHANNEL_ID = process.env.EXPO_PUBLIC_LINE_CHANNEL_ID || '';
const STATE_KEY = 'kkl_line_login_state';

function getRedirectUri() {
  return `${window.location.origin}/`;
}

export function isLineVerified() {
  return !!auth.currentUser?.uid?.startsWith('line:');
}

export function loginWithLine() {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'web') {
      reject(new Error('LINE_LOGIN_WEB_ONLY'));
      return;
    }
    if (!LINE_CHANNEL_ID) {
      reject(new Error('LINE_NOT_CONFIGURED'));
      return;
    }

    const state = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(STATE_KEY, state);
    const redirectUri = getRedirectUri();
    const authUrl =
      `https://access.line.me/oauth2/v2.1/authorize` +
      `?response_type=code&client_id=${encodeURIComponent(LINE_CHANNEL_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=${encodeURIComponent('profile openid')}`;

    const popup = window.open(authUrl, 'line_login', 'width=420,height=640');
    if (!popup) {
      reject(new Error('POPUP_BLOCKED'));
      return;
    }

    const timer = setInterval(async () => {
      let href = null;
      try {
        href = popup.location.href;
      } catch (e) {
        // ยังอยู่หน้า access.line.me (คนละ origin) — อ่าน location ไม่ได้ตามปกติ รอรอบถัดไป
      }

      if (popup.closed) {
        clearInterval(timer);
        reject(new Error('POPUP_CLOSED'));
        return;
      }

      if (href && href.startsWith(window.location.origin)) {
        clearInterval(timer);
        popup.close();

        const url = new URL(href);
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        const savedState = window.sessionStorage.getItem(STATE_KEY);
        window.sessionStorage.removeItem(STATE_KEY);

        if (!code || !returnedState || returnedState !== savedState) {
          reject(new Error('STATE_MISMATCH'));
          return;
        }

        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/line/exchange`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri }),
          });
          if (!res.ok) throw new Error('EXCHANGE_FAILED');
          const data = await res.json();
          await signInWithCustomToken(auth, data.customToken);
          resolve({ name: data.name || '', picture: data.picture || null });
        } catch (e) {
          reject(e);
        }
      }
    }, 500);
  });
}

const ERROR_MESSAGES = {
  POPUP_BLOCKED: 'เบราว์เซอร์บล็อกป๊อปอัพ กรุณาอนุญาตป๊อปอัพแล้วลองใหม่',
  POPUP_CLOSED: 'ปิดหน้าต่างล็อกอินก่อนยืนยันเสร็จ กรุณาลองใหม่',
  STATE_MISMATCH: 'ยืนยันตัวตนไม่สำเร็จ กรุณาลองใหม่',
  EXCHANGE_FAILED: 'เชื่อมต่อ LINE ไม่สำเร็จ กรุณาลองใหม่',
  LINE_NOT_CONFIGURED: 'ระบบเข้าสู่ระบบด้วย LINE ยังไม่เปิดใช้งาน กรุณาติดต่อร้าน',
};

export function lineAuthErrorMessage(e) {
  return ERROR_MESSAGES[e?.message] || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}
