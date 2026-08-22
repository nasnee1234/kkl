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
import { colors } from '../theme/colors';
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>ร้านไก่กอและกะเมาะห์</Text>
            <Text style={styles.title}>หิวยังจ๊ะ วันนี้กินอะไร</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('ฉัน')}>
            <Text style={styles.avatarText}>น</Text>
          </TouchableOpacity>
        </View>

        {/* Hero: กำลังเรียกคิว */}
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

        {/* ค้นหา */}
        <TouchableOpacity
          style={styles.searchBox}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('เมนู')}
        >
          <Ionicons name="search-outline" size={18} color={colors.textDark} />
          <Text style={styles.searchPlaceholder}>อยากกินไก่กอและไม้ไหน ค้นเลย</Text>
        </TouchableOpacity>

        {/* ขายดีประจำร้าน */}
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

        {/* ข้อมูลร้าน */}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 18, paddingTop: 52, paddingBottom: 118 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.primaryDeep },
  title: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 30, color: colors.textDark, marginTop: 4 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, flex: undefined,
    backgroundColor: colors.leafLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.heading, fontSize: 18, color: '#3D472B' },

  hero: {
    borderRadius: 28,
    backgroundColor: colors.primary,
    padding: 20,
    overflow: 'hidden',
    shadowColor: colors.textDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  heroBlob: {
    position: 'absolute', right: -38, top: -38, width: 132, height: 132,
    borderRadius: 66, backgroundColor: colors.primaryGlow, opacity: 0.5,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  heroEyebrow: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' },
  heroNumber: { fontFamily: fonts.heading, fontSize: 52, lineHeight: 56, color: colors.cream },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryDeep, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  heroBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.leafLight },
  heroBadgeText: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#fff' },

  ticketRow: { marginTop: 16, backgroundColor: colors.primaryDeep, borderRadius: 16, padding: 14 },
  ticketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketText: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#fff' },
  progressTrack: { marginTop: 10, height: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.25)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.leafLight },

  searchBox: {
    height: 50,
    borderRadius: 999,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 10,
    marginTop: 18,
  },
  searchPlaceholder: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 26, marginBottom: 12 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.textDark },
  sectionLink: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primaryDeep },
  bestSellerScroll: { marginTop: -6 },
  emptyText: { color: colors.textMuted, fontSize: 13, paddingVertical: 20 },
  bestCard: {
    width: 158,
    marginRight: 14,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 10,
    shadowColor: colors.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
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
  bestName: { fontFamily: fonts.bodyBold, fontSize: 14, marginTop: 10, lineHeight: 18, color: colors.textDark },
  bestPrice: { fontFamily: fonts.heading, fontSize: 16, color: colors.primaryDeep, marginTop: 8 },
  shopInfoCard: {
    marginTop: 24,
    backgroundColor: colors.creamSoft,
    borderRadius: 28,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  shopInfoImage: {
    width: 76, height: 76, flexShrink: 0, borderRadius: 16,
    backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  shopInfoImageLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  shopInfoName: { fontFamily: fonts.heading, fontSize: 17, color: colors.textDark },
  shopInfoDetail: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginTop: 3, lineHeight: 18 },
  shopInfoRow: { flexDirection: 'row', gap: 14, marginTop: 8 },
  shopInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  shopInfoTime: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primaryDeep },
});
