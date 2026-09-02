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
import { db } from '../../config/firebase';
import { getMenuImageUrl } from '../../utils/imageUrls';
import { MENU_IMAGE_MAP, MENU_IMAGE_KEYS, getLocalMenuImage } from '../../assets/menuImages';
import AnimatedPressable from '../../components/AnimatedPressable';
import { adminTheme } from '../../theme/colors';
import { MODAL_MAX_WIDTH, useLayout } from '../../theme/layout';

const EMPTY_FORM = { name: '', price: '', imageKey: '', emoji: '🍗' };

function MenuPreview({ item }) {
  const localImage = getLocalMenuImage(item.imageKey);
  const uri = getMenuImageUrl(item);
  const [failedUri, setFailedUri] = useState('');

  useEffect(() => {
    setFailedUri('');
  }, [uri]);

  if (localImage) {
    return <Image source={localImage} style={styles.previewImage} resizeMode="cover" />;
  }

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

  return (
    <View style={styles.previewFallback}>
      <Text style={styles.previewEmoji}>{item.emoji || '🍗'}</Text>
    </View>
  );
}

export default function MenuManagement() {
  const { menuMaxWidth, gutter } = useLayout();
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
      imageKey: item.imageKey || '',
      emoji: item.emoji || '🍗',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกชื่อและราคา');
      return;
    }
    const price = Number(form.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('แจ้งเตือน', 'ราคาต้องเป็นตัวเลขที่มากกว่า 0');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        price,
        imageKey: form.imageKey || '',
        emoji: form.emoji.trim() || '🍗',
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={adminTheme.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { maxWidth: menuMaxWidth, paddingHorizontal: gutter }]}>
        <Text style={styles.count}>ทั้งหมด {menus.length} รายการ</Text>
        <AnimatedPressable style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={20} color={adminTheme.ctaText} />
          <Text style={styles.addBtnText}>เพิ่มเมนู</Text>
        </AnimatedPressable>
      </View>

      <FlatList
        data={menus}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { maxWidth: menuMaxWidth, paddingHorizontal: gutter }]}
        ListEmptyComponent={<Text style={styles.empty}>ยังไม่มีเมนู กด "เพิ่มเมนู" เพื่อเริ่มต้น</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <MenuPreview item={item} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardPrice}>฿{item.price}</Text>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                <Ionicons name="create-outline" size={18} color={adminTheme.accent} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={18} color={adminTheme.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView style={styles.modalBox} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{editTarget ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</Text>

            {[
              { label: 'ชื่อเมนู *', key: 'name', placeholder: 'เช่น ไก่กอและ' },
              { label: 'ราคา (บาท) *', key: 'price', placeholder: '0', keyboardType: 'numeric' },
            ].map((field) => (
              <View key={field.key} style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form[field.key]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [field.key]: v }))}
                  placeholder={field.placeholder}
                  keyboardType={field.keyboardType || 'default'}
                  placeholderTextColor={adminTheme.textMuted}
                  autoCapitalize="none"
                />
              </View>
            ))}

            {/* เลือกรูปจากโฟลเดอร์ในเครื่อง แทนการวางลิงก์ URL */}
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>รูปเมนู</Text>
              {MENU_IMAGE_KEYS.length === 0 ? (
                <View style={styles.noImageHint}>
                  <Ionicons name="image-outline" size={18} color={adminTheme.textMuted} />
                  <Text style={styles.noImageHintText}>
                    ยังไม่มีรูปในระบบ — เพิ่มไฟล์รูปที่ mobile/src/assets/images/menu/ แล้วเพิ่มใน menuImages.js ก่อน ระหว่างนี้จะใช้อีโมจิสำรองแทน
                  </Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.imagePickerRow}>
                    {MENU_IMAGE_KEYS.map((key) => {
                      const active = form.imageKey === key;
                      return (
                        <AnimatedPressable
                          key={key}
                          style={[styles.imageOption, active && styles.imageOptionActive]}
                          onPress={() => setForm((f) => ({ ...f, imageKey: active ? '' : key }))}
                        >
                          <Image source={MENU_IMAGE_MAP[key]} style={styles.imageOptionThumb} resizeMode="cover" />
                          {active && (
                            <View style={styles.imageOptionCheck}>
                              <Ionicons name="checkmark-circle" size={18} color={adminTheme.accent} />
                            </View>
                          )}
                        </AnimatedPressable>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </View>

            {[
              { label: 'อีโมจิสำรอง (แสดงถ้ายังไม่มีรูป)', key: 'emoji', placeholder: '🍗' },
            ].map((field) => (
              <View key={field.key} style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form[field.key]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [field.key]: v }))}
                  placeholder={field.placeholder}
                  placeholderTextColor={adminTheme.textMuted}
                  autoCapitalize="none"
                />
              </View>
            ))}

            <AnimatedPressable
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color={adminTheme.ctaText} /> : <Text style={styles.saveBtnText}>บันทึก</Text>}
            </AnimatedPressable>
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
              <Ionicons name="trash-outline" size={28} color={adminTheme.danger} />
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
              <AnimatedPressable
                style={[styles.confirmDelete, deleting && { opacity: 0.7 }]}
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteText}>ลบ</Text>
                )}
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: adminTheme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: adminTheme.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, width: '100%', alignSelf: 'center' },
  count: { fontSize: 14, color: adminTheme.textMuted, fontWeight: '500' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: adminTheme.cta, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  addBtnText: { color: adminTheme.ctaText, fontWeight: '700', fontSize: 14 },
  list: { paddingBottom: 24, width: '100%', alignSelf: 'center' },
  empty: { textAlign: 'center', color: adminTheme.textMuted, marginTop: 60, fontSize: 14 },
  card: {
    backgroundColor: adminTheme.surface, borderRadius: 16, padding: 14, flexDirection: 'row',
    alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: adminTheme.border,
  },
  previewImage: { width: 64, height: 54, borderRadius: 10, marginRight: 12, backgroundColor: adminTheme.surfaceAlt },
  previewFallback: {
    width: 64,
    height: 54,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: adminTheme.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmoji: { fontSize: 30 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: adminTheme.text },
  cardPrice: { fontSize: 13, color: adminTheme.gold, fontWeight: '700', marginTop: 2 },
  cardActions: { gap: 8 },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: adminTheme.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: adminTheme.dangerBg, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: adminTheme.surface, borderRadius: 24, padding: 24, maxHeight: '90%',
    width: '100%', maxWidth: MODAL_MAX_WIDTH, alignSelf: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: adminTheme.text, marginBottom: 16 },
  fieldBox: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: adminTheme.text, marginBottom: 5 },
  fieldInput: { borderWidth: 1.5, borderColor: adminTheme.border, borderRadius: 12, padding: 11, fontSize: 15, color: adminTheme.text },
  noImageHint: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: adminTheme.surfaceAlt, borderRadius: 12, padding: 12,
  },
  noImageHintText: { flex: 1, color: adminTheme.textMuted, fontSize: 12, lineHeight: 17 },
  imagePickerRow: { flexDirection: 'row', gap: 10, paddingVertical: 2 },
  imageOption: { width: 64, height: 64, borderRadius: 12, borderWidth: 2, borderColor: adminTheme.border, overflow: 'hidden' },
  imageOptionActive: { borderColor: adminTheme.accent },
  imageOptionThumb: { width: '100%', height: '100%' },
  imageOptionCheck: { position: 'absolute', top: 2, right: 2, backgroundColor: '#fff', borderRadius: 10 },
  saveBtn: { backgroundColor: adminTheme.cta, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  saveBtnText: { color: adminTheme.ctaText, fontWeight: '700', fontSize: 15 },
  cancelBtn: { padding: 12, alignItems: 'center', marginBottom: 8 },
  cancelBtnText: { color: adminTheme.textMuted, fontSize: 14 },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: adminTheme.surface,
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
  },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: adminTheme.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmTitle: { fontSize: 20, fontWeight: '800', color: adminTheme.text },
  confirmText: { fontSize: 14, color: adminTheme.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  confirmActions: { flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' },
  confirmCancel: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: adminTheme.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: { color: adminTheme.text, fontSize: 15, fontWeight: '700' },
  confirmDelete: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: adminTheme.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
