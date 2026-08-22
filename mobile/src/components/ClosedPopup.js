import { Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from './AnimatedPressable';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

// ป็อปอัพแจ้งเตือนแบบปุ่มเดียว — ค่าเริ่มต้นคือ "ร้านยังไม่พร้อมรับคิว"
// ใส่ title/message/icon เองได้ (เช่นใช้แจ้ง "คิวเต็มแล้ว" ด้วยคอมโพเนนต์เดียวกัน)
// ขึ้นทุกครั้งที่พยายามกด ไม่ใช่แค่ครั้งเดียว (ต่างจาก demo ต้นแบบที่จำการปิดไว้)
export default function ClosedPopup({
  visible,
  onAck,
  icon = 'time-outline',
  title = 'ยังไม่พร้อมรับคิว',
  message = 'กรุณารอสักครู่ค่ะ\nทางร้านจะเปิดรับคิวอีกครั้งเร็ว ๆ นี้',
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.iconCircle}>
            <Ionicons name={icon} size={38} color={colors.primaryDeep} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <AnimatedPressable style={styles.ackBtn} onPress={onAck}>
            <Text style={styles.ackText}>รับทราบ</Text>
          </AnimatedPressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(32,30,29,0.55)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  box: { backgroundColor: colors.cream, borderRadius: 28, padding: 26, alignItems: 'center', width: '100%', maxWidth: 340 },
  iconCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.creamSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontFamily: fonts.heading, fontSize: 24, color: colors.textDark, textAlign: 'center' },
  message: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  ackBtn: { marginTop: 22, width: '100%', backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 18, alignItems: 'center' },
  ackText: { fontFamily: fonts.heading, fontSize: 18, color: '#fff' },
});
