import { useCallback, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useQueue } from '../contexts/QueueContext';
import ScreenHeader from '../components/ScreenHeader';
import PatternBackground from '../components/PatternBackground';
import Receipt from '../components/Receipt';
import { colors, shadows } from '../theme/colors';
import { useLayout } from '../theme/layout';
import { fonts } from '../theme/fonts';

const TONE = {
  a: { bg: colors.creamSoft, fg: colors.primaryDeep, icon: 'megaphone-outline' },
  a2: { bg: colors.leafLight, fg: '#3D472B', icon: 'checkmark-done-outline' },
  n: { bg: '#EEE7DB', fg: colors.textDark, icon: 'notifications-outline' },
};

function toneFor(message) {
  if (message.startsWith('🔔')) return { ...TONE.a, icon: 'megaphone-outline' };
  if (message.startsWith('⏰')) return { ...TONE.a, icon: 'alarm-outline' };
  if (message.startsWith('✅')) return { ...TONE.a2, icon: 'checkmark-done-outline' };
  return TONE.n;
}

export default function Notifications() {
  const { notifications, markNotificationsRead } = useQueue();
  const { stackMaxWidth, gutter } = useLayout();
  const [activeReceipt, setActiveReceipt] = useState(null);

  // อ่านทันทีที่เข้ามาหน้านี้ (ไม่ใช่ตอนออกจากหน้า) — ตราบใดที่ user เห็นหน้านี้ถือว่าอ่านแล้ว
  // ใช้ useFocusEffect แทน useEffect เพราะแท็บนี้ถูก mount ค้างไว้ในตัว bottom tab navigator
  // สลับแท็บไปมาไม่ทำให้ unmount ใหม่ ต้องดักตอน "โฟกัส" แทนตอน "mount"
  useFocusEffect(
    useCallback(() => {
      markNotificationsRead();
    }, [markNotificationsRead])
  );

  return (
    <PatternBackground>
      <View style={[styles.headerWrap, { maxWidth: stackMaxWidth, paddingHorizontal: gutter }]}>
        <ScreenHeader
          title="แจ้งเตือน"
          right={
            <TouchableOpacity onPress={markNotificationsRead}>
              <Text style={styles.readAll}>อ่านทั้งหมด</Text>
            </TouchableOpacity>
          }
        />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { maxWidth: stackMaxWidth, paddingHorizontal: gutter }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>ยังไม่มีการแจ้งเตือน</Text>
          </View>
        }
        renderItem={({ item }) => {
          const tone = toneFor(item.message);
          const body = item.message.replace(/^[^\s]+\s/, '');
          const hasReceipt = !!item.receipt;
          const Row = hasReceipt ? TouchableOpacity : View;
          const rowExtraProps = hasReceipt
            ? { activeOpacity: 0.75, onPress: () => setActiveReceipt(item.receipt) }
            : {};
          return (
            <Row style={[styles.row, item.read && styles.rowRead]} {...rowExtraProps}>
              <View style={[styles.icon, { backgroundColor: tone.bg }]}>
                <Ionicons name={tone.icon} size={19} color={tone.fg} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.message} numberOfLines={2}>{body}</Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.time}>
                  {item.time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {hasReceipt && (
                  <View style={styles.receiptLink}>
                    <Ionicons name="receipt-outline" size={13} color={colors.primaryDeep} />
                    <Text style={styles.receiptLinkText}>ดูใบเสร็จ</Text>
                  </View>
                )}
              </View>
              {hasReceipt && <Ionicons name="chevron-forward-outline" size={18} color={colors.textMuted} />}
            </Row>
          );
        }}
      />

      <Modal visible={!!activeReceipt} animationType="fade">
        <View style={styles.receiptOverlay}>
          <ScrollView contentContainerStyle={styles.receiptScroll}>
            {activeReceipt && (
              <Receipt
                queueNumber={activeReceipt.queueNumber}
                amount={activeReceipt.amount}
                paidAt={activeReceipt.paidAt}
                paymentMethod={activeReceipt.paymentMethod}
                lines={activeReceipt.lines}
                onClose={() => setActiveReceipt(null)}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </PatternBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  headerWrap: { paddingTop: 52, width: '100%', alignSelf: 'center' },
  readAll: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primaryDeep },
  list: { paddingBottom: 118, flexGrow: 1, width: '100%', alignSelf: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 10 },
  emptyText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 14 },
  row: {
    flexDirection: 'row', gap: 15, backgroundColor: colors.card, borderRadius: 22,
    padding: 17, marginBottom: 12, borderWidth: 1, borderColor: colors.border,
    ...shadows.sm,
  },
  rowRead: { backgroundColor: 'rgba(251,247,240,0.55)', borderColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  icon: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  message: { flex: 1, fontFamily: fonts.bodyExtraBold, fontSize: 14.5, color: colors.textDark, lineHeight: 21 },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  time: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted, marginTop: 8 },
  receiptLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  receiptLinkText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.primaryDeep },
  receiptOverlay: { flex: 1, backgroundColor: colors.leaf },
  receiptScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingTop: 60 },
});
