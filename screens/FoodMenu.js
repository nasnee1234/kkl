import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

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
        <ActivityIndicator size="large" color="#b45309" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>เมนูอาหาร</Text>
        <Text style={styles.subtitle}>เลือกชมเมนูไก่กอและสุดอร่อย</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาเมนู..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9ca3af"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {menus.length === 0 ? 'ยังไม่มีเมนู' : 'ไม่พบเมนูที่ค้นหา'}
          </Text>
        }
        renderItem={({ item }) => {
          const outOfStock = item.stock === 0;
          return (
            <View style={[styles.card, outOfStock && styles.cardDim]}>
              <Text style={styles.emoji}>{item.emoji || '🍽️'}</Text>
              {outOfStock && (
                <View style={styles.outBadge}>
                  <Text style={styles.outBadgeText}>สินค้าหมด</Text>
                </View>
              )}
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.cardPrice}>฿{item.price}</Text>
                {!outOfStock && (
                  <Text style={styles.cardStock}>เหลือ {item.stock}</Text>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 20, marginVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12, height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1f2937' },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  card: {
    width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center',
  },
  cardDim: { opacity: 0.55 },
  emoji: { fontSize: 40, marginBottom: 8 },
  outBadge: {
    backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 8,
    paddingVertical: 3, marginBottom: 6,
  },
  outBadgeText: { fontSize: 11, color: '#ef4444', fontWeight: '700' },
  cardName: { fontSize: 15, fontWeight: '600', color: '#1f2937', textAlign: 'center' },
  cardDesc: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 4 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 8 },
  cardPrice: { fontSize: 15, fontWeight: 'bold', color: '#b45309' },
  cardStock: { fontSize: 11, color: '#9ca3af' },
  empty: { textAlign: 'center', color: '#9ca3af', fontSize: 16, marginTop: 60 },
});
