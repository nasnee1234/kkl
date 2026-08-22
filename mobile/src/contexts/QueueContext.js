import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform, Vibration } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import * as Speech from 'expo-speech';
import * as Notifications from 'expo-notifications';
import { db } from '../config/firebase';
import { setupNotificationChannel } from '../utils/notifications';
import { STATUS_THEME } from '../theme/colors';

const QueueContext = createContext(null);

// เดิมนิยามซ้ำในไฟล์นี้ — ย้ายไปรวมไว้ที่ theme/colors.js แล้ว ใช้ค่ากลางร่วมกับหน้าอื่น
export const STATUS_LABEL = STATUS_THEME;

const MIN_PER_QUEUE = 3; // นาทีโดยประมาณต่อคิว (ค่าประมาณ ไม่ผูกกับเวลาเสิร์ฟจริง)
const QUEUE_AHEAD_NORMALIZE = 4; // ใช้คำนวณ % ของวงแหวนนับถอยหลังเท่านั้น

export function QueueProvider({ children }) {
  const [myQueue, setMyQueue] = useState(null);
  const [callAlert, setCallAlert] = useState(false);
  const [preWarning, setPreWarning] = useState(false);
  const [acceptingQueue, setAcceptingQueue] = useState(true);
  const [callingNumber, setCallingNumber] = useState(null);
  const [notifications, setNotifications] = useState([]); // [{ id, message, time, read }]
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [preAlertEnabled, setPreAlertEnabled] = useState(true);
  const prevStatusRef = useRef(null);
  const preWarnedRef = useRef(false); // กันยิงเตือนล่วงหน้าซ้ำระหว่างที่ยังห่างกัน 2 คิวอยู่

  const pushNotification = (message) => {
    setNotifications((prev) => [
      { id: `${Date.now()}-${Math.random()}`, message, time: new Date(), read: false },
      ...prev,
    ]);
  };

  const markNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleSound = () => setSoundEnabled((v) => !v);
  const toggleVibrate = () => setVibrateEnabled((v) => !v);
  const togglePreAlert = () => setPreAlertEnabled((v) => !v);

  const vibrate = (pattern) => {
    if (vibrateEnabled) Vibration.vibrate(pattern);
  };
  const speak = (text) => {
    if (soundEnabled) Speech.speak(text, { language: 'th', rate: 0.9 });
  };

  // ตั้งค่า channel และ handler ครั้งเดียวตอน mount
  useEffect(() => {
    if (Platform.OS === 'web') {
      return undefined;
    }

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

  // ฟังสถานะร้าน (เปิด/ปิดรับคิว + ตอนนี้เรียกถึงคิวไหนแล้ว) — ทำงานตลอดไม่ว่าจะมีคิวอยู่หรือไม่
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'meta', 'queueStatus'),
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        setCallingNumber(data.callingNumber ?? null);
        setAcceptingQueue(data.acceptingQueue !== false); // ยังไม่มี doc/field ถือว่าเปิดรับตามปกติ
      },
      // ยังไม่มี doc นี้หรือยังไม่มีสิทธิ์อ่าน (เช่นตอน rules ยังไม่ publish) — เงียบไว้ ไม่ทำให้แอป crash
      () => {}
    );
    return unsub;
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
          paymentMethod: data.paymentMethod ?? prev?.paymentMethod ?? null,
          doneAt: data.doneAt ?? prev?.doneAt ?? null,
        }));

        if (prevStatusRef.current !== 'calling' && newStatus === 'calling') {
          vibrate([0, 400, 150, 400, 150, 400]);
          speak(`ถึงคิวของคุณแล้ว หมายเลข ${myQueue.number} กรุณามาที่เคาน์เตอร์`);
          setPreWarning(false);
          setCallAlert(true);
          pushNotification(`🔔 ถึงคิวของคุณแล้ว! หมายเลข ${myQueue.number} กรุณามาที่เคาน์เตอร์`);
        } else if (prevStatusRef.current !== 'done' && newStatus === 'done') {
          pushNotification(`✅ คิวหมายเลข ${myQueue.number} เสร็จสิ้นแล้ว ขอบคุณที่ใช้บริการ`);
        }

        prevStatusRef.current = newStatus;
      },
      (error) => console.error('QueueContext:', error.message)
    );

    return unsub;
  }, [myQueue?.id]);

  // คำนวณ "อีกกี่คิวถึงตัวเอง" จาก callingNumber กลาง เพื่อเตือนล่วงหน้า 2 คิว
  useEffect(() => {
    if (!myQueue?.id || myQueue.status !== 'waiting' || callingNumber == null) {
      if (myQueue?.status !== 'waiting') preWarnedRef.current = false;
      return;
    }
    if (!preAlertEnabled) return;

    const aheadCount = myQueue.number - callingNumber;
    if (aheadCount === 2 && !preWarnedRef.current) {
      preWarnedRef.current = true;
      vibrate([0, 200, 100, 200]);
      speak('อีก 2 คิวจะถึงคุณแล้ว เตรียมตัวได้เลย');
      setPreWarning(true);
      pushNotification('⏰ อีก 2 คิวจะถึงคุณแล้ว เตรียมตัวได้เลย');
    } else if (aheadCount > 2) {
      preWarnedRef.current = false;
    }
  }, [callingNumber, myQueue?.id, myQueue?.status, myQueue?.number, preAlertEnabled]);

  // รับคิวใหม่ — รับอ็อบเจกต์เต็ม (id, number, items, phone) จากหน้า Checkout หรือปุ่มรับคิวด่วน
  const takeQueue = (queue) => {
    prevStatusRef.current = 'waiting';
    preWarnedRef.current = false;
    setCallAlert(false);
    setPreWarning(false);
    setMyQueue({ status: 'waiting', ...queue });
  };

  const clearQueue = () => {
    prevStatusRef.current = null;
    preWarnedRef.current = false;
    setCallAlert(false);
    setPreWarning(false);
    setMyQueue(null);
  };

  const dismissCallAlert = () => setCallAlert(false);
  const dismissPreWarning = () => setPreWarning(false);

  // สรุปความคืบหน้าคิว — ใช้ร่วมกันทั้งหน้า Home และ คิวของฉัน
  let queueProgress = { aheadCount: null, pct: 0, deg: 0, etaMinutes: 0, etaLabel: 'กำลังรอเรียกคิว' };
  if (myQueue?.status === 'waiting' && callingNumber != null) {
    const aheadCount = Math.max(0, myQueue.number - callingNumber);
    const pct = Math.max(0, Math.min(100, Math.round(100 * (1 - aheadCount / QUEUE_AHEAD_NORMALIZE))));
    const etaMinutes = aheadCount * MIN_PER_QUEUE;
    queueProgress = {
      aheadCount,
      pct,
      deg: Math.round(pct * 3.6),
      etaMinutes,
      etaLabel: aheadCount === 0 ? 'ถึงคิวคุณแล้ว' : `อีก ${etaMinutes} นาที`,
    };
  }

  return (
    <QueueContext.Provider
      value={{
        myQueue,
        takeQueue,
        clearQueue,
        STATUS_LABEL,
        callAlert,
        preWarning,
        dismissCallAlert,
        dismissPreWarning,
        acceptingQueue,
        callingNumber,
        notifications,
        markNotificationsRead,
        soundEnabled,
        vibrateEnabled,
        preAlertEnabled,
        toggleSound,
        toggleVibrate,
        togglePreAlert,
        queueProgress,
        MIN_PER_QUEUE,
        QUEUE_AHEAD_NORMALIZE,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export const useQueue = () => useContext(QueueContext);
