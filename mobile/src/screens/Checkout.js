import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { serverTimestamp } from 'firebase/firestore';
import { useCart } from '../contexts/CartContext';
import { useQueue } from '../contexts/QueueContext';
import { createQueueWithNumber, formatQueueLabel } from '../utils/queueNumbers';
import { registerForPushNotifications } from '../utils/notifications';
import AnimatedPressable from '../components/AnimatedPressable';
import ClosedPopup from '../components/ClosedPopup';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

const PHONE_REGEX = /^0[0-9]{9}$/;
const MEMBER_DISCOUNT_THRESHOLD = 100;
const MEMBER_DISCOUNT = 10;

const SLOTS = ['เร็วสุด', 'อีก 15 นาที', 'อีก 30 นาที'];
const PAYMENT_OPTIONS = [
  { key: 'promptpay', label: 'พร้อมเพย์ / สแกน QR', icon: 'qr-code-outline' },
  { key: 'cash', label: 'เงินสดที่ร้าน', icon: 'wallet-outline' },
  { key: 'card', label: 'บัตรเดบิต/เครดิต', icon: 'card-outline' },
];

export default function Checkout() {
  const navigation = useNavigation();
  const { items, total, updateQty, clear } = useCart();
  const { acceptingQueue, takeQueue, callingNumber, MIN_PER_QUEUE, QUEUE_AHEAD_NORMALIZE } = useQueue();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [slot, setSlot] = useState(SLOTS[0]);
  const [paymentMethod, setPaymentMethod] = useState('promptpay');
  const [phoneError, setPhoneError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [closedPopupVisible, setClosedPopupVisible] = useState(false);
  const [queueFullMessage, setQueueFullMessage] = useState(null);

  const subtotal = total;
  const discount = subtotal >= MEMBER_DISCOUNT_THRESHOLD ? MEMBER_DISCOUNT : 0;
  const netTotal = subtotal - discount;
  const nextLabel = formatQueueLabel((callingNumber || 0) + QUEUE_AHEAD_NORMALIZE);
  const nextWait = `${QUEUE_AHEAD_NORMALIZE * MIN_PER_QUEUE} นาที`;

  const handleConfirm = async () => {
    setPhoneError(false);
    if (!PHONE_REGEX.test(phone.trim())) {
      setPhoneError(true);
      return;
    }
    if (!acceptingQueue) {
      setClosedPopupVisible(true);
      return;
    }

    setSubmitting(true);
    try {
      const { pushToken, webPushSubscription } = await registerForPushNotifications();
      const queue = await createQueueWithNumber({
        customerName: name.trim() || 'ลูกค้า',
        status: 'waiting',
        items,
        phone: phone.trim(),
        note: note.trim(),
        slot,
        paymentMethod,
        pushToken: pushToken || null,
        webPushSubscription: webPushSubscription || null,
        createdAt: serverTimestamp(),
      });

      clear();
      takeQueue({ id: queue.id, number: queue.number, items, phone: phone.trim(), paymentMethod });
      navigation.navigate('CustomerTabs', { screen: 'คิวของฉัน' });
    } catch (e) {
      if (e.code === 'QUEUE_FULL') {
        setQueueFullMessage(e.message);
      } else {
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถยืนยันออเดอร์ได้ กรุณาลองใหม่');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ยืนยันออเดอร์ + จองคิว</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <View style={styles.infoBanner}>
            <Ionicons name="restaurant-outline" size={22} color={colors.leaf} />
            <Text style={styles.infoBannerText}>
              จองคิวไว้ก่อนได้เลย แล้วบอกเมนูกับพี่กะเมาะห์ตอนถึงคิว (ดูราคาได้ที่หน้าเมนู)
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            {items.map((item) => (
              <View key={item.menuId} style={styles.itemRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemUnitPrice}>฿{item.price} / ชิ้น</Text>
                </View>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => updateQty(item.menuId, item.qty - 1)}>
                    <Ionicons name="remove" size={14} color={colors.textDark} />
                  </TouchableOpacity>
                  <Text style={styles.stepperQty}>{item.qty}</Text>
                  <TouchableOpacity style={[styles.stepperBtn, styles.stepperBtnAdd]} onPress={() => updateQty(item.menuId, item.qty + 1)}>
                    <Ionicons name="add" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemTotal}>฿{item.price * item.qty}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionLabel}>มารับตอนไหน</Text>
        <View style={styles.slotsRow}>
          {SLOTS.map((s) => {
            const active = slot === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.slotChip, active && styles.slotChipActive]}
                onPress={() => setSlot(s)}
              >
                <Text style={[styles.slotChipText, active && styles.slotChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>ชื่อผู้รับ + เบอร์โทร</Text>
        <TextInput
          style={styles.pillInput}
          value={name}
          onChangeText={setName}
          placeholder="ชื่อที่จะให้เรียก"
          placeholderTextColor={colors.textMuted}
        />
        <TextInput
          style={[styles.pillInput, { marginTop: 9 }]}
          value={phone}
          onChangeText={(v) => { setPhone(v); setPhoneError(false); }}
          placeholder="เบอร์โทร (ให้เตือนตอนถึงคิว)"
          keyboardType="phone-pad"
          maxLength={10}
          placeholderTextColor={colors.textMuted}
        />
        {phoneError && (
          <View style={styles.errorRow}>
            <Ionicons name="warning-outline" size={15} color={colors.primaryDeep} />
            <Text style={styles.errorText}>ใส่เบอร์ 10 หลักด้วยจ๊ะ เราจะเตือนตอนถึงคิว</Text>
          </View>
        )}
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="บอกร้านเพิ่มได้ เช่น เผ็ดน้อย ไม่ใส่ผัก"
          placeholderTextColor={colors.textMuted}
          multiline
        />

        <Text style={styles.sectionLabel}>จ่ายด้วย</Text>
        <View style={styles.card}>
          {PAYMENT_OPTIONS.map((opt, i) => {
            const active = paymentMethod === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.payRow, i < PAYMENT_OPTIONS.length - 1 && styles.rowBorder]}
                onPress={() => setPaymentMethod(opt.key)}
                activeOpacity={0.75}
              >
                <View style={styles.payIcon}>
                  <Ionicons name={opt.icon} size={18} color={colors.textDark} />
                </View>
                <Text style={styles.payLabel}>{opt.label}</Text>
                <View style={[styles.radioRing, active && styles.radioRingActive]}>
                  {active && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {items.length > 0 && (
          <View style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalRowLeft}>ราคาอาหาร</Text>
              <Text style={styles.totalRowRight}>฿{subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalRowLeft, discount > 0 && styles.discountColor]}>
                ส่วนลดสมาชิก{discount ? '' : ' (ยอด 100 ฿ ขึ้นไป)'}
              </Text>
              <Text style={[styles.totalRowRight, discount > 0 && styles.discountColor]}>
                {discount ? `-฿${discount}` : '—'}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalRowLeft}>ค่าจองคิว</Text>
              <Text style={styles.totalRowRight}>ฟรี</Text>
            </View>
            <View style={styles.netRow}>
              <Text style={styles.netLabel}>ยอดสุทธิ</Text>
              <Text style={styles.netValue}>฿{netTotal.toLocaleString()}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomPreviewRow}>
          <Text style={styles.bottomPreviewLeft}>คิวที่คุณจะได้</Text>
          <Text style={styles.bottomPreviewRight}>{nextLabel} · รอประมาณ {nextWait}</Text>
        </View>
        <AnimatedPressable style={[styles.confirmBtn, submitting && styles.disabled]} onPress={handleConfirm} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="ticket-outline" size={20} color="#fff" />
              <Text style={styles.confirmText}>
                {items.length > 0 ? `ยืนยัน จองคิว ฿${netTotal.toLocaleString()}` : 'ยืนยัน จองคิว'}
              </Text>
            </>
          )}
        </AnimatedPressable>
      </View>

      <ClosedPopup visible={closedPopupVisible} onAck={() => setClosedPopupVisible(false)} />
      <ClosedPopup
        visible={!!queueFullMessage}
        onAck={() => setQueueFullMessage(null)}
        icon="alert-circle-outline"
        title="คิวเต็มแล้ว"
        message={queueFullMessage || ''}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 52, paddingHorizontal: 18, paddingBottom: 12,
    backgroundColor: colors.cream, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.creamSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.textDark },
  content: { padding: 18, paddingBottom: 40 },
  infoBanner: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.leafLight, borderRadius: 20, padding: 16 },
  infoBannerText: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 13, color: '#3D472B', lineHeight: 19 },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  itemName: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.textDark },
  itemUnitPrice: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.creamSoft, borderRadius: 999, padding: 4 },
  stepperBtn: { width: 28, height: 28, borderRadius: 999, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  stepperBtnAdd: { backgroundColor: colors.primary },
  stepperQty: { fontFamily: fonts.bodyExtraBold, fontSize: 14, minWidth: 13, textAlign: 'center', color: colors.textDark },
  itemTotal: { fontFamily: fonts.heading, fontSize: 15, minWidth: 52, textAlign: 'right', color: colors.textDark },

  sectionLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.textMuted, marginTop: 22, marginBottom: 10 },
  slotsRow: { flexDirection: 'row', gap: 8 },
  slotChip: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 13, alignItems: 'center', backgroundColor: colors.card },
  slotChipActive: { backgroundColor: colors.creamSoft, borderColor: colors.primary },
  slotChipText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textDark },
  slotChipTextActive: { color: colors.primaryDeep },

  pillInput: {
    width: '100%', borderWidth: 1, borderColor: colors.border, outlineStyle: 'none',
    backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 14,
    fontFamily: fonts.body, fontSize: 14, color: colors.textDark,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8 },
  errorText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.primaryDeep },
  noteInput: {
    width: '100%', marginTop: 9, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 14,
    fontFamily: fonts.body, fontSize: 14, minHeight: 74, color: colors.textDark, textAlignVertical: 'top',
  },

  payRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  payIcon: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.creamSoft, alignItems: 'center', justifyContent: 'center' },
  payLabel: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.textDark },
  radioRing: { width: 22, height: 22, borderRadius: 999, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioRingActive: { borderColor: colors.primary, backgroundColor: colors.primary },

  totalsCard: { marginTop: 20, backgroundColor: colors.creamSoft, borderRadius: 20, padding: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  totalRowLeft: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  totalRowRight: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textDark },
  discountColor: { color: '#56633F', fontFamily: fonts.bodyBold },
  netRow: {
    marginTop: 12, paddingTop: 12, borderTopWidth: 1.5, borderTopColor: colors.border, borderStyle: 'dashed',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
  },
  netLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 14, color: colors.textDark },
  netValue: { fontFamily: fonts.heading, fontSize: 24, color: colors.primaryDeep },

  bottomBar: { backgroundColor: colors.creamSoft, borderTopWidth: 1, borderTopColor: colors.border, padding: 18, paddingBottom: 28 },
  bottomPreviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  bottomPreviewLeft: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  bottomPreviewRight: { fontFamily: fonts.bodyExtraBold, fontSize: 12.5, color: colors.textDark },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 17,
  },
  disabled: { opacity: 0.7 },
  confirmText: { fontFamily: fonts.heading, fontSize: 16, color: '#fff' },
});
