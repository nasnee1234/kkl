import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const queueCounterRef = doc(db, 'counters', 'queues');

// จำนวนคิวสูงสุดต่อรอบ (1 รอบ = ตั้งแต่กด "เริ่มคิวใหม่" ครั้งล่าสุด) — แอดมินกำหนดไว้ที่ 700
export const MAX_QUEUE_PER_DAY = 700;

// จัดรูปแบบเลขคิวให้อ่านง่าย เช่น 12 -> "A12" (ใช้แสดงผลเท่านั้น ไม่กระทบข้อมูลจริง)
export function formatQueueLabel(number) {
  if (number == null) return '—';
  return 'A' + String(number).padStart(2, '0');
}

export async function createQueueWithNumber(queueData) {
  return runTransaction(db, async (transaction) => {
    const counterSnapshot = await transaction.get(queueCounterRef);
    const counterNumber = counterSnapshot.exists()
      ? Number(counterSnapshot.data().lastNumber) || 0
      : 0;
    const nextNumber = counterNumber + 1;

    if (nextNumber > MAX_QUEUE_PER_DAY) {
      const err = new Error(`คิวเต็มแล้วสำหรับวันนี้ (สูงสุด ${MAX_QUEUE_PER_DAY} คิว)`);
      err.code = 'QUEUE_FULL';
      throw err;
    }

    const queueRef = doc(collection(db, 'queues'));

    transaction.set(
      queueCounterRef,
      {
        lastNumber: nextNumber,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    transaction.set(queueRef, {
      ...queueData,
      number: nextNumber,
    });

    return { id: queueRef.id, number: nextNumber };
  });
}
