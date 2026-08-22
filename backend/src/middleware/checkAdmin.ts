import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebaseAdmin';

export const ALLOWED_ADMIN_EMAILS = ['nasnee1997@gmail.com'];

export interface AuthedRequest extends Request {
  user?: { uid: string; email: string | null };
}

export async function checkAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'ไม่มี token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await auth.verifyIdToken(token);
    const email = decoded.email || null;

    if (!email || !ALLOWED_ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง' });
    }

    req.user = { uid: decoded.uid, email };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'token ไม่ถูกต้อง' });
  }
}
