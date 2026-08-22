import { useEffect, useRef } from 'react';
import { useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

// แถบข้อความสั้นกลางล่างจอ auto-hide — เรียกผ่าน useToast() แล้ววาง <Toast/> ไว้ท้ายหน้าจอ
export function useToast() {
  const [message, setMessage] = useState(null);
  const timerRef = useRef(null);

  const show = (text) => {
    clearTimeout(timerRef.current);
    setMessage(text);
    timerRef.current = setTimeout(() => setMessage(null), 2600);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return [message, show];
}

export default function Toast({ message }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    if (!message) return;
    opacity.setValue(0);
    translateY.setValue(14);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [message, opacity, translateY]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 104,
    zIndex: 90,
    backgroundColor: colors.charcoal,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  text: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: '#fff', textAlign: 'center' },
});
