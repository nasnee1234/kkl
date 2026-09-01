import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Pattern, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

// ลายพื้นหลังอ่อนๆ โทนเดียวกับธีม — จุดกลม + เส้นทแยงบางๆ ซ้อนกัน
// วางไว้ใต้เนื้อหาทุกหน้า (pointerEvents none) ให้พื้นหลังไม่โล่งจนเกินไป แต่ไม่แย่งความสนใจจากการ์ด
export default function PatternBackground({ children, style }) {
  return (
    <View style={[styles.root, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="kklDots" width="26" height="26" patternUnits="userSpaceOnUse">
              <Circle cx="4" cy="4" r="1.7" fill={colors.primaryDeep} opacity={0.13} />
              <Circle cx="17" cy="17" r="1.1" fill={colors.leaf} opacity={0.13} />
            </Pattern>
            <Pattern id="kklLines" width="56" height="56" patternUnits="userSpaceOnUse">
              <Line x1="0" y1="56" x2="56" y2="0" stroke={colors.primaryDeep} strokeWidth="1" opacity={0.05} />
            </Pattern>
          </Defs>
          <G>
            <Rect x="0" y="0" width="100%" height="100%" fill={colors.cream} />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#kklLines)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#kklDots)" />
          </G>
        </Svg>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
});
