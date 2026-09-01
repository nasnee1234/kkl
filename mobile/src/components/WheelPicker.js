import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { adminTheme, colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

const ITEM_HEIGHT = 42;
const VISIBLE_COUNT = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const PADDING_V = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

// ตัวเลื่อนเลือกค่าแบบวงล้อ (เหมือนตัวเลือกวัน/เวลาในฟอร์มทั่วไป) — ใช้ ScrollView ธรรมดา
// ทำงานเหมือนกันทั้งเว็บและมือถือ ไม่พึ่ง native picker ที่บนเว็บใช้ไม่ได้
export default function WheelPicker({ options, value, onChange, dark = false }) {
  const scrollRef = useRef(null);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));

  const scrollToIndex = (index, animated = true) => {
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated });
  };

  const handleSettle = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.max(0, Math.min(options.length - 1, Math.round(y / ITEM_HEIGHT)));
    if (options[index] && options[index].value !== value) {
      onChange(options[index].value);
    }
    scrollToIndex(index);
  };

  return (
    <View style={[styles.container, { height: CONTAINER_HEIGHT }]}>
      <View pointerEvents="none" style={[styles.highlight, dark && styles.highlightDark, { top: PADDING_V }]} />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: PADDING_V }}
        contentOffset={{ x: 0, y: selectedIndex * ITEM_HEIGHT }}
        onMomentumScrollEnd={handleSettle}
        onScrollEndDrag={handleSettle}
      >
        {options.map((opt, i) => {
          const active = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={styles.item}
              activeOpacity={0.7}
              onPress={() => {
                onChange(opt.value);
                scrollToIndex(i);
              }}
            >
              <Text
                style={[
                  styles.itemText,
                  dark && styles.itemTextDark,
                  active && (dark ? styles.itemTextActiveDark : styles.itemTextActive),
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  highlight: {
    position: 'absolute', left: 0, right: 0, height: ITEM_HEIGHT,
    backgroundColor: colors.creamSoft, borderRadius: 12,
  },
  highlightDark: { backgroundColor: adminTheme.surfaceAlt },
  item: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textMuted },
  itemTextActive: { fontFamily: fonts.bodyExtraBold, fontSize: 17, color: colors.primaryDeep },
  itemTextDark: { color: adminTheme.textMuted },
  itemTextActiveDark: { fontFamily: fonts.bodyExtraBold, fontSize: 17, color: adminTheme.text },
});
