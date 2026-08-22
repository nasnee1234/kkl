import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 4000,
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    // .env เก็บ private key เป็น string บรรทัดเดียว ต้องแปลง \n กลับเป็นตัวขึ้นบรรทัดจริง
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || '',
  },
};
