import { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

// ปุ่มที่ "มีมิติ" — ตอนกดจะยุบตัวลงเล็กน้อย (scale) และเงาลดลง แล้วเด้งกลับตอนปล่อย
// ใช้แทน TouchableOpacity ในปุ่มหลักทุกจุด แทนปุ่มแบนนิ่งที่กดแล้วไม่รู้สึกอะไร
export default function AnimatedPressable({ children, style, onPress, disabled, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 6 }),
      Animated.timing(lift, { toValue: 0.4, duration: 90, useNativeDriver: true }),
    ]).start();
  };

  const pressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 10 }),
      Animated.timing(lift, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      {...rest}
    >
      <Animated.View
        style={[
          style,
          disabled && styles.disabled,
          { transform: [{ scale }], opacity: lift.interpolate({ inputRange: [0.4, 1], outputRange: [0.92, 1] }) },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.6 },
});
