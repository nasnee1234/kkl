import { useEffect, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useQueue } from '../contexts/QueueContext';
import { formatQueueLabel } from '../utils/queueNumbers';
import { getMenuImageUrl } from '../utils/imageUrls';
import { getLocalMenuImage } from '../assets/menuImages';
import PatternBackground from '../components/PatternBackground';
import FadeInView from '../components/FadeInView';
import { colors, shadows } from '../theme/colors';
import { fonts } from '../theme/fonts';

const SHOP_MAPS_URL = 'https://maps.app.goo.gl/wEDXyVi2cpxwD5Kc6';

function BestSellerImage({ item }) {
  const localImage = getLocalMenuImage(item?.imageKey);
  const remoteUri = getMenuImageUrl(item);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [localImage, remoteUri]);

  if (localImage) {
    return <Image source={localImage} style={styles.bestImage} resizeMode="cover" />;
  }

  if (remoteUri && !imageFailed) {
    return (
      <Image
        source={{ uri: remoteUri }}
        style={styles.bestImage}
        resizeMode="cover"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <View style={styles.bestImagePlaceholder}>
      <Text style={styles.bestImageLabel}>รูปอาหาร</Text>
    </View>
  );
}

export default function Home() {
  const navigation = useNavigation();
  const { myQueue, callingNumber, acceptingQueue, queueProgress } = useQueue();
  const [menus, setMenus] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'menus'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMenus(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const badged = menus.filter((m) => m.badge);
  const bestSellers = (badged.length > 0 ? badged : menus).slice(0, 4);

  return (
    <PatternBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FadeInView delay={0}>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>ร้านไก่กอและกะเมาะห์</Text>
              <Text style={styles.title}>หิวยังจ๊ะ วันนี้กินอะไร</Text>
            </View>
          </View>
        </FadeInView>

        {/* Hero: กำลังเรียกคิว */}
        <FadeInView delay={70}>
        <View style={styles.hero}>
          <View style={styles.heroBlob} />
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroEyebrow}>กำลังเรียกคิว</Text>
              <Text style={styles.heroNumber}>{formatQueueLabel(callingNumber)}</Text>
            </View>
            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>เปิดถึง 17:00</Text>
            </View>
          </View>

          {myQueue && myQueue.status === 'waiting' && (
            <TouchableOpacity
              style={styles.ticketRow}
              onPress={() => navigation.navigate('คิวของฉัน')}
              activeOpacity={0.85}
            >
              <View style={styles.ticketTop}>
                <Text style={styles.ticketText}>คิวของคุณ {formatQueueLabel(myQueue.number)}</Text>
                <Text style={styles.ticketText}>{queueProgress.etaLabel}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${queueProgress.pct}%` }]} />
              </View>
            </TouchableOpacity>
          )}
        </View>
        </FadeInView>

        {/* ค้นหา */}
        <FadeInView delay={140}>
          <TouchableOpacity
            style={styles.searchBox}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('เมนู')}
          >
            <Ionicons name="search-outline" size={18} color={colors.textDark} />
            <Text style={styles.searchPlaceholder}>อยากกินไก่กอและไม้ไหน ค้นเลย</Text>
          </TouchableOpacity>
        </FadeInView>

        {/* ขายดีประจำร้าน */}
        <FadeInView delay={210}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ขายดีประจำร้าน</Text>
            <TouchableOpacity onPress={() => navigation.navigate('เมนู')}>
              <Text style={styles.sectionLink}>ดูทั้งหมด</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bestSellerScroll}>
            {bestSellers.length === 0 ? (
              <Text style={styles.emptyText}>ยังไม่มีเมนู</Text>
            ) : (
              bestSellers.map((item) => (
                <View key={item.id} style={styles.bestCard}>
                  <BestSellerImage item={item} />
                  <Text style={styles.bestName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.bestPrice}>฿{item.price}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </FadeInView>

        {/* ข้อมูลร้าน */}
        <FadeInView delay={280}>
        <TouchableOpacity
          style={styles.shopInfoCard}
          activeOpacity={0.85}
          onPress={() => Linking.openURL(SHOP_MAPS_URL)}
        >
          <View style={styles.shopInfoImage}>
            <Text style={styles.shopInfoImageLabel}>แผนที่{'\n'}ร้าน</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.shopInfoName}>กะเมาะห์ ไก่กอและ</Text>
            <Text style={styles.shopInfoDetail}>ตลาดเย็นถนนสายกลาง · เดินจากป้ายรถ 2 นาที</Text>
            <View style={styles.shopInfoRow}>
              <View style={styles.shopInfoItem}>
                <Ionicons name="time-outline" size={13} color={colors.primaryDeep} />
                <Text style={styles.shopInfoTime}>9:00–17:00</Text>
              </View>
              <View style={styles.shopInfoItem}>
                <Ionicons name="location-outline" size={13} color={colors.primaryDeep} />
                <Text style={styles.shopInfoTime}>ดูเส้นทาง</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        </FadeInView>
      </ScrollView>
    </PatternBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 18, paddingTop: 52, paddingBottom: 118 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.primaryDeep },
  title: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 30, color: colors.textDark, marginTop: 4 },

  hero: {
    borderRadius: 28,
    backgroundColor: colors.primary,
    padding: 24,
    overflow: 'hidden',
    ...shadows.lg,
  },
  heroBlob: {
    position: 'absolute', right: -38, top: -38, width: 132, height: 132,
    borderRadius: 66, backgroundColor: colors.primaryGlow, opacity: 0.5,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  heroEyebrow: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' },
  heroNumber: { fontFamily: fonts.heading, fontSize: 52, lineHeight: 56, color: colors.cream },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.primaryDeep, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  heroBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.leafLight },
  heroBadgeText: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#fff' },

  ticketRow: { marginTop: 18, backgroundColor: colors.primaryDeep, borderRadius: 18, padding: 16 },
  ticketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  ticketText: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#fff' },
  progressTrack: { marginTop: 12, height: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.28)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.leafLight },

  searchBox: {
    height: 54,
    borderRadius: 999,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 11,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  searchPlaceholder: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 30, marginBottom: 14 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.textDark },
  sectionLink: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primaryDeep },
  bestSellerScroll: { marginTop: -4, overflow: 'visible' },
  emptyText: { color: colors.textMuted, fontSize: 13, paddingVertical: 20 },
  bestCard: {
    width: 162,
    marginRight: 14,
    marginBottom: 6,
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  bestImage: { width: '100%', height: 104, borderRadius: 14, backgroundColor: colors.creamSoft },
  bestImagePlaceholder: {
    height: 104,
    borderRadius: 14,
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestImageLabel: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  bestName: { fontFamily: fonts.bodyBold, fontSize: 14, marginTop: 12, lineHeight: 19, color: colors.textDark },
  bestPrice: { fontFamily: fonts.heading, fontSize: 17, color: colors.primaryDeep, marginTop: 10 },
  shopInfoCard: {
    marginTop: 26,
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 18,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  shopInfoImage: {
    width: 76, height: 76, flexShrink: 0, borderRadius: 18,
    backgroundColor: colors.creamSoft, alignItems: 'center', justifyContent: 'center',
  },
  shopInfoImageLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  shopInfoName: { fontFamily: fonts.heading, fontSize: 17, color: colors.textDark },
  shopInfoDetail: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginTop: 5, lineHeight: 19 },
  shopInfoRow: { flexDirection: 'row', gap: 16, marginTop: 11 },
  shopInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  shopInfoTime: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primaryDeep },
});
