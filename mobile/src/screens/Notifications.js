import { useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueue } from '../contexts/QueueContext';
import ScreenHeader from '../components/ScreenHeader';
import { colors } from '../theme/colors';
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

  useEffect(() => {
    return () => markNotificationsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
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
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>ยังไม่มีการแจ้งเตือน</Text>
          </View>
        }
        renderItem={({ item }) => {
          const tone = toneFor(item.message);
          const body = item.message.replace(/^[^\s]+\s/, '');
          return (
            <View style={[styles.row, item.read && styles.rowRead]}>
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
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  headerWrap: { paddingTop: 52, paddingHorizontal: 18 },
  readAll: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primaryDeep },
  list: { paddingHorizontal: 18, paddingBottom: 118, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 10 },
  emptyText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 14 },
  row: {
    flexDirection: 'row', gap: 13, backgroundColor: colors.card, borderRadius: 20,
    padding: 15, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  rowRead: { backgroundColor: 'transparent', borderColor: 'transparent' },
  icon: { width: 42, height: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  message: { flex: 1, fontFamily: fonts.bodyExtraBold, fontSize: 14.5, color: colors.textDark, lineHeight: 20 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  time: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted, marginTop: 7 },
});
