import { Response } from 'express';
import { AuthedRequest } from '../middleware/checkAdmin';
import webpush from '../config/webPush';

export function verifyAdmin(req: AuthedRequest, res: Response) {
  res.json({ success: true, email: req.user?.email });
}

export async function sendWebPush(req: AuthedRequest, res: Response) {
  const { subscription, queueNumber } = req.body;

  if (!subscription?.endpoint) {
    return res.status(400).json({ success: false, message: 'subscription ไม่ถูกต้อง' });
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: '🔔 ถึงคิวของคุณแล้ว!',
        body: `คิวหมายเลข ${queueNumber} — กรุณามาที่เคาน์เตอร์`,
        data: { queueNumber },
      })
    );
    res.json({ success: true });
  } catch (e) {
    // subscription หมดอายุ/ถูกยกเลิกจากฝั่งเบราว์เซอร์ — ไม่ใช่ error ร้ายแรง แค่ส่งไม่สำเร็จรอบนี้
    res.status(200).json({ success: false, message: (e as Error).message });
  }
}
