import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// ห่อการ์ด/บล็อกใดก็ได้ให้ค่อยๆ จางเข้า + เลื่อนขึ้นเบาๆ ตอนเปิดหน้า
// ใส่ delay ไล่กันทีละบล็อกจะได้เอฟเฟกต์ไหลลงมาทีละชิ้น (stagger)
export default function FadeInView({ children, delay = 0, offset = 16, style }) {
  const progress = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      progress.setValue(0);
      const anim = Animated.timing(progress, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: true,
      });
      anim.start();
      return () => anim.stop();
    }, [progress, delay])
  );

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [offset, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
