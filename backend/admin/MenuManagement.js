import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { getMenuImageUrl, normalizeImageUrl } from '../../utils/imageUrls';

const EMPTY_FORM = { name: '', price: '', description: '', imageUrl: '', emoji: '🍗', stock: '' };

function MenuPreview({ item }) {
  const uri = getMenuImageUrl(item);
  const [failedUri, setFailedUri] = useState('');

  useEffect(() => {
    setFailedUri('');
  }, [uri]);

  if (uri && failedUri !== uri) {
    return (
      <Image
        source={{ uri }}
        style={styles.previewImage}
        resizeMode="cover"
        onError={() => setFailedUri(uri)}
      />
    );
  }

  if (uri && failedUri === uri) {
    return (
      <View style={styles.previewFallback}>
        <Ionicons name="image-outline" size={20} color="#ef4444" />
        <Text style={styles.previewErrorText}>โหลดไม่ได้</Text>
      </View>
    );
  }

  return (
    <View style={styles.previewFallback}>
      <Text style={styles.previewEmoji}>{item.emoji || '🍗'}</Text>
    </View>
  );
}

export default function MenuManagement() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = add, object = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'menus'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMenus(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error('MenuManagement:', error.message);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({
      name: item.name,
      price: String(item.price),
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      emoji: item.emoji || '🍗',
      stock: String(item.stock),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.stock) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกชื่อ ราคา และจำนวนสต็อก');
      return;
    }
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (isNaN(price) || price <= 0) {
      Alert.alert('แจ้งเตือน', 'ราคาต้องเป็นตัวเลขที่มากกว่า 0');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      Alert.alert('แจ้งเตือน', 'สต็อกต้องเป็นตัวเลข 0 ขึ้นไป');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        price,
        description: form.description.trim(),
        imageUrl: normalizeImageUrl(form.imageUrl),
        emoji: form.emoji.trim() || '🍗',
        stock,
        updatedAt: serverTimestamp(),
      };
      if (editTarget) {
        await updateDoc(doc(db, 'menus', editTarget.id), data);
      } else {
        await addDoc(collection(db, 'menus'), { ...data, createdAt: serverTimestamp() });
      }
      setModalOpen(false);
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'menus', deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      Alert.alert('ลบเมนูไม่สำเร็จ', e.message);
    } finally {
      setDeleting(false);
    }
  };

  const adjustStock = async (item, delta) => {
    const newStock = Math.max(0, (item.stock || 0) + delta);
    await updateDoc(doc(db, 'menus', item.id), { stock: newStock, updatedAt: serverTimestamp() });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.count}>ทั้งหมด {menus.length} รายการ</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>เพิ่มเมนู</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={menus}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>ยังไม่มีเมนู กด "เพิ่มเมนู" เพื่อเริ่มต้น</Text>}
        renderItem={({ item }) => {
          const outOfStock = item.stock === 0;
          return (
            <View style={[styles.card, outOfStock && styles.cardDim]}>
              <MenuPreview item={item} />
              <View style={styles.cardInfo}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {outOfStock && (
                    <View style={styles.outBadge}>
                      <Text style={styles.outBadgeText}>สินค้าหมด</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardPrice}>฿{item.price}</Text>

                {/* Stock control */}
                <View style={styles.stockRow}>
                  <TouchableOpacity style={styles.stockBtn} onPress={() => adjustStock(item, -1)}>
                    <Ionicons name="remove" size={16} color="#ef4444" />
                  </TouchableOpacity>
                  <Text style={[styles.stockNum, outOfStock && { color: '#ef4444' }]}>
                    {item.stock} ชิ้น
                  </Text>
                  <TouchableOpacity style={styles.stockBtn} onPress={() => adjustStock(item, 1)}>
                    <Ionicons name="add" size={16} color="#059669" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Ionicons name="create-outline" size={18} color="#1d4ed8" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Add / Edit Modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView style={styles.modalBox} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{editTarget ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</Text>

            {[
              { label: 'ชื่อเมนู *', key: 'name', placeholder: 'เช่น ไก่กอและ' },
              { label: 'ราคา (บาท) *', key: 'price', placeholder: '0', keyboardType: 'numeric' },
              { label: 'จำนวนสินค้าที่มีอยู่ *', key: 'stock', placeholder: '0', keyboardType: 'numeric' },
              {
                label: 'ลิงก์รูปภาพ',
                key: 'imageUrl',
                placeholder: 'https://example.com/menu.jpg',
                keyboardType: 'url',
                hint: 'ควรใช้ลิงก์รูปโดยตรง เช่น .jpg, .png หรือแชร์ลิงก์จาก Drive/Dropbox',
              },
              { label: 'คำอธิบาย', key: 'description', placeholder: 'บรรยายเมนู...' },
              { label: 'อีโมจิสำรอง', key: 'emoji', placeholder: '🍗' },
            ].map((field) => (
              <View key={field.key} style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form[field.key]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [field.key]: v }))}
                  placeholder={field.placeholder}
                  keyboardType={field.keyboardType || 'default'}
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                />
                {field.hint && <Text style={styles.fieldHint}>{field.hint}</Text>}
              </View>
            ))}

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>บันทึก</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
              <Text style={styles.cancelBtnText}>ยกเลิก</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={Boolean(deleteTarget)} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIcon}>
              <Ionicons name="trash-outline" size={28} color="#ef4444" />
            </View>
            <Text style={styles.confirmTitle}>ลบเมนูนี้?</Text>
            <Text style={styles.confirmText}>
              ต้องการลบ "{deleteTarget?.name}" ออกจากรายการอาหารหรือไม่
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                <Text style={styles.confirmCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDelete, deleting && { opacity: 0.7 }]}
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteText}>ลบ</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  count: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1d4ed8', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row',
    alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#e0e7ff',
  },
  cardDim: { opacity: 0.6 },
  previewImage: { width: 64, height: 54, borderRadius: 10, marginRight: 12, backgroundColor: '#e5e7eb' },
  previewFallback: {
    width: 64,
    height: 54,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmoji: { fontSize: 30 },
  previewErrorText: { color: '#ef4444', fontSize: 10, fontWeight: '700', marginTop: 2 },
  cardInfo: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  outBadge: { backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  outBadgeText: { fontSize: 11, color: '#ef4444', fontWeight: '700' },
  cardPrice: { fontSize: 13, color: '#b45309', fontWeight: '600', marginTop: 2 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  stockBtn: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  stockNum: { fontSize: 13, fontWeight: '700', color: '#1f2937', minWidth: 48, textAlign: 'center' },
  cardActions: { gap: 8 },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  fieldBox: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 5 },
  fieldInput: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 11, fontSize: 15, color: '#1f2937' },
  fieldHint: { color: '#6b7280', fontSize: 11, lineHeight: 16, marginTop: 5 },
  saveBtn: { backgroundColor: '#1d4ed8', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { padding: 12, alignItems: 'center', marginBottom: 8 },
  cancelBtnText: { color: '#6b7280', fontSize: 14 },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
  },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  confirmText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  confirmActions: { flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' },
  confirmCancel: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: { color: '#374151', fontSize: 15, fontWeight: '700' },
  confirmDelete: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
