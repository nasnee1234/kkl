import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { serverTimestamp } from 'firebase/firestore';
import { useQueue } from '../contexts/QueueContext';
import { createQueueWithNumber } from '../utils/queueNumbers';
import { registerForPushNotifications } from '../utils/notifications';

const STATUS_COPY = {
  waiting: {
    title: 'จองคิวสำเร็จ!',
    note: 'เมื่อถึงคิวเราจะเรียกคุณ',
    icon: 'checkmark',
    iconBg: '#45ae4e',
  },
  calling: {
    title: 'ถึงคิวของคุณแล้ว!',
    note: 'กรุณามาที่เคาน์เตอร์ทันที',
    icon: 'megaphone-outline',
    iconBg: '#df4d41',
  },
  done: {
    title: 'เสร็จสิ้นแล้ว',
    note: 'ขอบคุณที่ใช้บริการ',
    icon: 'checkmark-done-outline',
    iconBg: '#45ae4e',
  },
  cancelled: {
    title: 'คิวถูกยกเลิก',
    note: 'คุณสามารถรับคิวใหม่ได้',
    icon: 'close-outline',
    iconBg: '#df4d41',
  },
};

function QueueHero({ scrollY }) {
  const navigation = useNavigation();
  const heroHeight = scrollY.interpolate({
    inputRange: [0, 170],
    outputRange: [276, 96],
    extrapolate: 'clamp',
  });
  const chickenSize = scrollY.interpolate({
    inputRange: [0, 170],
    outputRange: [88, 34],
    extrapolate: 'clamp',
  });
  const chickenLineHeight = scrollY.interpolate({
    inputRange: [0, 170],
    outputRange: [96, 40],
    extrapolate: 'clamp',
  });
  const titleSize = scrollY.interpolate({
    inputRange: [0, 170],
    outputRange: [22, 18],
    extrapolate: 'clamp',
  });
  const subtitleOpacity = scrollY.interpolate({
    inputRange: [0, 90, 150],
    outputRange: [1, 0.25, 0],
    extrapolate: 'clamp',
  });
  const heroContentShift = scrollY.interpolate({
    inputRange: [0, 170],
    outputRange: [0, -6],
    extrapolate: 'clamp',
  });

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('รายการ');
  };

  return (
    <Animated.View style={[styles.hero, { height: heroHeight }]}>
      <TouchableOpacity style={styles.backBtn} onPress={goBack}>
        <Ionicons name="arrow-back" size={30} color="#fff" />
      </TouchableOpacity>
      <Animated.Text style={[styles.sparkleOne, { opacity: subtitleOpacity }]}>◆</Animated.Text>
      <Animated.Text style={[styles.sparkleTwo, { opacity: subtitleOpacity }]}>◆</Animated.Text>
      <Animated.View style={{ alignItems: 'center', transform: [{ translateY: heroContentShift }] }}>
        <Animated.Text
          style={[
            styles.heroChicken,
            {
              fontSize: chickenSize,
              lineHeight: chickenLineHeight,
            },
          ]}
        >
          🍗
        </Animated.Text>
        <Animated.Text style={[styles.heroTitle, { fontSize: titleSize }]}>
          ระบบจองคิว / สั่งอาหาร
        </Animated.Text>
        <Animated.Text style={[styles.heroSubtitle, { opacity: subtitleOpacity }]}>
          ร้านไก่กอและ และร้านกะเมาะห์
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function QueueRequest() {
  const navigation = useNavigation();
  const { myQueue, takeQueue, clearQueue } = useQueue();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const handleConfirm = async () => {
    setPressed(true);
    setLoading(true);
    try {
      const pushToken = await registerForPushNotifications();
      const queue = await createQueueWithNumber({
        customerName: 'ลูกค้า',
        status: 'waiting',
        pushToken: pushToken || null,
        createdAt: serverTimestamp(),
      });

      takeQueue(queue.id, queue.number);
      setPressed(false);
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถรับคิวได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const goMenu = () => navigation.navigate('รายการ');

  if (myQueue) {
    const status = myQueue.status || 'waiting';
    const copy = STATUS_COPY[status] || STATUS_COPY.waiting;
    const isDone = status === 'done' || status === 'cancelled';
    const showReceipt = status === 'done' && myQueue.saleAmount != null && myQueue.saleAmount > 0;
    const doneTime = myQueue.doneAt?.toDate
      ? myQueue.doneAt.toDate().toLocaleString('th-TH', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleString('th-TH', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

    return (
      <View style={styles.container}>
        <QueueHero scrollY={scrollY} />
        <Animated.ScrollView
          contentContainerStyle={styles.content}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.card}>
            <View style={[styles.checkIcon, { backgroundColor: copy.iconBg }]}>
              <Ionicons name={copy.icon} size={42} color="#fff" />
            </View>
            <Text style={styles.successTitle}>{copy.title}</Text>
            <Text style={styles.successSub}>คุณได้คิวหมายเลข</Text>
            <View style={styles.numberCircleOuter}>
              <View style={styles.numberCircleInner}>
                <Text style={styles.numberText}>{myQueue.number}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.messageBtn} activeOpacity={0.9}>
              <Text style={styles.messageText}>{copy.note}</Text>
            </TouchableOpacity>

            {showReceipt && (
              <TouchableOpacity style={styles.receiptBtn} onPress={() => setReceiptVisible(true)}>
                <Ionicons name="receipt-outline" size={20} color="#df4d41" />
                <Text style={styles.receiptBtnText}>ดูใบเสร็จ</Text>
              </TouchableOpacity>
            )}

            {isDone && (
              <TouchableOpacity style={styles.newQueueBtn} onPress={clearQueue}>
                <Text style={styles.newQueueText}>รับคิวใหม่</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.homeTextBtn} onPress={goMenu}>
              <Text style={styles.homeText}>กลับไปรายการ</Text>
            </TouchableOpacity>
          </View>
        </Animated.ScrollView>

        <Modal visible={receiptVisible} transparent animationType="fade">
          <View style={styles.receiptOverlay}>
            <ScrollView contentContainerStyle={styles.receiptScroll}>
              <View style={styles.receiptBox}>
                <Ionicons name="storefront-outline" size={34} color="#df4d41" />
                <Text style={styles.receiptShop}>ร้านไก่กอและ</Text>
                <Text style={styles.receiptSub}>ใบเสร็จรับเงิน</Text>
                <View style={styles.divider} />
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>หมายเลขคิว</Text>
                  <Text style={styles.receiptVal}>#{myQueue.number}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>วันที่ / เวลา</Text>
                  <Text style={styles.receiptVal}>{doneTime}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptTotalKey}>ยอดรวม</Text>
                  <Text style={styles.receiptTotalVal}>
                    {Number(myQueue.saleAmount).toLocaleString('th-TH')} บาท
                  </Text>
                </View>
                <TouchableOpacity style={styles.receiptClose} onPress={() => setReceiptVisible(false)}>
                  <Text style={styles.receiptCloseText}>ปิด</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <QueueHero scrollY={scrollY} />
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.card}>
          <Text style={styles.promptTitle}>กดเพื่อจองคิว</Text>
          <Text style={styles.promptSub}>คลิกตรงนี้</Text>
          <TouchableOpacity
            style={[styles.queueCircleOuter, pressed && styles.queueCirclePressed]}
            onPress={() => setPressed(true)}
            activeOpacity={0.86}
            disabled={loading}
          >
            <View style={styles.queueCircleInner}>
              <Text style={styles.queueCircleText}>รับคิว</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmBtn, loading && styles.disabled]}
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmText}>ยืนยันคิวของคุณ</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeTextBtn} onPress={goMenu}>
            <Text style={styles.homeText}>กลับไปรายการ</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#efefef' },
  hero: {
    height: 276,
    backgroundColor: '#e55347',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  backBtn: { position: 'absolute', left: 18, top: 42, width: 44, height: 44, justifyContent: 'center' },
  sparkleOne: { position: 'absolute', left: 96, top: 86, color: '#f7beb8', fontSize: 14 },
  sparkleTwo: { position: 'absolute', right: 94, top: 136, color: '#f7beb8', fontSize: 14 },
  heroChicken: {
    fontSize: 88,
    lineHeight: 96,
    marginBottom: 10,
    textShadowColor: 'rgba(108, 36, 26, 0.28)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  heroTitle: { color: '#ffe66a', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  heroSubtitle: { color: '#ffe66a', fontSize: 21, fontWeight: '900', textAlign: 'center', marginTop: 2 },
  content: { padding: 16, paddingTop: 14, paddingBottom: 104 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    minHeight: 410,
    paddingHorizontal: 28,
    paddingVertical: 24,
    alignItems: 'center',
  },
  promptTitle: { color: '#111', fontSize: 25, fontWeight: '700', marginTop: 4 },
  promptSub: { color: '#8d8d8d', fontSize: 19, fontWeight: '600', marginTop: 3 },
  queueCircleOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#df4d41',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  queueCirclePressed: { backgroundColor: '#d9463c' },
  queueCircleInner: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#e9756c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueCircleText: { color: '#fff', fontSize: 38, fontWeight: '500' },
  confirmBtn: {
    height: 58,
    width: '100%',
    borderRadius: 7,
    marginTop: 12,
    backgroundColor: '#df4d41',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  disabled: { opacity: 0.7 },
  checkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: { color: '#111', fontSize: 25, fontWeight: '800' },
  successSub: { color: '#8d8d8d', fontSize: 19, fontWeight: '600', marginTop: 2 },
  numberCircleOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#df4d41',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  numberCircleInner: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#e9756c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { color: '#fff', fontSize: 72, fontWeight: '300', lineHeight: 82 },
  messageBtn: {
    height: 58,
    width: '100%',
    borderRadius: 7,
    marginTop: 12,
    backgroundColor: '#df4d41',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  receiptBtn: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  receiptBtnText: { color: '#df4d41', fontSize: 16, fontWeight: '700' },
  newQueueBtn: {
    borderWidth: 1,
    borderColor: '#df4d41',
    borderRadius: 7,
    paddingHorizontal: 24,
    paddingVertical: 11,
    marginTop: 8,
  },
  newQueueText: { color: '#df4d41', fontSize: 15, fontWeight: '700' },
  homeTextBtn: { marginTop: 18, padding: 6 },
  homeText: { color: '#7d7d7d', fontSize: 17, fontWeight: '500' },
  receiptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  receiptBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '100%',
    maxWidth: 360,
    padding: 28,
    alignItems: 'center',
  },
  receiptShop: { fontSize: 21, fontWeight: '800', color: '#df4d41', marginTop: 8 },
  receiptSub: { fontSize: 14, color: '#777', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#e5e5e5', alignSelf: 'stretch', marginVertical: 14 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', marginBottom: 8 },
  receiptKey: { fontSize: 14, color: '#777' },
  receiptVal: { fontSize: 14, color: '#111', fontWeight: '600' },
  receiptTotalKey: { fontSize: 16, fontWeight: '800', color: '#111' },
  receiptTotalVal: { fontSize: 18, fontWeight: '800', color: '#df4d41' },
  receiptClose: {
    alignSelf: 'stretch',
    backgroundColor: '#df4d41',
    borderRadius: 7,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  receiptCloseText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
