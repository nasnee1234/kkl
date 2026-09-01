import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

const WEEKDAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function parseDateStr(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ปฏิทินตารางสีขาวแบบเว็บจองทั่วไป (Booking.com/Airbnb) — เลือกได้เฉพาะช่วง minDate–maxDate
export default function DateCalendarPicker({ value, onChange, minDate, maxDate }) {
  const selected = parseDateStr(value);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const min = parseDateStr(minDate);
  const max = parseDateStr(maxDate);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const firstOfViewMonth = new Date(viewYear, viewMonth, 1);
  const firstOfMinMonth = new Date(min.getFullYear(), min.getMonth(), 1);
  const firstOfMaxMonth = new Date(max.getFullYear(), max.getMonth(), 1);
  const canGoPrev = firstOfViewMonth > firstOfMinMonth;
  const canGoNext = firstOfViewMonth < firstOfMaxMonth;

  const goPrev = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const goNext = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const dateStrFor = (day) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const isSelectable = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    return d >= min && d <= max;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goPrev} disabled={!canGoPrev} style={styles.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={canGoPrev ? colors.textDark : colors.border} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{MONTHS_TH[viewMonth]} {viewYear + 543}</Text>
        <TouchableOpacity onPress={goNext} disabled={!canGoNext} style={styles.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={18} color={canGoNext ? colors.textDark : colors.border} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS_TH.map((w) => (
          <Text key={w} style={styles.weekLabel}>{w}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day == null) return <View key={`empty-${i}`} style={styles.cell} />;
          const ds = dateStrFor(day);
          const selectable = isSelectable(day);
          const isSelected = ds === value;
          return (
            <TouchableOpacity
              key={ds}
              style={styles.cell}
              disabled={!selectable}
              onPress={() => onChange(ds)}
              activeOpacity={0.7}
            >
              <View style={[styles.dayCircle, isSelected && styles.dayCircleActive]}>
                <Text style={[styles.dayText, !selectable && styles.dayTextDisabled, isSelected && styles.dayTextActive]}>
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  navBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.creamSoft },
  headerText: { fontFamily: fonts.bodyExtraBold, fontSize: 14.5, color: colors.textDark },
  weekRow: { flexDirection: 'row' },
  weekLabel: { flex: 1, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.textMuted, marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dayCircleActive: { backgroundColor: colors.primary },
  dayText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textDark },
  dayTextDisabled: { color: colors.border },
  dayTextActive: { color: '#fff', fontFamily: fonts.bodyExtraBold },
});
