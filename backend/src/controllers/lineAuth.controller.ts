import { Request, Response } from 'express';
import { env } from '../config/env';
import { auth } from '../config/firebaseAdmin';

// แลก authorization code จาก LINE Login เป็นตัวตนที่ยืนยันแล้ว แล้วออก Firebase custom token กลับไป
// ต้องทำฝั่งเซิร์ฟเวอร์เท่านั้นเพราะต้องใช้ channel secret (ห้ามหลุดไปฝั่งเว็บ/แอป)
export async function exchangeLineCode(req: Request, res: Response) {
  const { code, redirectUri } = req.body || {};
  if (!code || !redirectUri) {
    res.status(400).json({ error: 'MISSING_PARAMS' });
    return;
  }
  if (!env.line.channelId || !env.line.channelSecret) {
    res.status(500).json({ error: 'LINE_NOT_CONFIGURED' });
    return;
  }

  try {
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: env.line.channelId,
        client_secret: env.line.channelSecret,
      }),
    });
    const tokenData: any = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.id_token) {
      res.status(400).json({ error: 'LINE_TOKEN_EXCHANGE_FAILED', detail: tokenData });
      return;
    }

    // verify + decode id_token ผ่าน endpoint ของ LINE เอง ไม่ต้องจัดการ JWKS/เซ็นชื่อเอง
    const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        id_token: tokenData.id_token,
        client_id: env.line.channelId,
      }),
    });
    const profile: any = await verifyRes.json();
    if (!verifyRes.ok || !profile.sub) {
      res.status(400).json({ error: 'LINE_VERIFY_FAILED', detail: profile });
      return;
    }

    const uid = `line:${profile.sub}`;
    const customToken = await auth.createCustomToken(uid);
    res.json({ customToken, name: profile.name || '', picture: profile.picture || null });
  } catch (e) {
    res.status(500).json({ error: 'LINE_EXCHANGE_ERROR' });
  }
}
