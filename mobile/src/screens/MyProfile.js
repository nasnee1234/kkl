import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQueue } from '../contexts/QueueContext';
import { colors, APP_MAX_WIDTH } from '../theme/colors';
import { fonts } from '../theme/fonts';

const SHOP_PHONE = '0812773375';
const SHOP_PHONE_LABEL = '081-277-3375';

export default function MyProfile() {
  const navigation = useNavigation();
  const { soundEnabled, vibrateEnabled, preAlertEnabled, toggleSound, toggleVibrate, togglePreAlert } = useQueue();
  const [helpOpen, setHelpOpen] = useState(false);

  const toggles = [
    { key: 'sound', icon: 'volume-high-outline', name: 'เสียงเรียกคิว', desc: 'ดังเป็นเสียงระฆังตอนถึงคิวคุณ', value: soundEnabled, onToggle: toggleSound },
    { key: 'vibrate', icon: 'phone-portrait-outline', name: 'สั่นเตือน', desc: 'สั่นซ้ำหลายครั้งพร้อมเสียง', value: vibrateEnabled, onToggle: toggleVibrate },
    { key: 'preAlert', icon: 'notifications-outline', name: 'เตือนล่วงหน้า 2 คิว', desc: 'ให้เวลาเดินมาที่ร้านพอดี', value: preAlertEnabled, onToggle: togglePreAlert },
  ];

  const rows = [
    { icon: 'help-circle-outline', label: 'ช่วยเหลือ / ติดต่อร้าน' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>ฉัน</Text>

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
          <TouchableOpacity
            key={r.label}
            style={[styles.navRow, styles.rowBorder]}
            activeOpacity={0.7}
            onPress={() => setHelpOpen(true)}
          >
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

      <Modal visible={helpOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.helpIconCircle}>
              <Ionicons name="help-circle-outline" size={30} color={colors.primaryDeep} />
            </View>
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>ติดต่อร้าน</Text>
            <Text style={styles.helpDesc}>มีคำถามหรือต้องการความช่วยเหลือ ติดต่อร้านได้ที่เบอร์นี้เลยจ้า</Text>

            <TouchableOpacity
              style={styles.helpPhoneRow}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(`tel:${SHOP_PHONE}`)}
            >
              <View style={styles.rowIcon}>
                <Ionicons name="call-outline" size={19} color={colors.primaryDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.helpPhoneLabel}>โทรหาร้าน</Text>
                <Text style={styles.helpPhoneNumber}>{SHOP_PHONE_LABEL}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setHelpOpen(false)}>
              <Text style={styles.cancelBtnText}>ปิด</Text>
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
  screenTitle: { fontFamily: fonts.heading, fontSize: 26, color: colors.textDark, marginBottom: 16 },

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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(32,30,29,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: colors.card, borderRadius: 28, padding: 24,
    width: '100%', maxWidth: APP_MAX_WIDTH, alignSelf: 'center',
  },
  modalTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.textDark, marginBottom: 16 },

  helpIconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.creamSoft,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 10,
  },
  helpDesc: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: -8, marginBottom: 18, lineHeight: 19 },
  helpPhoneRow: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: colors.creamSoft, borderRadius: 18, padding: 14, marginBottom: 8,
  },
  helpPhoneLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  helpPhoneNumber: { fontFamily: fonts.bodyExtraBold, fontSize: 17, color: colors.textDark, marginTop: 2 },
  cancelBtn: { borderRadius: 999, padding: 14, alignItems: 'center' },
  cancelBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textMuted },
});
