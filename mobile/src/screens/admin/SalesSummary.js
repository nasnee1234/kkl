import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { colors, adminTheme } from '../../theme/colors';
import { useLayout } from '../../theme/layout';

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

// เดินเดือน/สัปดาห์/วันจะเทียบกับ "วันนี้" เสมอ ทำให้ตัวเลขรีเซ็ตเองอัตโนมัติทุกวัน/สัปดาห์/เดือนที่เปลี่ยนไป
// ส่วนปี (yearly) เลือกดูปีย้อนหลังได้ด้วย selectedYear — ข้อมูลไม่เคยถูกลบ แค่กรองต่างกันตามปีที่เลือก
function aggregateSales(sales, period, selectedYear) {
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
    filtered = sales.filter((s) => s.date.getFullYear() === selectedYear);
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
  if (!data.length) return <Text style={{ color: adminTheme.textMuted, textAlign: 'center', marginTop: 16 }}>ยังไม่มีข้อมูล</Text>;
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
  const { menuMaxWidth, gutter } = useLayout();
  const [activeTab, setActiveTab] = useState('daily');
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

  const { revenue, orders, chartData } = aggregateSales(sales, activeTab, selectedYear);
  const avgPerOrder = orders > 0 ? Math.round(revenue / orders) : 0;

  const currentYear = new Date().getFullYear();
  const yearsWithData = [...new Set(sales.map((s) => s.date.getFullYear()))];
  const earliestYear = yearsWithData.length ? Math.min(...yearsWithData, currentYear) : currentYear;
  const canGoOlder = selectedYear > earliestYear;
  const canGoNewer = selectedYear < currentYear;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={adminTheme.accent} /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { maxWidth: menuMaxWidth, paddingHorizontal: gutter }]}
    >
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

      {/* ตัวเลือกปี — โชว์เฉพาะแท็บ "ปี" เพื่อย้อนดูข้อมูลปีก่อนหน้าได้ (ข้อมูลเก่าไม่เคยถูกลบ) */}
      {activeTab === 'yearly' && (
        <View style={styles.yearPicker}>
          <TouchableOpacity
            style={[styles.yearArrow, !canGoOlder && styles.yearArrowDisabled]}
            onPress={() => canGoOlder && setSelectedYear((y) => y - 1)}
            disabled={!canGoOlder}
          >
            <Ionicons name="chevron-back" size={18} color={canGoOlder ? adminTheme.text : adminTheme.textMuted} />
          </TouchableOpacity>
          <Text style={styles.yearLabel}>ปี {selectedYear + 543}</Text>
          <TouchableOpacity
            style={[styles.yearArrow, !canGoNewer && styles.yearArrowDisabled]}
            onPress={() => canGoNewer && setSelectedYear((y) => y + 1)}
            disabled={!canGoNewer}
          >
            <Ionicons name="chevron-forward" size={18} color={canGoNewer ? adminTheme.text : adminTheme.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Summary Cards */}
      <View style={styles.cards}>
        <View style={[styles.card, { backgroundColor: adminTheme.accent }]}>
          <Ionicons name="cash-outline" size={24} color="#fff" />
          <Text style={styles.cardLabel}>ยอดขายรวม</Text>
          <Text style={styles.cardValue}>฿{revenue.toLocaleString()}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: adminTheme.cta }]}>
          <Ionicons name="receipt-outline" size={24} color={adminTheme.ctaText} />
          <Text style={[styles.cardLabel, { color: 'rgba(43,23,16,0.7)' }]}>ออเดอร์</Text>
          <Text style={[styles.cardValue, { color: adminTheme.ctaText }]}>{orders}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: adminTheme.surfaceAlt }]}>
          <Ionicons name="trending-up-outline" size={24} color={colors.goldLight} />
          <Text style={styles.cardLabel}>เฉลี่ย/ออเดอร์</Text>
          <Text style={styles.cardValue}>฿{avgPerOrder.toLocaleString()}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.primaryDeep }]}>
          <Ionicons name="people-outline" size={24} color={colors.goldLight} />
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
                <Ionicons name="receipt-outline" size={16} color={adminTheme.accent} />
              </View>
              <View style={styles.saleInfo}>
                <Text style={styles.saleName}>{s.customerName || 'ลูกค้า'}</Text>
                <Text style={styles.saleTime}>
                  {s.queueNumber ? `คิว #${s.queueNumber}` : 'ออเดอร์สั่งล่วงหน้า'} · {s.date.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
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
  container: { flex: 1, backgroundColor: adminTheme.bg },
  content: { paddingVertical: 16, paddingBottom: 32, width: '100%', alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: adminTheme.bg },
  realtimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: adminTheme.cta },
  realtimeText: { fontSize: 12, color: adminTheme.cta, fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: adminTheme.surface, borderRadius: 14, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: adminTheme.accent },
  tabText: { fontSize: 13, fontWeight: '600', color: adminTheme.textMuted },
  tabTextActive: { color: '#fff' },
  yearPicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18,
    marginBottom: 16, backgroundColor: adminTheme.surface, borderRadius: 14, paddingVertical: 10,
  },
  yearArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: adminTheme.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  yearArrowDisabled: { opacity: 0.4 },
  yearLabel: { fontSize: 15, fontWeight: '800', color: adminTheme.text, minWidth: 90, textAlign: 'center' },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  // ยืดเองตามที่ว่าง — จอแคบได้ 2 ใบต่อแถว จอกว้างเรียงได้ 4 ใบ โดยไม่ต้องคำนวณจากความกว้างจอ
  card: { flexGrow: 1, flexBasis: 150, minWidth: 150, borderRadius: 16, padding: 16, gap: 6 },
  cardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  section: { backgroundColor: adminTheme.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: adminTheme.border },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: adminTheme.accent, marginBottom: 14 },
  empty: { color: adminTheme.textMuted, textAlign: 'center', paddingVertical: 12 },
  saleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: adminTheme.surfaceAlt, gap: 12 },
  saleIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: adminTheme.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  saleInfo: { flex: 1 },
  saleName: { fontSize: 14, fontWeight: '600', color: adminTheme.text },
  saleTime: { fontSize: 12, color: adminTheme.textMuted, marginTop: 2 },
  saleAmount: { fontSize: 15, fontWeight: '700', color: adminTheme.accent },
});

const chartStyles = StyleSheet.create({
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingBottom: 4, minWidth: '100%' },
  barCol: { alignItems: 'center', minWidth: 36 },
  bar: { width: 28, backgroundColor: adminTheme.accent, borderRadius: 6, marginBottom: 6 },
  barValue: { fontSize: 10, color: adminTheme.textMuted, marginBottom: 4 },
  barLabel: { fontSize: 10, color: adminTheme.textMuted, textAlign: 'center' },
});
