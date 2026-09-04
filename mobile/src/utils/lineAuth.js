import { Platform } from 'react-native';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebase';
import { API_BASE_URL } from '../config/api';

// ยืนยันตัวตนคนสั่งล่วงหน้าด้วย "เข้าสู่ระบบด้วย LINE" แทนเบอร์โทร+OTP — ฟรี ไม่ต้องเปิดบิลลิ่ง Firebase
// และคนไทยส่วนใหญ่คุ้นเคยกับการล็อกอิน LINE อยู่แล้ว บัญชี LINE จริงพิสูจน์ตัวตนได้แน่นหนากว่าเบอร์ที่พิมพ์เอง
//
// เดสก์ท็อป: เปิดหน้า LINE ใน popup เพื่อไม่ให้ข้อมูลที่กรอกในฟอร์มสั่งของหายระหว่างล็อกอิน
// มือถือ: ต้อง redirect เต็มหน้าแทน popup เพราะ LINE บนมือถือมักดีดไปเปิดแอป LINE จริง (auto login)
// แล้วพากลับมาด้วยการ navigate ปกติ ไม่ใช่ผ่านหน้าต่าง popup ที่ JS ควบคุมได้
//
// มือถือลองล็อกอินผ่านแอป LINE จริงก่อนเสมอ (เนียนสุดสำหรับคนที่ล็อกอิน LINE ค้างอยู่แล้วในเครื่อง)
// ถ้าล้มเหลว (LINE เรียกว่า "auto login failure" — สังเกตได้จาก state ที่ callback ไม่ตรงกับที่ส่งไป
// ตามเอกสาร https://developers.line.biz/en/docs/line-login/how-to-handle-auto-login-failure/)
// จะ redirect ซ้ำอีกครั้งด้วย disable_auto_login=true ให้ใช้หน้าเว็บล็อกอินแทนแบบเงียบๆ ไม่ต้องให้ลูกค้ากดเอง
const LINE_CHANNEL_ID = process.env.EXPO_PUBLIC_LINE_CHANNEL_ID || '';
const STATE_KEY = 'kkl_line_login_state';
const RESUME_KEY = 'kkl_line_resume_booking';
const RETRY_KEY = 'kkl_line_retried';

function isMobileBrowser() {
  return /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent || '');
}

function getRedirectUri() {
  return `${window.location.origin}/`;
}

function buildAuthUrl(state, { disableAutoLogin } = {}) {
  // nonce: บาง build ของแอป LINE เข้มงวดกับ request ที่ขอ scope openid โดยไม่มี nonce มากกว่าฝั่งเว็บ
  // เราไม่ได้ใช้ตรวจ replay attack เพิ่มจริงจัง แค่ใส่ไว้กันเคส auto-login ค้าง/พังที่ไม่ทราบสาเหตุ
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return (
    `https://access.line.me/oauth2/v2.1/authorize` +
    (disableAutoLogin ? `?disable_auto_login=true&` : `?`) +
    `response_type=code&client_id=${encodeURIComponent(LINE_CHANNEL_ID)}` +
    `&redirect_uri=${encodeURIComponent(getRedirectUri())}` +
    `&state=${encodeURIComponent(state)}` +
    `&nonce=${encodeURIComponent(nonce)}` +
    `&scope=${encodeURIComponent('profile openid')}`
  );
}

function redirectToLine({ disableAutoLogin, keepResume }) {
  const state = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(STATE_KEY, state);
  if (!keepResume) window.sessionStorage.setItem(RESUME_KEY, '1');
  window.location.href = buildAuthUrl(state, { disableAutoLogin });
}

async function exchangeCode(code, redirectUri) {
  const res = await fetch(`${API_BASE_URL}/api/auth/line/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri }),
  });
  if (!res.ok) throw new Error('EXCHANGE_FAILED');
  const data = await res.json();
  await signInWithCustomToken(auth, data.customToken);
  return { name: data.name || '', picture: data.picture || null };
}

export function isLineVerified() {
  return !!auth.currentUser?.uid?.startsWith('line:');
}

// เรียกตอนหน้าจอโหลด — เช็คว่าเพิ่งกลับมาจากการ redirect ไปล็อกอิน LINE บนมือถือหรือเปล่า
// คืนค่า null ถ้าไม่ได้เพิ่งกลับมาจาก redirect (กรณีปกติ) หรือถ้ากำลัง retry อยู่เงียบๆ (หน้าจะ navigate ออกไปเอง)
export async function consumeLineRedirectResult() {
  if (Platform.OS !== 'web') return null;
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  if (!code || !returnedState) return null;

  // เคลียร์ query string ออกจาก URL ทันทีไม่ว่าผลจะเป็นยังไง กันคนกด refresh แล้วยิงซ้ำ
  window.history.replaceState({}, '', window.location.pathname);

  const savedState = window.sessionStorage.getItem(STATE_KEY);

  if (returnedState !== savedState) {
    // auto login ล้มเหลว — ลอง fallback ด้วย disable_auto_login=true แบบเงียบๆ ครั้งเดียว
    const alreadyRetried = window.sessionStorage.getItem(RETRY_KEY) === '1';
    if (!alreadyRetried) {
      window.sessionStorage.setItem(RETRY_KEY, '1');
      redirectToLine({ disableAutoLogin: true, keepResume: true });
      return null;
    }
    window.sessionStorage.removeItem(RESUME_KEY);
    window.sessionStorage.removeItem(RETRY_KEY);
    throw new Error('STATE_MISMATCH');
  }

  const shouldResume = window.sessionStorage.getItem(RESUME_KEY) === '1';
  window.sessionStorage.removeItem(RESUME_KEY);
  window.sessionStorage.removeItem(RETRY_KEY);

  const profile = await exchangeCode(code, getRedirectUri());
  return { ...profile, shouldResume };
}

// ทางลัดสำรอง — ให้ลูกค้ากดเองถ้าลองกด "เข้าสู่ระบบด้วย LINE" ปกติแล้วแอป LINE ค้าง/error
// ข้ามการดีดไปแอป LINE จริงไปเลย ใช้หน้าเว็บล็อกอินของ LINE ตรงๆ (เชื่อถือได้กว่าแต่ไม่เนียนเท่า)
export function loginWithLineWebOnly() {
  if (Platform.OS !== 'web' || !LINE_CHANNEL_ID) return;
  window.sessionStorage.removeItem(RETRY_KEY);
  redirectToLine({ disableAutoLogin: true });
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

    if (isMobileBrowser()) {
      // มือถือ: redirect เต็มหน้าไปเลย ไม่ใช้ popup — ลองล็อกอินผ่านแอป LINE จริงก่อน (เนียนกว่า)
      // หน้านี้จะ navigate ออกไป promise นี้จึงค้างไว้เฉยๆ ไม่ resolve/reject
      window.sessionStorage.removeItem(RETRY_KEY);
      redirectToLine({ disableAutoLogin: false });
      return;
    }

    const state = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(STATE_KEY, state);
    const redirectUri = getRedirectUri();
    // เดสก์ท็อป: ใช้ disable_auto_login เสมอ เพราะ popup ปิดตัวเองอัตโนมัติแบบที่ทำอยู่ไม่รองรับ
    // การถูกสลับไปแอปเดสก์ท็อปของ LINE (ถ้ามี) อยู่แล้ว
    const authUrl = buildAuthUrl(state, { disableAutoLogin: true });

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
          const profile = await exchangeCode(code, redirectUri);
          resolve(profile);
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
