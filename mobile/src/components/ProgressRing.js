import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

// วงแหวนนับถอยหลัง (แทน conic-gradient ของเว็บ ซึ่ง React Native ไม่รองรับ)
export default function ProgressRing({ size = 96, strokeWidth = 8, pct = 0, trackColor, fillColor, children }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      {children}
    </View>
  );
}
