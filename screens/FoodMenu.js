import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { getMenuImageUrl } from '../utils/imageUrls';

function FoodArt() {
  const skewers = [8, 24, 40, 56];

  return (
    <View style={styles.artBox}>
      {skewers.map((top, index) => (
        <View key={top} style={[styles.skewer, { top, transform: [{ rotate: index % 2 ? '-8deg' : '7deg' }] }]}>
          <View style={styles.stick} />
          {[0, 1, 2, 3].map((piece) => (
            <View key={piece} style={[styles.meat, { left: 16 + piece * 18 }]} />
          ))}
        </View>
      ))}
      <View style={[styles.sauceDot, { left: 22, top: 14 }]} />
      <View style={[styles.sauceDot, { left: 72, top: 62 }]} />
      <View style={[styles.sauceDot, { left: 92, top: 28 }]} />
    </View>
  );
}

function FoodThumb({ item }) {
  const uri = getMenuImageUrl(item);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [uri]);

  if (uri && !imageFailed) {
    return (
      <Image
        source={{ uri }}
        style={styles.foodImage}
        resizeMode="cover"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <FoodArt />;
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

  const filtered = menus.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#df4d41" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroChicken}>🍗</Text>
        <Text style={styles.heroTitle}>เมนูอาหาร</Text>
      </View>

      <View style={styles.shopHeader}>
        <Text style={styles.shopName}>ร้านไก่กอและ</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={19} color="#c8c8c8" />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาเมนูอาหาร"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9c9c9c"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#b8b8b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {menus.length === 0 ? 'ยังไม่มีเมนู' : 'ไม่พบเมนูที่ค้นหา'}
          </Text>
        }
        renderItem={({ item }) => {
          const outOfStock = item.stock === 0;

          return (
            <View style={[styles.row, outOfStock && styles.rowDisabled]}>
              <FoodThumb item={item} />
              <View style={styles.foodInfo}>
                <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
                {outOfStock ? (
                  <Text style={styles.outText}>สินค้าหมด</Text>
                ) : (
                  <Text style={styles.foodDesc} numberOfLines={1}>{item.description || 'ไก่กอและสูตรเข้มข้น'}</Text>
                )}
              </View>
              <View style={styles.priceCol}>
                <Text style={styles.currency}>฿</Text>
                <Text style={styles.price}>{item.price}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f1f1' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f1f1' },
  hero: {
    height: 108,
    backgroundColor: '#e55347',
    paddingTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  heroChicken: {
    fontSize: 50,
    lineHeight: 58,
    ...(Platform.OS === 'web' ? {} : {
      textShadowColor: 'rgba(95, 31, 24, 0.24)',
      textShadowOffset: { width: 0, height: 3 },
      textShadowRadius: 6,
    }),
  },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '900' },
  shopHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
  },
  shopName: { color: '#111', fontSize: 21, fontWeight: '600', marginBottom: 8 },
  searchBox: {
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d6d6d6',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
  },
  searchInput: { flex: 1, color: '#333', fontSize: 14 },
  list: { backgroundColor: '#fff', paddingBottom: 126 },
  row: {
    minHeight: 104,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowDisabled: { opacity: 0.52 },
  foodImage: { width: 106, height: 80, borderRadius: 6, backgroundColor: '#e5e5e5' },
  artBox: {
    width: 106,
    height: 80,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#30963a',
  },
  skewer: { position: 'absolute', left: 6, width: 98, height: 16 },
  stick: { position: 'absolute', top: 7, left: 0, right: 4, height: 2, backgroundColor: '#6d3c18' },
  meat: {
    position: 'absolute',
    top: 1,
    width: 18,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#d84c25',
    borderWidth: 1,
    borderColor: '#a82e19',
  },
  sauceDot: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: '#ffb13b' },
  foodInfo: { flex: 1, marginLeft: 16, alignSelf: 'stretch', justifyContent: 'flex-start', paddingTop: 4 },
  foodName: { color: '#444', fontSize: 18, fontWeight: '500' },
  foodDesc: { color: '#9a9a9a', fontSize: 13, marginTop: 6 },
  outText: { color: '#df4d41', fontSize: 13, marginTop: 6, fontWeight: '700' },
  priceCol: { width: 78, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 22 },
  currency: { color: '#ff8a00', fontSize: 18, fontWeight: '700' },
  price: { color: '#111', fontSize: 24, fontWeight: '800' },
  empty: { textAlign: 'center', color: '#9a9a9a', fontSize: 16, marginTop: 60 },
});
