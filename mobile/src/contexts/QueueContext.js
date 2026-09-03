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
  const [myScheduledQueues, setMyScheduledQueues] = useState([]); // จองล่วงหน้าไว้ได้หลายใบพร้อมกัน แยกจากคิวที่กำลังรอวันนี้
  const [callAlert, setCallAlert] = useState(false);
  const [preWarning, setPreWarning] = useState(false);
  const [acceptingQueue, setAcceptingQueue] = useState(true);
  const [callingNumber, setCallingNumber] = useState(null);
  const [notifications, setNotifications] = useState([]); // [{ id, message, time, read }]
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [preAlertEnabled, setPreAlertEnabled] = useState(true);
  const prevStatusRef = useRef(null);
  const lastCallingAtRef = useRef(null); // เวลาที่ "เรียก" ครั้งล่าสุดที่เด้งแจ้งเตือนไปแล้ว กันเด้งซ้ำจาก snapshot เดิม
  const preWarnedRef = useRef(false); // กันยิงเตือนล่วงหน้าซ้ำระหว่างที่ยังห่างกัน 2 คิวอยู่

  // receipt (ถ้ามี) แนบไว้กับแจ้งเตือน "รับของเสร็จ" ให้กดย้อนดูใบเสร็จได้ทีหลังจากหน้าแจ้งเตือน
  const pushNotification = (message, receipt = null) => {
    setNotifications((prev) => [
      { id: `${Date.now()}-${Math.random()}`, message, time: new Date(), read: false, receipt },
      ...prev,
    ]);
  };

  // แปลง doc คิว/ออเดอร์ที่เพิ่งเสร็จให้เป็นข้อมูลใบเสร็จ เก็บไว้ในตัวแจ้งเตือนเลย เผื่อกดย้อนดูทีหลัง
  // (ไม่พึ่งพา myQueue/myScheduledQueues เพราะพอ "เสร็จ" แล้วรายการนั้นจะถูกลบออกจาก state เดิมทันที)
  const buildReceipt = (data) => {
    if (!(data.saleAmount > 0)) return null;
    const doneTime = data.doneAt?.toDate
      ? data.doneAt.toDate().toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    return {
      queueNumber: data.number ?? null,
      amount: data.saleAmount,
      paymentMethod: data.paymentMethod,
      paidAt: doneTime,
      lines: data.items?.map((i) => ({ left: `${i.name} × ${i.qty}`, right: `฿${i.price * i.qty}` })) || [],
    };
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
          number: data.number ?? prev?.number ?? null,
          saleAmount: data.saleAmount ?? prev?.saleAmount ?? null,
          paymentMethod: data.paymentMethod ?? prev?.paymentMethod ?? null,
          doneAt: data.doneAt ?? prev?.doneAt ?? null,
        }));

        // ดูจากเวลาที่ร้านกดเรียก ไม่ใช่แค่การเปลี่ยนสถานะ — เรียกซ้ำสถานะยังเป็น 'calling' เหมือนเดิม
        // ถ้าเช็คแค่ prevStatus จะไม่มีอะไรเด้งขึ้นเลยตอนร้านกดเรียกรอบสอง
        const callingAtMs = data.callingAt?.toMillis ? data.callingAt.toMillis() : null;
        const isNewCall =
          newStatus === 'calling' && callingAtMs != null && callingAtMs !== lastCallingAtRef.current;

        if (isNewCall) {
          lastCallingAtRef.current = callingAtMs;
          vibrate([0, 400, 150, 400, 150, 400]);
          speak(`ถึงคิวของคุณแล้ว หมายเลข ${data.number} กรุณามาที่เคาน์เตอร์`);
          setPreWarning(false);
          setCallAlert(true);
          pushNotification(`🔔 ถึงคิวของคุณแล้ว! หมายเลข ${data.number} กรุณามาที่เคาน์เตอร์`);
        } else if (prevStatusRef.current !== 'done' && newStatus === 'done') {
          pushNotification(`✅ คิวหมายเลข ${data.number} เสร็จสิ้นแล้ว ขอบคุณที่ใช้บริการ`, buildReceipt(data));
        } else if (prevStatusRef.current === 'scheduled' && newStatus === 'waiting') {
          pushNotification(`📋 ถึงวันนัดแล้ว! คิวของคุณคือหมายเลข ${data.number}`);
        }

        prevStatusRef.current = newStatus;
      },
      (error) => console.error('QueueContext:', error.message)
    );

    return unsub;
  }, [myQueue?.id]);

  // ฟังสถานะออเดอร์สั่งล่วงหน้าแต่ละใบ — ไม่มีเลขคิว รอแอดมินกดว่าเตรียมเสร็จ (ready) แล้วค่อยกดว่ารับแล้ว (done)
  const scheduledIds = myScheduledQueues.map((q) => q.id).join(',');
  useEffect(() => {
    if (!scheduledIds) return undefined;
    const ids = scheduledIds.split(',');
    const unsubs = ids.map((id) =>
      onSnapshot(doc(db, 'queues', id), (snap) => {
        if (!snap.exists()) {
          setMyScheduledQueues((prev) => prev.filter((q) => q.id !== id));
          return;
        }
        const data = snap.data();
        setMyScheduledQueues((prev) => {
          const prevStatus = prev.find((q) => q.id === id)?.status;

          if (data.status === 'cancelled') {
            return prev.filter((q) => q.id !== id);
          }
          if (data.status === 'done') {
            if (prevStatus !== 'done') {
              pushNotification('✅ รับออเดอร์เรียบร้อยแล้ว ขอบคุณที่ใช้บริการ', buildReceipt(data));
            }
            return prev.filter((q) => q.id !== id);
          }
          if (data.status === 'ready' && prevStatus !== 'ready') {
            vibrate([0, 400, 150, 400, 150, 400]);
            speak('ออเดอร์ของคุณพร้อมแล้ว มารับได้เลยจ้า');
            pushNotification('🎉 ออเดอร์ของคุณพร้อมแล้ว! มารับได้เลยที่ร้าน');
          }
          return prev.map((q) => (q.id === id ? { ...q, ...data } : q));
        });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [scheduledIds]);

  const addScheduledQueue = (queue) => {
    setMyScheduledQueues((prev) => [...prev, { status: 'scheduled', ...queue }]);
  };

  const removeScheduledQueue = (id) => {
    setMyScheduledQueues((prev) => prev.filter((q) => q.id !== id));
  };

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

  // รับคิวใหม่ — รับอ็อบเจกต์เต็ม (id, number) จากปุ่มรับคิวด่วน
  const takeQueue = (queue) => {
    prevStatusRef.current = queue.status || 'waiting';
    preWarnedRef.current = false;
    lastCallingAtRef.current = null;
    setCallAlert(false);
    setPreWarning(false);
    setMyQueue({ status: 'waiting', ...queue });
  };

  const clearQueue = () => {
    prevStatusRef.current = null;
    preWarnedRef.current = false;
    lastCallingAtRef.current = null;
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
        myScheduledQueues,
        addScheduledQueue,
        removeScheduledQueue,
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
