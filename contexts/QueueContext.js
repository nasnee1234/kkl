import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert, Vibration } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import * as Speech from 'expo-speech';
import * as Notifications from 'expo-notifications';
import { db } from '../firebase';
import { setupNotificationChannel } from '../utils/notifications';

const QueueContext = createContext(null);

export const STATUS_LABEL = {
  waiting:   { text: 'กำลังรอคิว',        color: '#f59e0b', bg: '#fef3c7' },
  calling:   { text: 'ถึงคิวของคุณแล้ว!', color: '#1d4ed8', bg: '#dbeafe' },
  done:      { text: 'เสร็จสิ้น',           color: '#6b7280', bg: '#f3f4f6' },
  cancelled: { text: 'ถูกยกเลิก',           color: '#ef4444', bg: '#fee2e2' },
};

export function QueueProvider({ children }) {
  const [myQueue, setMyQueue] = useState(null);
  const prevStatusRef = useRef(null);

  // ตั้งค่า channel และ handler ครั้งเดียวตอน mount
  useEffect(() => {
    setupNotificationChannel();

    // แสดง notification แม้แอปเปิดอยู่
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // เมื่อผู้ใช้กด notification จากนอกแอป
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.queueNumber) {
        // แอปเปิดขึ้นมา → อัปเดตสถานะใน context
        setMyQueue((prev) =>
          prev ? { ...prev, status: 'calling' } : null
        );
      }
    });

    return () => sub.remove();
  }, []);

  // ฟัง Firestore เมื่อมีคิว (สำหรับกรณีแอปเปิดอยู่)
  useEffect(() => {
    if (!myQueue?.id) return;

    const unsub = onSnapshot(
      doc(db, 'queues', myQueue.id),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const newStatus = data.status;
        setMyQueue((prev) => ({
          ...prev,
          status: newStatus,
          saleAmount: data.saleAmount ?? prev?.saleAmount ?? null,
          doneAt: data.doneAt ?? prev?.doneAt ?? null,
        }));

        if (prevStatusRef.current !== 'calling' && newStatus === 'calling') {
          Vibration.vibrate([0, 400, 150, 400, 150, 400]);
          Speech.speak(
            `ถึงคิวของคุณแล้ว หมายเลข ${myQueue.number} กรุณามาที่เคาน์เตอร์`,
            { language: 'th', rate: 0.9 }
          );
          Alert.alert(
            '🔔 ถึงคิวของคุณแล้ว!',
            `คิวหมายเลข ${myQueue.number}\nกรุณามาที่เคาน์เตอร์`,
            [{ text: 'รับทราบ' }]
          );
        }

        prevStatusRef.current = newStatus;
      },
      (error) => console.error('QueueContext:', error.message)
    );

    return unsub;
  }, [myQueue?.id]);

  const takeQueue = (id, number) => {
    prevStatusRef.current = 'waiting';
    setMyQueue({ id, number, status: 'waiting' });
  };

  const clearQueue = () => {
    prevStatusRef.current = null;
    setMyQueue(null);
  };

  return (
    <QueueContext.Provider value={{ myQueue, takeQueue, clearQueue, STATUS_LABEL }}>
      {children}
    </QueueContext.Provider>
  );
}

export const useQueue = () => useContext(QueueContext);
