import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useQueue } from '../contexts/QueueContext';
import { db } from '../config/firebase';
import { createQueueWithNumber, formatQueueLabel } from '../utils/queueNumbers';
import { registerForPushNotifications } from '../utils/notifications';
import AnimatedPressable from '../components/AnimatedPressable';
import ProgressRing from '../components/ProgressRing';
import Receipt from '../components/Receipt';
import IncomingCallOverlay from '../components/IncomingCallOverlay';
import ClosedPopup from '../components/ClosedPopup';
import Toast, { useToast } from '../components/Toast';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

const STATUS_COPY = {
  calling: { title: 'ถึงคิวของคุณแล้ว!', note: 'กรุณามาที่เคาน์เตอร์ทันที', icon: 'megaphone-outline', iconBg: colors.primaryDeep },
  done: { title: 'เสร็จสิ้นแล้ว', note: 'ขอบคุณที่ใช้บริการ', icon: 'checkmark-done-outline', iconBg: colors.leaf },
  cancelled: { title: 'คิวถูกยกเลิก', note: 'คุณสามารถสั่งใหม่ได้', icon: 'close-outline', iconBg: colors.primaryDeep },
};

export default function QueueRequest() {
  const navigation = useNavigation();
  const {
    myQueue, takeQueue, clearQueue, callAlert, preWarning, dismissCallAlert, dismissPreWarning,
    callingNumber, queueProgress, acceptingQueue,
  } = useQueue();
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [bookingQuick, setBookingQuick] = useState(false);
  const [closedPopupVisible, setClosedPopupVisible] = useState(false);
  const [queueFullMessage, setQueueFullMessage] = useState(null);
  const [toastMsg, showToast] = useToast();

  const goMenu = () => navigation.navigate('เมนู');
  const goCheckout = () => {
    if (!acceptingQueue) {
      setClosedPopupVisible(true);
      return;
    }
    navigation.navigate('Checkout');
  };

  const handleQuickQueue = async () => {
    if (bookingQuick) return;
    if (!acceptingQueue) {
      setClosedPopupVisible(true);
      return;
    }
    setBookingQuick(true);
    try {
      const { pushToken, webPushSubscription } = await registerForPushNotifications();
      const queue = await createQueueWithNumber({
        customerName: 'ลูกค้า',
        status: 'waiting',
        items: [],
        phone: null,
        pushToken: pushToken || null,
        webPushSubscription: webPushSubscription || null,
        createdAt: serverTimestamp(),
      });
      takeQueue({ id: queue.id, number: queue.number, items: [], phone: null });
      showToast(`รับคิวแล้ว! คิวของคุณคือ ${formatQueueLabel(queue.number)}`);
    } catch (e) {
      if (e.code === 'QUEUE_FULL') {
        setQueueFullMessage(e.message);
      } else {
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถรับคิวได้ กรุณาลองใหม่');
      }
    } finally {
      setBookingQuick(false);
    }
  };

  const handleCancel = async () => {
    if (!myQueue?.id) return;
    try {
      await updateDoc(doc(db, 'queues', myQueue.id), { status: 'cancelled' });
    } catch (e) {
      // เน็ตหลุดหรือสิทธิ์ไม่พอ — ยังเคลียร์ฝั่งเราไว้ก่อน แอดมินเห็นสถานะเดิมได้จาก Firestore
    }
    clearQueue();
    showToast('ยกเลิกคิวแล้ว มาใหม่ได้ตลอดจ๊ะ');
  };

  // ── ไม่มีคิวอยู่: ปุ่มรับคิวด่วน + ทางเลือกสั่งอาหารพร้อมจอง ──
  if (!myQueue) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.h2}>คิวของฉัน</Text>

          <View style={styles.noTicketCard}>
            <Text style={styles.servingLabelSmall}>ตอนนี้เรียกถึงคิว</Text>
            <Text style={styles.servingBig}>{formatQueueLabel(callingNumber)}</Text>
          </View>

          <AnimatedPressable
            style={[styles.quickBtn, bookingQuick && styles.disabled]}
            onPress={handleQuickQueue}
            disabled={bookingQuick}
          >
            {bookingQuick ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <>
                <Ionicons name="ticket-outline" size={52} color="#fff" />
                <Text style={styles.quickBtnText}>กดรับคิว</Text>
                <Text style={styles.quickBtnSub}>แตะปุ่มนี้เพื่อรับคิว</Text>
              </>
            )}
          </AnimatedPressable>

          <View style={styles.reminderBanner}>
            <Ionicons name="notifications-outline" size={26} color={colors.leaf} />
            <Text style={styles.reminderText}>รับคิวแล้วรอที่ไหนก็ได้ โทรศัพท์จะดังและสั่นตอนถึงคิวคุณ</Text>
          </View>

          <TouchableOpacity style={styles.secondaryBtn} onPress={goCheckout} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>สั่งอาหารพร้อมจองคิว</Text>
          </TouchableOpacity>
        </ScrollView>
        <Toast message={toastMsg} />
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

  const status = myQueue.status || 'waiting';

  // ── มีคิวอยู่และยังรอ: การ์ดเข้ม + วงแหวนนับถอยหลัง ──
  if (status === 'waiting') {
    const orderLines = myQueue.items?.length
      ? myQueue.items.map((i) => ({ left: `${i.name} × ${i.qty}`, right: `฿${i.price * i.qty}` }))
      : [{ left: 'รับคิวหน้าร้าน · สั่งอาหารตอนถึงคิว', right: 'ที่ร้าน' }];

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.h2}>คิวของฉัน</Text>

          {preWarning && (
            <TouchableOpacity style={styles.preWarnBanner} onPress={dismissPreWarning} activeOpacity={0.85}>
              <Ionicons name="alarm-outline" size={20} color="#fff" />
              <Text style={styles.preWarnText}>อีก 2 คิวจะถึงคุณแล้ว เตรียมตัวได้เลย!</Text>
            </TouchableOpacity>
          )}

          <View style={styles.ticketCard}>
            <View style={styles.ticketBlob} />
            <View style={styles.ticketTop}>
              <View>
                <Text style={styles.ticketEyebrow}>คิวของคุณ</Text>
                <Text style={styles.ticketNumber}>{formatQueueLabel(myQueue.number)}</Text>
              </View>
              <ProgressRing
                size={96}
                strokeWidth={8}
                pct={queueProgress.pct}
                trackColor="rgba(255,255,255,.14)"
                fillColor={colors.primaryGlow}
              >
                <Text style={styles.ringMinutes}>
                  {queueProgress.aheadCount == null ? '…' : queueProgress.aheadCount === 0 ? 'ถึงคิว' : `${queueProgress.etaMinutes} น.`}
                </Text>
                <Text style={styles.ringSub}>โดยประมาณ</Text>
              </ProgressRing>
            </View>
            <View style={styles.ticketDivider} />
            <View style={styles.ticketStatsRow}>
              <View>
                <Text style={styles.ticketStatLabel}>เรียกถึงคิว</Text>
                <Text style={styles.ticketStatValue}>{formatQueueLabel(callingNumber)}</Text>
              </View>
              <View>
                <Text style={styles.ticketStatLabel}>รออีก</Text>
                <Text style={styles.ticketStatValue}>{queueProgress.aheadCount == null ? '—' : `${queueProgress.aheadCount} คิว`}</Text>
              </View>
              <View>
                <Text style={styles.ticketStatLabel}>ยอดชำระ</Text>
                <Text style={styles.ticketStatValue}>ที่ร้าน</Text>
              </View>
            </View>
          </View>

          <View style={styles.orderCard}>
            <Text style={styles.orderCardTitle}>ออเดอร์ของคุณ</Text>
            {orderLines.map((l, i) => (
              <View key={i} style={styles.orderLine}>
                <Text style={styles.orderLineLeft}>{l.left}</Text>
                <Text style={styles.orderLineRight}>{l.right}</Text>
              </View>
            ))}
          </View>

          <View style={styles.reminderBanner}>
            <Ionicons name="notifications-outline" size={22} color={colors.leaf} />
            <Text style={styles.reminderTextSm}>เปิดเสียงเรียกไว้แล้ว — โทรศัพท์จะดังและสั่นตอนถึงคิวคุณ แม้ปิดหน้าจอ</Text>
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
            <Text style={styles.cancelBtnText}>ยกเลิกคิวนี้</Text>
          </TouchableOpacity>
        </ScrollView>
        <Toast message={toastMsg} />

        <IncomingCallOverlay
          visible={callAlert}
          queueNumber={myQueue.number}
          onDismiss={dismissCallAlert}
          onSnooze={dismissCallAlert}
        />
      </View>
    );
  }

  // ── calling / done / cancelled ──
  const copy = STATUS_COPY[status] || STATUS_COPY.calling;
  const isDone = status === 'done' || status === 'cancelled';
  const showReceipt = status === 'done' && myQueue.saleAmount != null && myQueue.saleAmount > 0;
  const doneTime = myQueue.doneAt?.toDate
    ? myQueue.doneAt.toDate().toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.h2}>คิวของฉัน</Text>
        <View style={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: copy.iconBg }]}>
            <Ionicons name={copy.icon} size={40} color="#fff" />
          </View>
          <Text style={styles.statusTitle}>{copy.title}</Text>
          <Text style={styles.statusNumber}>{formatQueueLabel(myQueue.number)}</Text>
          <Text style={styles.statusNote}>{copy.note}</Text>

          {showReceipt && (
            <AnimatedPressable style={styles.receiptBtn} onPress={() => setReceiptVisible(true)}>
              <Ionicons name="receipt-outline" size={20} color={colors.primaryDeep} />
              <Text style={styles.receiptBtnText}>ดูใบเสร็จ</Text>
            </AnimatedPressable>
          )}
          {isDone && (
            <AnimatedPressable style={styles.newQueueBtn} onPress={clearQueue}>
              <Text style={styles.newQueueText}>สั่งใหม่</Text>
            </AnimatedPressable>
          )}
        </View>
      </ScrollView>

      <Modal visible={receiptVisible} animationType="fade">
        <View style={styles.receiptOverlay}>
          <ScrollView contentContainerStyle={styles.receiptScroll}>
            <Receipt
              queueNumber={myQueue.number}
              amount={myQueue.saleAmount}
              paidAt={doneTime}
              paymentMethod={myQueue.paymentMethod}
              lines={myQueue.items?.map((i) => ({ left: `${i.name} × ${i.qty}`, right: `฿${i.price * i.qty}` }))}
              onClose={() => setReceiptVisible(false)}
            />
          </ScrollView>
        </View>
      </Modal>

      <IncomingCallOverlay visible={callAlert} queueNumber={myQueue.number} onDismiss={dismissCallAlert} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 18, paddingTop: 52, paddingBottom: 118 },
  h2: { fontFamily: fonts.heading, fontSize: 26, color: colors.textDark, marginBottom: 16 },

  noTicketCard: { backgroundColor: colors.card, borderRadius: 28, padding: 22, paddingBottom: 26, alignItems: 'center' },
  servingLabelSmall: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textMuted },
  servingBig: { fontFamily: fonts.heading, fontSize: 76, lineHeight: 82, color: colors.primaryDeep, marginTop: 4 },

  quickBtn: {
    marginTop: 16,
    borderRadius: 28,
    paddingVertical: 34,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    gap: 12,
    shadowColor: colors.textDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 6,
  },
  quickBtnText: { fontFamily: fonts.heading, fontSize: 38, lineHeight: 42, color: '#fff' },
  quickBtnSub: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: '#fff', opacity: 0.95, marginTop: -4 },
  disabled: { opacity: 0.75 },

  reminderBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14,
    backgroundColor: colors.leafLight, borderRadius: 20, padding: 16,
  },
  reminderText: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 15, color: '#3D472B', lineHeight: 21 },
  reminderTextSm: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 13, color: '#3D472B', lineHeight: 19 },

  secondaryBtn: {
    marginTop: 12, borderRadius: 999, paddingVertical: 20,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center',
  },
  secondaryBtnText: { fontFamily: fonts.heading, fontSize: 19, color: colors.primaryDeep },

  preWarnBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.gold,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 14,
  },
  preWarnText: { flex: 1, fontFamily: fonts.bodyExtraBold, fontSize: 14, color: '#fff' },

  ticketCard: {
    backgroundColor: colors.charcoal, borderRadius: 28, padding: 22, overflow: 'hidden', position: 'relative',
  },
  ticketBlob: {
    position: 'absolute', left: -30, bottom: -40, width: 130, height: 130,
    borderRadius: 65, backgroundColor: colors.primaryDeep, opacity: 0.5,
  },
  ticketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketEyebrow: { fontFamily: fonts.bodyBold, fontSize: 11.5, letterSpacing: 1.4, textTransform: 'uppercase', color: '#C0B6A5' },
  ticketNumber: { fontFamily: fonts.heading, fontSize: 60, lineHeight: 64, color: colors.primaryGlow },
  ringMinutes: { fontFamily: fonts.heading, fontSize: 18, color: '#fff' },
  ringSub: { fontFamily: fonts.body, fontSize: 9, color: '#C0B6A5' },
  ticketDivider: { marginTop: 18, paddingTop: 16, borderTopWidth: 1.5, borderTopColor: 'rgba(255,255,255,0.22)', borderStyle: 'dashed' },
  ticketStatsRow: { flexDirection: 'row', gap: 22 },
  ticketStatLabel: { fontFamily: fonts.body, fontSize: 11, color: '#C0B6A5' },
  ticketStatValue: { fontFamily: fonts.heading, fontSize: 18, color: '#fff', marginTop: 2 },

  orderCard: { marginTop: 14, backgroundColor: colors.card, borderRadius: 20, padding: 16 },
  orderCardTitle: { fontFamily: fonts.bodyExtraBold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 10 },
  orderLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderLineLeft: { fontFamily: fonts.body, fontSize: 14, color: colors.textDark, flex: 1, marginRight: 8 },
  orderLineRight: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textDark },

  cancelBtn: { marginTop: 14, paddingVertical: 18, borderRadius: 999, alignItems: 'center' },
  cancelBtnText: { fontFamily: fonts.bodyExtraBold, fontSize: 16, color: colors.primaryDeep },

  statusCard: { backgroundColor: colors.card, borderRadius: 28, padding: 26, alignItems: 'center' },
  statusIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  statusTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.textDark },
  statusNumber: { fontFamily: fonts.heading, fontSize: 48, color: colors.primaryDeep, marginTop: 6 },
  statusNote: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textMuted, marginTop: 6 },
  receiptBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  receiptBtnText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.primaryDeep },
  newQueueBtn: { marginTop: 14, borderWidth: 1.5, borderColor: colors.primaryDeep, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  newQueueText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.primaryDeep },

  receiptOverlay: { flex: 1, backgroundColor: colors.leaf },
  receiptScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingTop: 60 },
});
