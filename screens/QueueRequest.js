import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, addDoc, getDocs, serverTimestamp, query, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useQueue } from '../contexts/QueueContext';
import { registerForPushNotifications } from '../utils/notifications';

const STATUS_ICON = {
  waiting:   { icon: 'time-outline',             color: '#f59e0b', bg: '#fef3c7' },
  calling:   { icon: 'megaphone-outline',         color: '#1d4ed8', bg: '#dbeafe' },
  done:      { icon: 'checkmark-circle-outline',  color: '#6b7280', bg: '#f3f4f6' },
  cancelled: { icon: 'close-circle-outline',      color: '#ef4444', bg: '#fee2e2' },
};

export default function QueueRequest() {
  const { myQueue, takeQueue, clearQueue, STATUS_LABEL } = useQueue();
  const [pressed, setPressed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);

  const handleTakeQueue = () => setPressed(true);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // ดึง push token ของอุปกรณ์นี้
      const pushToken = await registerForPushNotifications();

      const q = query(collection(db, 'queues'), orderBy('number', 'desc'), limit(1));
      const snap = await getDocs(q);
      const nextNumber = snap.empty ? 1 : snap.docs[0].data().number + 1;

      const docRef = await addDoc(collection(db, 'queues'), {
        number: nextNumber,
        customerName: 'ลูกค้า',
        status: 'waiting',
        pushToken: pushToken || null, // เก็บ token ไว้ให้ admin ใช้ส่ง push
        createdAt: serverTimestamp(),
      });

      takeQueue(docRef.id, nextNumber);
      setPressed(false);
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถรับคิวได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  // มีคิวอยู่แล้ว — แสดงสถานะ realtime
  if (myQueue) {
    const status = myQueue.status || 'waiting';
    const cfg = STATUS_ICON[status] || STATUS_ICON.waiting;
    const lbl = STATUS_LABEL[status];
    const isCalling = status === 'calling';
    const isDone = status === 'done' || status === 'cancelled';
    const showReceipt = status === 'done' && myQueue.saleAmount != null && myQueue.saleAmount > 0;

    const doneTime = myQueue.doneAt?.toDate
      ? myQueue.doneAt.toDate().toLocaleString('th-TH', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
      : new Date().toLocaleString('th-TH', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        });

    return (
      <View style={styles.container}>
        <View style={styles.statusBox}>
          {/* หมายเลขคิว */}
          <Text style={styles.queueLabel}>หมายเลขคิวของคุณ</Text>
          <Text style={styles.queueNumber}>{myQueue.number}</Text>

          {/* สถานะ */}
          <View style={[styles.statusCard, { backgroundColor: lbl.bg }, isCalling && styles.statusCardPulse]}>
            <Ionicons name={cfg.icon} size={28} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{lbl.text}</Text>
          </View>

          {/* ข้อความเสริม */}
          {status === 'waiting' && (
            <Text style={styles.note}>กรุณารอเรียกหมายเลขของคุณ</Text>
          )}
          {isCalling && (
            <Text style={[styles.note, { color: '#1d4ed8', fontWeight: '700' }]}>
              กรุณามาที่เคาน์เตอร์ทันที!
            </Text>
          )}
          {isDone && (
            <Text style={styles.note}>
              {status === 'done' ? 'ขอบคุณที่ใช้บริการ' : 'คิวถูกยกเลิกแล้ว'}
            </Text>
          )}

          {/* ปุ่มดูใบเสร็จ */}
          {showReceipt && (
            <TouchableOpacity style={styles.receiptBtn} onPress={() => setReceiptVisible(true)}>
              <Ionicons name="receipt-outline" size={18} color="#059669" />
              <Text style={styles.receiptBtnText}>ดูใบเสร็จ</Text>
            </TouchableOpacity>
          )}

          {/* ปุ่มรับคิวใหม่ (เฉพาะเมื่อเสร็จหรือยกเลิก) */}
          {isDone && (
            <TouchableOpacity style={styles.resetBtn} onPress={clearQueue}>
              <Text style={styles.resetBtnText}>รับคิวใหม่</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Modal ใบเสร็จ */}
        <Modal visible={receiptVisible} transparent animationType="fade">
          <View style={styles.receiptOverlay}>
            <ScrollView contentContainerStyle={styles.receiptScroll}>
              <View style={styles.receiptBox}>
                {/* Header */}
                <View style={styles.receiptHeader}>
                  <Ionicons name="storefront-outline" size={32} color="#b45309" />
                  <Text style={styles.receiptShop}>ร้านของเรา</Text>
                  <Text style={styles.receiptSub}>ใบเสร็จรับเงิน</Text>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Info */}
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>หมายเลขคิว</Text>
                  <Text style={styles.receiptVal}>#{myQueue.number}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>วันที่ / เวลา</Text>
                  <Text style={styles.receiptVal}>{doneTime}</Text>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Total */}
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptTotalKey}>ยอดรวม</Text>
                  <Text style={styles.receiptTotalVal}>
                    {Number(myQueue.saleAmount).toLocaleString('th-TH')} บาท
                  </Text>
                </View>

                {/* Divider dotted */}
                <View style={styles.dividerDot} />

                <Text style={styles.receiptThanks}>ขอบคุณที่ใช้บริการ</Text>

                {/* Close */}
                <TouchableOpacity style={styles.receiptClose} onPress={() => setReceiptVisible(false)}>
                  <Text style={styles.receiptCloseText}>ปิด</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  }

  // ยังไม่มีคิว — หน้ารับคิว
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>รับคิว</Text>
        <Text style={styles.subtitle}>กดปุ่มด้านล่างเพื่อรับคิวของคุณ</Text>
      </View>

      <View style={styles.center}>
        <TouchableOpacity
          style={[styles.queueBtn, pressed && styles.queueBtnPressed]}
          onPress={handleTakeQueue}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Ionicons name="time-outline" size={48} color="#fff" />
          <Text style={styles.queueBtnText}>รับคิว</Text>
        </TouchableOpacity>

        {pressed && (
          <TouchableOpacity
            style={[styles.confirmBtn, loading && { opacity: 0.6 }]}
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.confirmBtnText}>ยืนยันคิวของคุณ</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32 },
  queueBtn: {
    width: 176, height: 176, borderRadius: 88, backgroundColor: '#b45309',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#b45309', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  queueBtnPressed: { backgroundColor: '#92400e' },
  queueBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 8 },
  confirmBtn: {
    backgroundColor: '#f59e0b', paddingVertical: 16, paddingHorizontal: 48,
    borderRadius: 20, shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  // หน้าสถานะ
  statusBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  queueLabel: { fontSize: 16, color: '#6b7280' },
  queueNumber: { fontSize: 88, fontWeight: 'bold', color: '#b45309', lineHeight: 104 },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 24, paddingVertical: 16, borderRadius: 20,
    marginTop: 16,
  },
  statusCardPulse: {
    borderWidth: 2, borderColor: '#1d4ed8',
  },
  statusText: { fontSize: 18, fontWeight: '700' },
  note: { fontSize: 14, color: '#6b7280', marginTop: 12, textAlign: 'center' },
  resetBtn: {
    marginTop: 36, borderWidth: 2, borderColor: '#b45309',
    paddingVertical: 12, paddingHorizontal: 40, borderRadius: 16,
  },
  resetBtnText: { color: '#b45309', fontSize: 15, fontWeight: '600' },

  receiptBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 20, backgroundColor: '#d1fae5',
    paddingVertical: 12, paddingHorizontal: 28, borderRadius: 16,
  },
  receiptBtnText: { color: '#059669', fontSize: 15, fontWeight: '700' },

  // Modal ใบเสร็จ
  receiptOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  receiptScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  receiptBox: {
    backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 360,
    padding: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 10,
  },
  receiptHeader: { alignItems: 'center', marginBottom: 16 },
  receiptShop: { fontSize: 20, fontWeight: 'bold', color: '#b45309', marginTop: 8 },
  receiptSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 14 },
  dividerDot: {
    borderBottomWidth: 1.5, borderColor: '#d1d5db',
    borderStyle: 'dashed', marginVertical: 14,
  },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  receiptKey: { fontSize: 14, color: '#6b7280' },
  receiptVal: { fontSize: 14, color: '#1f2937', fontWeight: '500' },
  receiptTotalKey: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  receiptTotalVal: { fontSize: 18, fontWeight: 'bold', color: '#059669' },
  receiptThanks: { textAlign: 'center', fontSize: 14, color: '#9ca3af', marginBottom: 20 },
  receiptClose: {
    backgroundColor: '#b45309', borderRadius: 14,
    paddingVertical: 13, alignItems: 'center',
  },
  receiptCloseText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
