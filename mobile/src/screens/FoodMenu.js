import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getMenuImageUrl } from '../utils/imageUrls';
import { getLocalMenuImage } from '../assets/menuImages';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

function FoodThumb({ item }) {
  const localImage = getLocalMenuImage(item?.imageKey);
  const remoteUri = getMenuImageUrl(item);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [localImage, remoteUri]);

  if (localImage) {
    return <Image source={localImage} style={styles.foodImage} resizeMode="cover" />;
  }

  if (remoteUri && !imageFailed) {
    return (
      <Image
        source={{ uri: remoteUri }}
        style={styles.foodImage}
        resizeMode="cover"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <View style={styles.artBox}>
      <Text style={styles.artLabel}>รูป</Text>
    </View>
  );
}

export default function FoodMenu() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'menus'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMenus(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error('FoodMenu:', error.message);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const filtered = menus.filter((item) => {
    const q = search.trim().toLowerCase();
    return !q || item.name?.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.heading}>เมนูทั้งร้าน</Text>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color={colors.textDark} />
              <TextInput
                style={styles.searchInput}
                placeholder="ค้นหาเมนู เช่น ไก่, ชา, ชุด"
                value={search}
                onChangeText={setSearch}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {menus.length === 0 ? 'ยังไม่มีเมนู' : 'ไม่เจอเมนูนี้จ๊ะ ลองคำอื่นดู'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <FoodThumb item={item} />
            <View style={styles.foodInfo}>
              <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.price}>฿{item.price}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  heading: { fontFamily: fonts.heading, fontSize: 26, color: colors.textDark, marginTop: 52, marginBottom: 14, paddingHorizontal: 18 },
  searchBox: {
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginHorizontal: 18,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, color: colors.textDark, fontSize: 14 },
  list: { paddingHorizontal: 18, paddingBottom: 30 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 12,
    marginTop: 16,
    shadowColor: colors.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  foodImage: { width: 78, height: 78, borderRadius: 16, backgroundColor: colors.creamSoft },
  artBox: {
    width: 78, height: 78, borderRadius: 16, backgroundColor: colors.creamSoft,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  artLabel: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 10 },
  foodInfo: { flex: 1, minWidth: 0 },
  foodName: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textDark, flexShrink: 1 },
  price: { fontFamily: fonts.heading, fontSize: 17, color: colors.primaryDeep, marginTop: 9 },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 14, marginTop: 36, paddingHorizontal: 20 },
});
