import { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

// สำคัญ: ต้องให้ style ไปอยู่บนตัว Pressable เอง(ไม่ใช่ View ซ้อนข้างใน)
// ไม่งั้นค่าอย่าง width:'100%' / flex:1 จะอ้างอิงกล่องที่หดตามเนื้อหา ทำให้ปุ่มบี้เป็นวงกลม
const PressableAnimated = Animated.createAnimatedComponent(Pressable);

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
    <PressableAnimated
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      style={[
        style,
        disabled && styles.disabled,
        { transform: [{ scale }], opacity: lift.interpolate({ inputRange: [0.4, 1], outputRange: [0.92, 1] }) },
      ]}
      {...rest}
    >
      {children}
    </PressableAnimated>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.6 },
});
