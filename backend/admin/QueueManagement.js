import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { sendPushNotification } from '../../utils/notifications';

const STATUS_CONFIG = {
  waiting:   { label: 'รอเรียก',     color: '#f59e0b', bg: '#fef3c7', icon: 'time-outline' },
  calling:   { label: 'กำลังเรียก', color: '#1d4ed8', bg: '#dbeafe', icon: 'megaphone-outline' },
  done:      { label: 'เสร็จแล้ว',  color: '#059669', bg: '#d1fae5', icon: 'checkmark-circle-outline' },
  cancelled: { label: 'ยกเลิก',     color: '#ef4444', bg: '#fee2e2', icon: 'close-circle-outline' },
};

export default function QueueManagement() {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [pendingDone, setPendingDone] = useState(null);
  const [saleAmount, setSaleAmount] = useState('');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

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

  const filtered = filter === 'all' ? queues : queues.filter((q) => q.status === filter);

  const stats = {
    waiting:  queues.filter((q) => q.status === 'waiting').length,
    calling:  queues.filter((q) => q.status === 'calling').length,
    done:     queues.filter((q) => q.status === 'done').length,
  };

  const nextNumber =
    queues.length > 0 ? Math.max(...queues.map((q) => q.number)) + 1 : 1;

  const handleAddQueue = async () => {
    if (!newName.trim()) { Alert.alert('แจ้งเตือน', 'กรุณากรอกชื่อลูกค้า'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'queues'), {
        number: nextNumber,
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
      setPendingDone(item);
      setSaleAmount('');
      setSaleOpen(true);
      return;
    }
    await updateDoc(doc(db, 'queues', item.id), { status: newStatus });

    // ส่ง push notification เมื่อเรียกคิว
    if (newStatus === 'calling' && item.pushToken) {
      await sendPushNotification(item.pushToken, item.number);
    }
  };

  const handleConfirmDone = async () => {
    const amount = Number(saleAmount);
    if (!saleAmount || isNaN(amount) || amount < 0) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกยอดขาย (0 ถ้าไม่มีการซื้อ)');
      return;
    }
    setSaving(true);
    try {
      // บันทึก saleAmount ลงใน queue doc ด้วย เพื่อให้ฝั่งลูกค้าแสดงใบเสร็จ
      await updateDoc(doc(db, 'queues', pendingDone.id), {
        status: 'done',
        saleAmount: amount,
        doneAt: serverTimestamp(),
      });
      if (amount > 0) {
        await addDoc(collection(db, 'sales'), {
          amount,
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

  const handleDelete = (item) => {
    Alert.alert('ลบคิว', `ต้องการลบคิว #${item.number} หรือไม่?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => deleteDoc(doc(db, 'queues', item.id)) },
    ]);
  };

  const FILTERS = [
    { key: 'all',     label: `ทั้งหมด (${queues.length})` },
    { key: 'waiting', label: `รอ (${stats.waiting})` },
    { key: 'calling', label: `เรียก (${stats.calling})` },
    { key: 'done',    label: `เสร็จ (${stats.done})` },
  ];

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1d4ed8" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: '#fef3c7' }]}>
          <Text style={[styles.statNum, { color: '#f59e0b' }]}>{stats.waiting}</Text>
          <Text style={styles.statLabel}>รอเรียก</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#dbeafe' }]}>
          <Text style={[styles.statNum, { color: '#1d4ed8' }]}>{stats.calling}</Text>
          <Text style={styles.statLabel}>กำลังเรียก</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#d1fae5' }]}>
          <Text style={[styles.statNum, { color: '#059669' }]}>{stats.done}</Text>
          <Text style={styles.statLabel}>เสร็จแล้ว</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addBtnText}>เพิ่มคิว</Text>
        </TouchableOpacity>
      </View>

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
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.waiting;
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
                <View style={styles.meta}>
                  <Ionicons name="time-outline" size={12} color="#9ca3af" />
                  <Text style={styles.timeText}>{time}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon} size={11} color={cfg.color} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.actions}>
                {item.status === 'waiting' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dbeafe' }]}
                    onPress={() => handleChangeStatus(item, 'calling')}>
                    <Ionicons name="megaphone-outline" size={16} color="#1d4ed8" />
                  </TouchableOpacity>
                )}
                {item.status === 'calling' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#d1fae5' }]}
                    onPress={() => handleChangeStatus(item, 'done')}>
                    <Ionicons name="checkmark-outline" size={16} color="#059669" />
                  </TouchableOpacity>
                )}
                {(item.status === 'waiting' || item.status === 'calling') && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]}
                    onPress={() => handleChangeStatus(item, 'cancelled')}>
                    <Ionicons name="close-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f3f4f6' }]}
                  onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={16} color="#6b7280" />
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
            <Text style={styles.modalSub}>หมายเลขถัดไป: <Text style={{ color: '#1d4ed8', fontWeight: '700' }}>#{nextNumber}</Text></Text>
            <Text style={styles.fieldLabel}>ชื่อลูกค้า</Text>
            <TextInput
              style={styles.fieldInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="กรอกชื่อลูกค้า"
              placeholderTextColor="#9ca3af"
              autoFocus
            />
            <TouchableOpacity style={[styles.confirmBtn, saving && { opacity: 0.6 }]}
              onPress={handleAddQueue} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>เพิ่มคิว</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn2} onPress={() => { setAddOpen(false); setNewName(''); }}>
              <Text style={styles.cancelText2}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sale Amount Modal */}
      <Modal visible={saleOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>บันทึกยอดขาย</Text>
            <Text style={styles.modalSub}>คิว #{pendingDone?.number} — {pendingDone?.customerName}</Text>
            <Text style={styles.fieldLabel}>ยอดขาย (บาท)</Text>
            <TextInput
              style={styles.fieldInput}
              value={saleAmount}
              onChangeText={setSaleAmount}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
              autoFocus
            />
            <TouchableOpacity style={[styles.confirmBtn, saving && { opacity: 0.6 }]}
              onPress={handleConfirmDone} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>ยืนยัน</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn2} onPress={() => setSaleOpen(false)}>
              <Text style={styles.cancelText2}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 4, alignItems: 'center' },
  statBox: { flex: 1, borderRadius: 14, padding: 10, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  addBtn: { backgroundColor: '#1d4ed8', borderRadius: 14, padding: 10, alignItems: 'center', justifyContent: 'center', gap: 2, minWidth: 60 },
  addBtnText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  realtimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  realtimeText: { fontSize: 12, color: '#22c55e', fontWeight: '600' },
  filterScroll: { paddingHorizontal: 16 },
  filters: { flexDirection: 'row', gap: 8, paddingVertical: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#e0e7ff' },
  filterBtnActive: { backgroundColor: '#1d4ed8' },
  filterText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { textAlign: 'center', color: '#9ca3af', fontSize: 15, marginTop: 60 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#e0e7ff', gap: 12 },
  numBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 18, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  timeText: { fontSize: 12, color: '#9ca3af', marginRight: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fieldInput: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 15, color: '#1f2937', marginBottom: 16 },
  confirmBtn: { backgroundColor: '#1d4ed8', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 8 },
  confirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn2: { padding: 12, alignItems: 'center', marginBottom: 4 },
  cancelText2: { color: '#6b7280', fontSize: 14 },
});
