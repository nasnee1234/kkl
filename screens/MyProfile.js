import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function MyProfile() {
  const navigation = useNavigation();
  const [user, setUser] = useState({ name: 'ผู้ใช้งาน', phone: '' });
  const [editOpen, setEditOpen] = useState(false);
  const [phone, setPhone] = useState('');

  const handleSave = () => {
    setUser((prev) => ({ ...prev, phone }));
    setEditOpen(false);
  };

  const handleLogout = () => {
    Alert.alert('ออกจากระบบ', 'คุณต้องการออกจากระบบหรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ออกจากระบบ', style: 'destructive', onPress: () => {} },
    ]);
  };

  const menuItems = [
    { icon: 'calendar-check-outline', label: 'รายการการจอง', color: '#3b82f6', bg: '#eff6ff' },
    { icon: 'pricetag-outline', label: 'โปรโมชั่น / คูปอง', color: '#f59e0b', bg: '#fffbeb' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>โปรไฟล์</Text>
      </View>

      {/* User Card */}
      <View style={styles.card}>
        <View style={styles.avatarBox}>
          <Ionicons name="person" size={32} color="#b45309" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <View style={styles.phoneRow}>
            <Ionicons name="call-outline" size={14} color="#9ca3af" />
            <Text style={styles.phoneText}>{user.phone || 'ยังไม่ได้ระบุเบอร์โทร'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => { setPhone(user.phone); setEditOpen(true); }}
        >
          <Ionicons name="create-outline" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={styles.menuCard}>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, i < menuItems.length - 1 && styles.menuItemBorder]}
          >
            <View style={[styles.menuIconBox, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward-outline" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>ออกจากระบบ</Text>
      </TouchableOpacity>

      {/* Admin Entry */}
      <TouchableOpacity style={styles.adminBtn} onPress={() => navigation.navigate('AdminLogin')}>
        <Ionicons name="shield-checkmark-outline" size={18} color="#6b7280" />
        <Text style={styles.adminBtnText}>สำหรับผู้ดูแลระบบ</Text>
        <Ionicons name="chevron-forward-outline" size={16} color="#9ca3af" />
      </TouchableOpacity>

      {/* Edit Modal */}
      <Modal visible={editOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>แก้ไขโปรไฟล์</Text>
            <Text style={styles.inputLabel}>เบอร์โทรศัพท์</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="0xx-xxx-xxxx"
              keyboardType="phone-pad"
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>บันทึก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditOpen(false)}>
              <Text style={styles.cancelBtnText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: { flex: 1, marginLeft: 14 },
  userName: { fontSize: 17, fontWeight: '600', color: '#1f2937' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  phoneText: { fontSize: 13, color: '#6b7280' },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, marginLeft: 14, fontSize: 14, fontWeight: '500', color: '#1f2937' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 16,
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  adminBtnText: { flex: 1, color: '#6b7280', fontSize: 14, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1f2937',
    marginBottom: 16,
  },
  saveBtn: { backgroundColor: '#b45309', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: '#6b7280', fontSize: 15 },
});
