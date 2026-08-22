import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from './AnimatedPressable';
import { adminTheme } from '../theme/colors';

// ป็อปอัพยืนยัน 2 ปุ่ม (ยกเลิก/ตกลง) แบบ custom modal — ใช้แทน Alert.alert
// เพราะ Alert.alert ของ React Native ไม่แสดงผลบนเว็บเลย (silent no-op)
export default function ConfirmDialog({
  visible,
  icon = 'refresh-outline',
  title,
  message,
  cancelLabel = 'ยกเลิก',
  confirmLabel = 'ตกลง',
  onCancel,
  onConfirm,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.iconCircle}>
            <Ionicons name={icon} size={32} color={adminTheme.accent} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <AnimatedPressable style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </AnimatedPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  box: {
    backgroundColor: adminTheme.surface, borderRadius: 24, padding: 24,
    alignItems: 'center', width: '100%', maxWidth: 340, borderWidth: 1, borderColor: adminTheme.border,
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: adminTheme.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '800', color: adminTheme.text, textAlign: 'center' },
  message: { fontSize: 14, color: adminTheme.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' },
  cancelBtn: {
    flex: 1, height: 46, borderRadius: 12, backgroundColor: adminTheme.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelText: { color: adminTheme.text, fontSize: 14, fontWeight: '700' },
  confirmBtn: {
    flex: 1, height: 46, borderRadius: 12, backgroundColor: adminTheme.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
