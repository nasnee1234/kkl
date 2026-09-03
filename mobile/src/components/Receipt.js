import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from './AnimatedPressable';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { formatQueueLabel } from '../utils/queueNumbers';

const PAYMENT_LABEL = {
  cash: 'เงินสด',
  promptpay: 'พร้อมเพย์',
  card: 'บัตร',
};

function refNumber(queueNumber, paidAt) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const tail = queueNumber != null ? formatQueueLabel(queueNumber) : 'PO';
  return `KM-${y}${m}${d}-${tail}`;
}

// เต็มจอสีเขียว accent-2 ตามดีไซน์ต้นแบบ — ใช้แสดงตอนลูกค้ากดดูใบเสร็จ
export default function Receipt({ queueNumber, amount, paidAt, paymentMethod, lines, onClose }) {
  return (
    <View style={styles.screen}>
      <View style={styles.head}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={44} color={colors.leaf} />
        </View>
        <Text style={styles.headTitle}>รับอาหารเรียบร้อย</Text>
        <Text style={styles.headSub}>ขอบคุณที่อุดหนุนกะเมาะห์จ๊ะ</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>ใบเสร็จ</Text>
          <Text style={styles.cardNumber}>{queueNumber != null ? formatQueueLabel(queueNumber) : 'สั่งล่วงหน้า'}</Text>
        </View>
        <Text style={styles.refText}>{refNumber(queueNumber, paidAt)} · {paidAt}</Text>

        <View style={styles.dashed} />

        {lines?.length ? (
          <View style={{ gap: 10, marginBottom: 4 }}>
            {lines.map((l, i) => (
              <View key={i} style={styles.lineRow}>
                <Text style={styles.lineLeft}>{l.left}</Text>
                <Text style={styles.lineRight}>{l.right}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.lineRow}>
          <Text style={styles.lineLeftMuted}>ช่องทางชำระ</Text>
          <Text style={styles.lineRight}>{PAYMENT_LABEL[paymentMethod] || 'ที่ร้าน'}</Text>
        </View>

        <View style={styles.dashed} />

        <View style={styles.netRow}>
          <Text style={styles.netLabel}>ยอดชำระ</Text>
          <Text style={styles.netValue}>{Number(amount).toLocaleString('th-TH')} ฿</Text>
        </View>
      </View>

      <AnimatedPressable style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeText}>เสร็จสิ้น</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { width: '100%', maxWidth: 400, alignItems: 'stretch', padding: 4 },
  head: { alignItems: 'center', marginBottom: 20 },
  checkCircle: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  headTitle: { fontFamily: fonts.heading, fontSize: 30, color: '#fff', textAlign: 'center' },
  headSub: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: '#fff', opacity: 0.95, marginTop: 6 },

  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20 },
  cardTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  cardTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.textDark },
  cardNumber: { fontFamily: fonts.heading, fontSize: 22, color: colors.primaryDeep },
  refText: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 3 },
  dashed: { marginVertical: 14, borderTopWidth: 1.5, borderTopColor: colors.border, borderStyle: 'dashed' },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  lineLeft: { fontFamily: fonts.body, fontSize: 14.5, color: colors.textDark, flex: 1 },
  lineLeftMuted: { fontFamily: fonts.body, fontSize: 14.5, color: colors.textMuted },
  lineRight: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.textDark },
  netRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  netLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 15, color: colors.textDark },
  netValue: { fontFamily: fonts.heading, fontSize: 26, color: colors.primaryDeep },

  closeBtn: {
    marginTop: 18, backgroundColor: '#fff', borderRadius: 999,
    paddingVertical: 20, alignItems: 'center',
  },
  closeText: { fontFamily: fonts.heading, fontSize: 20, color: colors.leaf },
});
