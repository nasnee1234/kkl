import { useCallback, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

// หัวข้อประจำหน้า — กล่องการ์ดมีเงานิดๆ พร้อมโมชั่นเบาๆ ตอนเปิดหน้า (เล่นซ้ำทุกครั้งที่สลับแท็บมา)
export default function ScreenHeader({ title, right, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0);
      translateY.setValue(-12);
      scale.setValue(0.98);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 340, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 8, tension: 55, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }),
      ]).start();
    }, [opacity, translateY, scale])
  );

  return (
    <Animated.View style={[styles.wrap, style, { opacity, transform: [{ translateY }, { scale }] }]}>
      <View style={styles.box}>
        <View style={styles.titleRow}>
          <View style={styles.accent} />
          <Text style={styles.title}>{title}</Text>
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.textDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    ...Platform.select({
      web: { boxShadow: '0 4px 14px rgba(32,30,29,0.08)' },
      default: {},
    }),
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 11, flexShrink: 1 },
  accent: { width: 4, height: 24, borderRadius: 2, backgroundColor: colors.primary },
  title: { fontFamily: fonts.heading, fontSize: 23, color: colors.textDark, flexShrink: 1 },
});
