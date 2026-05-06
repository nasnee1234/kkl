import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const queueCounterRef = doc(db, 'counters', 'queues');

async function getHighestExistingQueueNumber() {
  const latestQueueQuery = query(
    collection(db, 'queues'),
    orderBy('number', 'desc'),
    limit(1)
  );
  const snapshot = await getDocs(latestQueueQuery);
  if (snapshot.empty) return 0;

  return Number(snapshot.docs[0].data().number) || 0;
}

export async function createQueueWithNumber(queueData) {
  const existingMaxNumber = await getHighestExistingQueueNumber();

  return runTransaction(db, async (transaction) => {
    const counterSnapshot = await transaction.get(queueCounterRef);
    const counterNumber = counterSnapshot.exists()
      ? Number(counterSnapshot.data().lastNumber) || 0
      : 0;
    const nextNumber = Math.max(counterNumber, existingMaxNumber) + 1;
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
