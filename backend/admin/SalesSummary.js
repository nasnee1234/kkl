import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

const { width } = Dimensions.get('window');

const TABS = [
  { key: 'daily',   label: 'วัน' },
  { key: 'weekly',  label: 'สัปดาห์' },
  { key: 'monthly', label: 'เดือน' },
  { key: 'yearly',  label: 'ปี' },
];

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function aggregateSales(sales, period) {
  const now = new Date();
  let filtered = [];
  let chartMap = {};

  if (period === 'daily') {
    filtered = sales.filter((s) => isSameDay(s.date, now));
    filtered.forEach((s) => {
      const h = `${String(s.date.getHours()).padStart(2, '0')}:00`;
      chartMap[h] = (chartMap[h] || 0) + s.amount;
    });
  } else if (period === 'weekly') {
    const weekStart = startOfWeek(now);
    filtered = sales.filter((s) => s.date >= weekStart);
    const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    filtered.forEach((s) => {
      const label = days[s.date.getDay()];
      chartMap[label] = (chartMap[label] || 0) + s.amount;
    });
  } else if (period === 'monthly') {
    filtered = sales.filter(
      (s) => s.date.getFullYear() === now.getFullYear() && s.date.getMonth() === now.getMonth()
    );
    filtered.forEach((s) => {
      const week = `ส.${Math.ceil(s.date.getDate() / 7)}`;
      chartMap[week] = (chartMap[week] || 0) + s.amount;
    });
  } else if (period === 'yearly') {
    filtered = sales.filter((s) => s.date.getFullYear() === now.getFullYear());
    const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    filtered.forEach((s) => {
      const label = months[s.date.getMonth()];
      chartMap[label] = (chartMap[label] || 0) + s.amount;
    });
  }

  const revenue = filtered.reduce((sum, s) => sum + s.amount, 0);
  const orders = filtered.length;
  const chartData = Object.entries(chartMap).map(([label, value]) => ({ label, value }));

  return { revenue, orders, chartData };
}

function BarChart({ data }) {
  if (!data.length) return <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 16 }}>ยังไม่มีข้อมูล</Text>;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 120;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={chartStyles.bars}>
        {data.map((item, i) => {
          const barH = Math.max(8, (item.value / maxValue) * chartHeight);
          return (
            <View key={i} style={chartStyles.barCol}>
              <Text style={chartStyles.barValue}>
                {item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value}
              </Text>
              <View style={[chartStyles.bar, { height: barH }]} />
              <Text style={chartStyles.barLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function SalesSummary() {
  const [activeTab, setActiveTab] = useState('daily');
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'sales'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          amount: raw.amount || 0,
          customerName: raw.customerName || '',
          queueNumber: raw.queueNumber || 0,
          date: raw.createdAt?.toDate ? raw.createdAt.toDate() : new Date(),
        };
      });
      setSales(data);
      setLoading(false);
    },
    (error) => {
      console.error('SalesSummary:', error.message);
      setLoading(false);
    });
    return unsub;
  }, []);

  const { revenue, orders, chartData } = aggregateSales(sales, activeTab);
  const avgPerOrder = orders > 0 ? Math.round(revenue / orders) : 0;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1d4ed8" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Realtime badge */}
      <View style={styles.realtimeBadge}>
        <View style={styles.dot} />
        <Text style={styles.realtimeText}>อัปเดต Realtime</Text>
      </View>

      {/* Period Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards */}
      <View style={styles.cards}>
        <View style={[styles.card, { backgroundColor: '#1d4ed8' }]}>
          <Ionicons name="cash-outline" size={24} color="#bfdbfe" />
          <Text style={styles.cardLabel}>ยอดขายรวม</Text>
          <Text style={styles.cardValue}>฿{revenue.toLocaleString()}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#059669' }]}>
          <Ionicons name="receipt-outline" size={24} color="#a7f3d0" />
          <Text style={styles.cardLabel}>ออเดอร์</Text>
          <Text style={styles.cardValue}>{orders}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#7c3aed' }]}>
          <Ionicons name="trending-up-outline" size={24} color="#ddd6fe" />
          <Text style={styles.cardLabel}>เฉลี่ย/ออเดอร์</Text>
          <Text style={styles.cardValue}>฿{avgPerOrder.toLocaleString()}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#b45309' }]}>
          <Ionicons name="people-outline" size={24} color="#fde68a" />
          <Text style={styles.cardLabel}>ลูกค้าทั้งหมด</Text>
          <Text style={styles.cardValue}>{sales.length}</Text>
        </View>
      </View>

      {/* Bar Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>กราฟยอดขาย</Text>
        <BarChart data={chartData} />
      </View>

      {/* Recent Sales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>รายการล่าสุด</Text>
        {sales.length === 0 ? (
          <Text style={styles.empty}>ยังไม่มียอดขาย</Text>
        ) : (
          [...sales].reverse().slice(0, 10).map((s) => (
            <View key={s.id} style={styles.saleRow}>
              <View style={styles.saleIcon}>
                <Ionicons name="receipt-outline" size={16} color="#1d4ed8" />
              </View>
              <View style={styles.saleInfo}>
                <Text style={styles.saleName}>{s.customerName || 'ลูกค้า'}</Text>
                <Text style={styles.saleTime}>
                  คิว #{s.queueNumber} · {s.date.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </Text>
              </View>
              <Text style={styles.saleAmount}>฿{s.amount.toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  realtimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  realtimeText: { fontSize: 12, color: '#22c55e', fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: '#e0e7ff', borderRadius: 14, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#1d4ed8' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  card: { width: (width - 42) / 2, borderRadius: 16, padding: 16, gap: 6 },
  cardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e0e7ff' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e3a8a', marginBottom: 14 },
  empty: { color: '#9ca3af', textAlign: 'center', paddingVertical: 12 },
  saleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 12 },
  saleIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  saleInfo: { flex: 1 },
  saleName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  saleTime: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  saleAmount: { fontSize: 15, fontWeight: '700', color: '#1d4ed8' },
});

const chartStyles = StyleSheet.create({
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingBottom: 4, minWidth: '100%' },
  barCol: { alignItems: 'center', minWidth: 36 },
  bar: { width: 28, backgroundColor: '#1d4ed8', borderRadius: 6, marginBottom: 6 },
  barValue: { fontSize: 10, color: '#6b7280', marginBottom: 4 },
  barLabel: { fontSize: 10, color: '#9ca3af', textAlign: 'center' },
});
