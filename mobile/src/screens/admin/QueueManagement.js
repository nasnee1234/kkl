import { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc,
  doc, serverTimestamp, query, orderBy, where, writeBatch,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { createQueueWithNumber, activateScheduledQueue, toLocalDateStr, MAX_QUEUE_PER_DAY } from '../../utils/queueNumbers';
import { formatPickupDateLabel } from '../../utils/pickupSchedule';
import { sendPushNotification } from '../../utils/notifications';
import { sendWebPush } from '../../utils/webPush';
import AnimatedPressable from '../../components/AnimatedPressable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { adminTheme, ADMIN_STATUS_THEME, colors } from '../../theme/colors';

const PAYMENT_OPTIONS = [
  { key: 'cash', label: 'เงินสด', icon: 'cash-outline', note: 'ชำระหน้าเคาน์เตอร์' },
  { key: 'promptpay', label: 'พร้อมเพย์', icon: 'qr-code-outline', note: 'สแกน QR พร้อมเพย์ที่เคาน์เตอร์' },
];

// ถ้าเรียกคิวแล้วลูกค้าไม่มาเกิน 15 นาที ให้ยกเลิกคิวนั้นอัตโนมัติ
const NO_SHOW_TIMEOUT_MS = 15 * 60 * 1000;

export default function QueueManagement() {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [pendingDone, setPendingDone] = useState(null);
  const [saleAmount, setSaleAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [acceptingQueue, setAcceptingQueue] = useState(true);
  const [togglingAccept, setTogglingAccept] = useState(false);
  const [resetConfirmVisible, setResetConfirmVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [scheduledQueues, setScheduledQueues] = useState([]);
  const [scheduledExpanded, setScheduledExpanded] = useState(true);
  const [cancelScheduledTarget, setCancelScheduledTarget] = useState(null);
  const queuesRef = useRef(queues);
  queuesRef.current = queues;
  const scheduledRef = useRef(scheduledQueues);
  scheduledRef.current = scheduledQueues;

  // Realtime listener
  useEffect(() => {
    const q = query(collection(db, 'queues'), orderBy('number', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setQueues(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error('QueueManagement:', error.message);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  // ยกเลิกคิวอัตโนมัติถ้าเรียกแล้วลูกค้าไม่มาเกิน 15 นาที
  useEffect(() => {
    const checkNoShows = () => {
      const now = Date.now();
      queuesRef.current
        .filter((q) => q.status === 'calling' && q.callingAt?.toDate)
        .filter((q) => now - q.callingAt.toDate().getTime() > NO_SHOW_TIMEOUT_MS)
        .forEach((q) => updateDoc(doc(db, 'queues', q.id), { status: 'cancelled' }));
    };
    const interval = setInterval(checkNoShows, 30000);
    return () => clearInterval(interval);
  }, []);

  // คิวที่จองล่วงหน้าไว้ (ยังไม่ได้เลขคิวจริง)
  useEffect(() => {
    const q = query(collection(db, 'queues'), where('status', '==', 'scheduled'));
    const unsub = onSnapshot(q, (snap) => {
      setScheduledQueues(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, []);

  // ถึงวันนัดแล้ว — ดึงคิวที่จองล่วงหน้าเข้าคิวจริงของวันนี้อัตโนมัติ (เรียงตามเวลาที่นัดไว้)
  // ตรวจทันทีเมื่อรายการจองเปลี่ยน (กันพลาดตอนโหลดครั้งแรกที่ realtime listener ยังไม่ทันมีข้อมูล)
  // และตรวจซ้ำเป็นระยะเผื่อกรณีข้ามวันเที่ยงคืนโดยไม่มีการเปลี่ยนแปลงรายการ
  const activateDueBookingsRef = useRef();
  activateDueBookingsRef.current = async () => {
    const today = toLocalDateStr();
    const due = scheduledRef.current
      .filter((q) => q.pickupDate <= today)
      .sort((a, b) => (a.pickupTime || '').localeCompare(b.pickupTime || ''));
    for (const q of due) {
      try {
        await activateScheduledQueue(q.id);
      } catch (e) {
        console.error('activateScheduledQueue:', e.message);
      }
    }
  };

  useEffect(() => {
    activateDueBookingsRef.current();
  }, [scheduledQueues]);

  useEffect(() => {
    const interval = setInterval(() => activateDueBookingsRef.current(), 60000);
    return () => clearInterval(interval);
  }, []);

  // สถานะเปิด/ปิดรับคิว
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'meta', 'queueStatus'),
      (snap) => setAcceptingQueue(snap.exists() ? snap.data().acceptingQueue !== false : true),
      () => {}
    );
    return unsub;
  }, []);

  const toggleAccepting = async () => {
    setTogglingAccept(true);
    try {
      await setDoc(
        doc(db, 'meta', 'queueStatus'),
        { acceptingQueue: !acceptingQueue, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', e.message);
    } finally {
      setTogglingAccept(false);
    }
  };

  const activeQueues = queues.filter((q) => q.status !== 'archived');
  const filtered = filter === 'all' ? activeQueues : activeQueues.filter((q) => q.status === filter);

  const isToday = (ts) => {
    if (!ts?.toDate) return false;
    const d = ts.toDate();
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };
  const doneToday = activeQueues.filter((q) => q.status === 'done' && isToday(q.doneAt));

  const stats = {
    waiting:   activeQueues.filter((q) => q.status === 'waiting').length,
    calling:   activeQueues.filter((q) => q.status === 'calling').length,
    done:      activeQueues.filter((q) => q.status === 'done').length,
    cancelled: activeQueues.filter((q) => q.status === 'cancelled').length,
    ordersToday: doneToday.length,
    revenueToday: doneToday.reduce((sum, q) => sum + (q.saleAmount || 0), 0),
  };

  const nextNumber =
    activeQueues.length > 0 ? Math.max(...activeQueues.map((q) => q.number)) + 1 : 1;

  const handleResetDay = () => setResetConfirmVisible(true);

  const performResetDay = async () => {
    try {
      const batch = writeBatch(db);
      activeQueues.forEach((q) => batch.update(doc(db, 'queues', q.id), { status: 'archived' }));
      batch.set(doc(db, 'counters', 'queues'), { lastNumber: 0, updatedAt: serverTimestamp() }, { merge: true });
      batch.set(doc(db, 'meta', 'queueStatus'), { callingNumber: null, updatedAt: serverTimestamp() }, { merge: true });
      await batch.commit();
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', e.message);
    } finally {
      setResetConfirmVisible(false);
    }
  };

  const handleAddQueue = async () => {
    if (!newName.trim()) { Alert.alert('แจ้งเตือน', 'กรุณากรอกชื่อลูกค้า'); return; }
    setSaving(true);
    try {
      await createQueueWithNumber({
        customerName: newName.trim(),
        status: 'waiting',
        createdAt: serverTimestamp(),
      });
      setNewName('');
      setAddOpen(false);
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangeStatus = async (item, newStatus) => {
    if (newStatus === 'done') {
      const itemsTotal = item.items?.reduce((sum, i) => sum + i.price * i.qty, 0) || 0;
      setPendingDone(item);
      setSaleAmount(itemsTotal > 0 ? String(itemsTotal) : '');
      setPaymentMethod(item.paymentMethod || null);
      setSaleOpen(true);
      return;
    }
    await updateDoc(
      doc(db, 'queues', item.id),
      newStatus === 'calling'
        ? { status: newStatus, callingAt: serverTimestamp() }
        : { status: newStatus }
    );

    if (newStatus === 'calling') {
      // บอกลูกค้าทุกคนว่าตอนนี้ร้านเรียกถึงคิวไหนแล้ว ใช้คำนวณ "เตือนล่วงหน้า 2 คิว"
      await setDoc(
        doc(db, 'meta', 'queueStatus'),
        { callingNumber: item.number, updatedAt: serverTimestamp() },
        { merge: true }
      );
      // ส่ง push notification เมื่อเรียกคิว
      if (item.pushToken) {
        await sendPushNotification(item.pushToken, item.number);
      }
      if (item.webPushSubscription) {
        await sendWebPush(item.webPushSubscription, item.number);
      }
    }
  };

  const handleConfirmDone = async () => {
    const amount = Number(saleAmount);
    if (!saleAmount || isNaN(amount) || amount < 0) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกยอดขาย (0 ถ้าไม่มีการซื้อ)');
      return;
    }
    if (amount > 0 && !paymentMethod) {
      Alert.alert('แจ้งเตือน', 'กรุณาเลือกวิธีชำระเงิน');
      return;
    }
    setSaving(true);
    try {
      // บันทึก saleAmount + paymentMethod ลงใน queue doc ด้วย เพื่อให้ฝั่งลูกค้าแสดงใบเสร็จ
      await updateDoc(doc(db, 'queues', pendingDone.id), {
        status: 'done',
        saleAmount: amount,
        paymentMethod: amount > 0 ? paymentMethod : null,
        doneAt: serverTimestamp(),
      });
      if (amount > 0) {
        await addDoc(collection(db, 'sales'), {
          amount,
          paymentMethod,
          queueId: pendingDone.id,
          queueNumber: pendingDone.number,
          customerName: pendingDone.customerName,
          createdAt: serverTimestamp(),
        });
      }
      setSaleOpen(false);
      setPendingDone(null);
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => setDeleteTarget(item);

  const performDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, 'queues', deleteTarget.id));
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', e.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const performCancelScheduled = async () => {
    if (!cancelScheduledTarget) return;
    try {
      await deleteDoc(doc(db, 'queues', cancelScheduledTarget.id));
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', e.message);
    } finally {
      setCancelScheduledTarget(null);
    }
  };

  const FILTERS = [
    { key: 'all',       label: `ทั้งหมด (${activeQueues.length})` },
    { key: 'waiting',   label: `รอ (${stats.waiting})` },
    { key: 'calling',   label: `เรียก (${stats.calling})` },
    { key: 'done',      label: `เสร็จ (${stats.done})` },
    { key: 'cancelled', label: `ยกเลิก (${stats.cancelled})` },
  ];

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={adminTheme.accent} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* เปิด/ปิดรับคิว */}
      <View style={styles.acceptRow}>
        <View>
          <Text style={styles.acceptTitle}>{acceptingQueue ? 'เปิดรับคิวอยู่' : 'ปิดรับคิวอยู่'}</Text>
          <Text style={styles.acceptSub}>
            {acceptingQueue ? 'ลูกค้าสั่งอาหารและรับคิวได้ตามปกติ' : 'ลูกค้าจะสั่งอาหารไม่ได้จนกว่าจะเปิดอีกครั้ง'}
          </Text>
        </View>
        <AnimatedPressable
          style={[styles.acceptToggle, acceptingQueue ? styles.acceptToggleOn : styles.acceptToggleOff]}
          onPress={toggleAccepting}
          disabled={togglingAccept}
        >
          {togglingAccept ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.acceptToggleText}>{acceptingQueue ? 'ปิดรับคิว' : 'เปิดรับคิว'}</Text>
          )}
        </AnimatedPressable>
      </View>

      {/* Stats — ตรงกับดีไซน์ต้นแบบ: คิวที่รออยู่ / ออเดอร์วันนี้ / ยอดขายวันนี้ */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.waiting}</Text>
          <Text style={styles.statLabel}>คิวที่รออยู่</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.ordersToday}</Text>
          <Text style={styles.statLabel}>ออเดอร์วันนี้</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>฿{stats.revenueToday.toLocaleString()}</Text>
          <Text style={styles.statLabel}>ยอดขายวันนี้</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <AnimatedPressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
          <Ionicons name="add" size={18} color={adminTheme.ctaText} />
          <Text style={styles.addBtnText}>เพิ่มคิว</Text>
        </AnimatedPressable>
        <TouchableOpacity style={styles.resetBtn} onPress={handleResetDay}>
          <Ionicons name="refresh-outline" size={16} color={adminTheme.textMuted} />
          <Text style={styles.resetBtnText}>เริ่มคิวใหม่</Text>
        </TouchableOpacity>
      </View>

      {/* จองล่วงหน้า */}
      {scheduledQueues.length > 0 && (
        <View style={styles.scheduledSection}>
          <TouchableOpacity style={styles.scheduledHeader} onPress={() => setScheduledExpanded((v) => !v)}>
            <Ionicons name="calendar-outline" size={16} color={adminTheme.accent} />
            <Text style={styles.scheduledHeaderText}>จองล่วงหน้า ({scheduledQueues.length})</Text>
            <Ionicons name={scheduledExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={adminTheme.textMuted} />
          </TouchableOpacity>
          {scheduledExpanded && (
            <View style={styles.scheduledList}>
              {[...scheduledQueues]
                .sort((a, b) => (a.pickupDate + a.pickupTime).localeCompare(b.pickupDate + b.pickupTime))
                .map((item) => (
                  <View key={item.id} style={styles.scheduledRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.scheduledDate}>
                        {formatPickupDateLabel(item.pickupDate)} · {item.pickupTime} น.
                      </Text>
                      <Text style={styles.scheduledName}>{item.customerName}</Text>
                      {item.items?.length > 0 && (
                        <Text style={styles.scheduledItems} numberOfLines={2}>
                          {item.items.map((i) => `${i.name} x${i.qty}`).join(', ')}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: adminTheme.dangerBg }]}
                      onPress={() => setCancelScheduledTarget(item)}
                    >
                      <Ionicons name="close-outline" size={16} color={adminTheme.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          )}
        </View>
      )}

      {/* Realtime badge */}
      <View style={styles.realtimeBadge}>
        <View style={styles.dot} />
        <Text style={styles.realtimeText}>อัปเดต Realtime</Text>
      </View>

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Queue List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>ไม่มีคิวในขณะนี้</Text>}
        renderItem={({ item }) => {
          const cfg = ADMIN_STATUS_THEME[item.status] || ADMIN_STATUS_THEME.waiting;
          const time = item.createdAt?.toDate
            ? item.createdAt.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
            : '--:--';
          return (
            <View style={styles.card}>
              <View style={[styles.numBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.numText, { color: cfg.color }]}>{item.number}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.customerName}</Text>
                {item.items?.length > 0 && (
                  <Text style={styles.orderItems} numberOfLines={2}>
                    {item.items.map((i) => `${i.name} x${i.qty}`).join(', ')}
                  </Text>
                )}
                {item.phone ? <Text style={styles.phoneText}>โทร {item.phone}</Text> : null}
                <View style={styles.meta}>
                  <Ionicons name="time-outline" size={12} color={adminTheme.textMuted} />
                  <Text style={styles.timeText}>{time}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon} size={11} color={cfg.color} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.actions}>
                {item.status === 'waiting' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: ADMIN_STATUS_THEME.calling.bg }]}
                    onPress={() => handleChangeStatus(item, 'calling')}>
                    <Ionicons name="megaphone-outline" size={16} color={ADMIN_STATUS_THEME.calling.color} />
                  </TouchableOpacity>
                )}
                {item.status === 'calling' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: ADMIN_STATUS_THEME.done.bg }]}
                    onPress={() => handleChangeStatus(item, 'done')}>
                    <Ionicons name="checkmark-outline" size={16} color={ADMIN_STATUS_THEME.done.color} />
                  </TouchableOpacity>
                )}
                {(item.status === 'waiting' || item.status === 'calling') && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: ADMIN_STATUS_THEME.cancelled.bg }]}
                    onPress={() => handleChangeStatus(item, 'cancelled')}>
                    <Ionicons name="close-outline" size={16} color={ADMIN_STATUS_THEME.cancelled.color} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: adminTheme.surfaceAlt }]}
                  onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={16} color={adminTheme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Add Queue Modal */}
      <Modal visible={addOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>เพิ่มคิวใหม่</Text>
            <Text style={styles.modalSub}>หมายเลขถัดไป: <Text style={{ color: adminTheme.accent, fontWeight: '700' }}>#{nextNumber}</Text></Text>
            <Text style={styles.fieldLabel}>ชื่อลูกค้า</Text>
            <TextInput
              style={styles.fieldInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="กรอกชื่อลูกค้า"
              placeholderTextColor={adminTheme.textMuted}
              autoFocus
            />
            <AnimatedPressable style={[styles.confirmBtn, saving && { opacity: 0.6 }]}
              onPress={handleAddQueue} disabled={saving}>
              {saving ? <ActivityIndicator color={adminTheme.ctaText} /> : <Text style={styles.confirmText}>เพิ่มคิว</Text>}
            </AnimatedPressable>
            <TouchableOpacity style={styles.cancelBtn2} onPress={() => { setAddOpen(false); setNewName(''); }}>
              <Text style={styles.cancelText2}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sale Amount + Payment Modal */}
      <Modal visible={saleOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView style={styles.modalBox} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>บันทึกยอดขาย</Text>
            <Text style={styles.modalSub}>คิว #{pendingDone?.number} — {pendingDone?.customerName}</Text>
            <Text style={styles.fieldLabel}>ยอดขาย (บาท)</Text>
            <TextInput
              style={styles.fieldInput}
              value={saleAmount}
              onChangeText={setSaleAmount}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={adminTheme.textMuted}
              autoFocus
            />

            {Number(saleAmount) > 0 && (
              <>
                <Text style={styles.fieldLabel}>วิธีชำระเงิน</Text>
                <View style={styles.paymentRow}>
                  {PAYMENT_OPTIONS.map((opt) => {
                    const active = paymentMethod === opt.key;
                    return (
                      <AnimatedPressable
                        key={opt.key}
                        style={[styles.paymentOption, active && styles.paymentOptionActive]}
                        onPress={() => setPaymentMethod(opt.key)}
                      >
                        <Ionicons name={opt.icon} size={24} color={active ? adminTheme.ctaText : adminTheme.accent} />
                        <Text style={[styles.paymentOptionLabel, active && styles.paymentOptionLabelActive]}>
                          {opt.label}
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>
                {paymentMethod && (
                  <Text style={styles.paymentNote}>
                    {PAYMENT_OPTIONS.find((o) => o.key === paymentMethod)?.note}
                  </Text>
                )}
              </>
            )}

            <AnimatedPressable style={[styles.confirmBtn, saving && { opacity: 0.6 }]}
              onPress={handleConfirmDone} disabled={saving}>
              {saving ? <ActivityIndicator color={adminTheme.ctaText} /> : <Text style={styles.confirmText}>ยืนยัน</Text>}
            </AnimatedPressable>
            <TouchableOpacity style={styles.cancelBtn2} onPress={() => setSaleOpen(false)}>
              <Text style={styles.cancelText2}>ยกเลิก</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Reset Day Confirm */}
      <ConfirmDialog
        visible={resetConfirmVisible}
        icon="refresh-outline"
        title="เริ่มคิวใหม่?"
        message={`คิวปัจจุบันทั้งหมดจะถูกเก็บเป็นประวัติ (ไม่ลบข้อมูล) แล้วเริ่มนับเลขคิวใหม่จาก 1 (รับได้สูงสุด ${MAX_QUEUE_PER_DAY} คิวต่อรอบ)`}
        confirmLabel="เริ่มคิวใหม่"
        onCancel={() => setResetConfirmVisible(false)}
        onConfirm={performResetDay}
      />

      {/* Delete Queue Confirm */}
      <ConfirmDialog
        visible={!!deleteTarget}
        icon="trash-outline"
        title="ลบคิว"
        message={deleteTarget ? `ต้องการลบคิว #${deleteTarget.number} หรือไม่?` : ''}
        confirmLabel="ลบ"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={performDelete}
      />

      {/* Cancel Scheduled Booking Confirm */}
      <ConfirmDialog
        visible={!!cancelScheduledTarget}
        icon="close-outline"
        title="ยกเลิกการจอง"
        message={
          cancelScheduledTarget
            ? `ต้องการยกเลิกการจองของ "${cancelScheduledTarget.customerName}" (${formatPickupDateLabel(cancelScheduledTarget.pickupDate)} · ${cancelScheduledTarget.pickupTime} น.) หรือไม่?`
            : ''
        }
        confirmLabel="ยกเลิกการจอง"
        onCancel={() => setCancelScheduledTarget(null)}
        onConfirm={performCancelScheduled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: adminTheme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: adminTheme.bg },
  acceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: adminTheme.surface,
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  acceptTitle: { color: adminTheme.text, fontSize: 15, fontWeight: '800' },
  acceptSub: { color: adminTheme.textMuted, fontSize: 11, marginTop: 3, maxWidth: 200 },
  acceptToggle: { marginLeft: 'auto', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, minWidth: 96, alignItems: 'center' },
  acceptToggleOn: { backgroundColor: adminTheme.danger },
  acceptToggleOff: { backgroundColor: adminTheme.cta },
  acceptToggleText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 16 },
  statBox: { flex: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.07)' },
  statNum: { fontSize: 22, fontWeight: '800', color: colors.primaryGlow },
  statLabel: { fontSize: 11, color: adminTheme.textMuted, marginTop: 3 },
  actionRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: adminTheme.cta, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText: { color: adminTheme.ctaText, fontSize: 13, fontWeight: '700' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: adminTheme.border, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  resetBtnText: { color: adminTheme.textMuted, fontSize: 13, fontWeight: '700' },
  scheduledSection: {
    marginHorizontal: 16, marginTop: 14, borderRadius: 16,
    backgroundColor: adminTheme.surface, borderWidth: 1, borderColor: adminTheme.border, overflow: 'hidden',
  },
  scheduledHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  scheduledHeaderText: { flex: 1, color: adminTheme.text, fontSize: 14, fontWeight: '700' },
  scheduledList: { paddingHorizontal: 14, paddingBottom: 12, gap: 10 },
  scheduledRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: adminTheme.surfaceAlt, borderRadius: 12, padding: 12,
  },
  scheduledDate: { color: adminTheme.accent, fontSize: 13, fontWeight: '800' },
  scheduledName: { color: adminTheme.text, fontSize: 14, fontWeight: '600', marginTop: 2 },
  scheduledItems: { color: adminTheme.textMuted, fontSize: 12, marginTop: 3, lineHeight: 16 },
  realtimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: adminTheme.cta },
  realtimeText: { fontSize: 12, color: adminTheme.cta, fontWeight: '600' },
  filterScroll: { paddingHorizontal: 16 },
  filters: { flexDirection: 'row', gap: 8, paddingVertical: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: adminTheme.surface },
  filterBtnActive: { backgroundColor: adminTheme.accent },
  filterText: { fontSize: 13, color: adminTheme.textMuted, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { textAlign: 'center', color: adminTheme.textMuted, fontSize: 15, marginTop: 60 },
  card: { backgroundColor: adminTheme.surface, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: adminTheme.border, gap: 12 },
  numBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 18, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: adminTheme.text },
  orderItems: { fontSize: 12, color: adminTheme.textMuted, marginTop: 3, lineHeight: 16 },
  phoneText: { fontSize: 11, color: adminTheme.textMuted, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  timeText: { fontSize: 12, color: adminTheme.textMuted, marginRight: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: adminTheme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: adminTheme.text, marginBottom: 4 },
  modalSub: { fontSize: 13, color: adminTheme.textMuted, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: adminTheme.text, marginBottom: 6 },
  fieldInput: { borderWidth: 1.5, borderColor: adminTheme.border, borderRadius: 12, padding: 12, fontSize: 15, color: adminTheme.text, marginBottom: 16 },
  paymentRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  paymentOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: adminTheme.border,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
    backgroundColor: adminTheme.surfaceAlt,
  },
  paymentOptionActive: { backgroundColor: adminTheme.cta, borderColor: adminTheme.cta },
  paymentOptionLabel: { fontSize: 14, fontWeight: '700', color: adminTheme.accent },
  paymentOptionLabelActive: { color: adminTheme.ctaText },
  paymentNote: { fontSize: 12, color: adminTheme.textMuted, marginBottom: 10, textAlign: 'center' },
  confirmBtn: { backgroundColor: adminTheme.cta, borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 8, marginTop: 4 },
  confirmText: { color: adminTheme.ctaText, fontSize: 15, fontWeight: '700' },
  cancelBtn2: { padding: 12, alignItems: 'center', marginBottom: 4 },
  cancelText2: { color: adminTheme.textMuted, fontSize: 14 },
});
