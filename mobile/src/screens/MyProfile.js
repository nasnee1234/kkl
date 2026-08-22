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
import { useQueue } from '../contexts/QueueContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

export default function MyProfile() {
  const navigation = useNavigation();
  const { soundEnabled, vibrateEnabled, preAlertEnabled, toggleSound, toggleVibrate, togglePreAlert } = useQueue();
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

  const toggles = [
    { key: 'sound', icon: 'volume-high-outline', name: 'เสียงเรียกคิว', desc: 'ดังเป็นเสียงระฆังตอนถึงคิวคุณ', value: soundEnabled, onToggle: toggleSound },
    { key: 'vibrate', icon: 'phone-portrait-outline', name: 'สั่นเตือน', desc: 'สั่นซ้ำหลายครั้งพร้อมเสียง', value: vibrateEnabled, onToggle: toggleVibrate },
    { key: 'preAlert', icon: 'notifications-outline', name: 'เตือนล่วงหน้า 2 คิว', desc: 'ให้เวลาเดินมาที่ร้านพอดี', value: preAlertEnabled, onToggle: togglePreAlert },
  ];

  const rows = [
    { icon: 'receipt-outline', label: 'ประวัติการสั่ง' },
    { icon: 'heart-outline', label: 'เมนูที่ชอบ' },
    { icon: 'help-circle-outline', label: 'ช่วยเหลือ / ติดต่อร้าน' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0) || 'ผ'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user.name}</Text>
          <TouchableOpacity onPress={() => { setPhone(user.phone); setEditOpen(true); }}>
            <Text style={styles.userPhone}>
              {user.phone || 'ยังไม่ได้ระบุเบอร์'} · แตะเพื่อแก้ไข
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        {toggles.map((t, i) => (
          <View key={t.key} style={[styles.toggleRow, i < toggles.length - 1 && styles.rowBorder]}>
            <View style={styles.rowIcon}>
              <Ionicons name={t.icon} size={19} color={colors.primaryDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t.name}</Text>
              <Text style={styles.rowDesc}>{t.desc}</Text>
            </View>
            <TouchableOpacity
              style={[styles.switchTrack, t.value && styles.switchTrackOn]}
              onPress={t.onToggle}
              activeOpacity={0.85}
            >
              <View style={[styles.switchThumb, t.value && styles.switchThumbOn]} />
            </TouchableOpacity>
          </View>
        ))}

        {rows.map((r, i) => (
          <TouchableOpacity key={r.label} style={[styles.navRow, styles.rowBorder]} activeOpacity={0.7}>
            <View style={styles.rowIconNeutral}>
              <Ionicons name={r.icon} size={19} color={colors.textDark} />
            </View>
            <Text style={styles.navRowLabel}>{r.label}</Text>
            <Ionicons name="chevron-forward-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.navRow} onPress={() => navigation.navigate('AdminLogin')} activeOpacity={0.7}>
          <View style={styles.rowIconNeutral}>
            <Ionicons name="shield-checkmark-outline" size={19} color={colors.textDark} />
          </View>
          <Text style={styles.navRowLabel}>สำหรับผู้ดูแลระบบ</Text>
          <Ionicons name="chevron-forward-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={19} color={colors.primaryDeep} />
        <Text style={styles.logoutText}>ออกจากระบบ</Text>
      </TouchableOpacity>

      <Modal visible={editOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>แก้ไขเบอร์โทร</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="0xx-xxx-xxxx"
              keyboardType="phone-pad"
              placeholderTextColor={colors.textMuted}
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
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 18, paddingTop: 52, paddingBottom: 118 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.leafLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.heading, fontSize: 24, color: '#3D472B' },
  userName: { fontFamily: fonts.heading, fontSize: 22, color: colors.textDark },
  userPhone: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginTop: 3 },

  card: { backgroundColor: colors.card, borderRadius: 28, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.creamSoft, alignItems: 'center', justifyContent: 'center' },
  rowIconNeutral: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.creamSoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.textDark },
  rowDesc: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  switchTrack: { width: 50, height: 30, borderRadius: 999, backgroundColor: colors.border, padding: 3, justifyContent: 'center' },
  switchTrackOn: { backgroundColor: colors.primary },
  switchThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  switchThumbOn: { transform: [{ translateX: 20 }] },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16 },
  navRowLabel: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.textDark },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 16, padding: 16,
  },
  logoutText: { fontFamily: fonts.bodyExtraBold, fontSize: 15, color: colors.primaryDeep },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(32,30,29,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.textDark, marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 999, padding: 14,
    fontFamily: fonts.body, fontSize: 15, color: colors.textDark, marginBottom: 16,
  },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 999, padding: 16, alignItems: 'center', marginBottom: 8 },
  saveBtnText: { fontFamily: fonts.heading, fontSize: 16, color: '#fff' },
  cancelBtn: { borderRadius: 999, padding: 14, alignItems: 'center' },
  cancelBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textMuted },
});
