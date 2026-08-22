import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from './AnimatedPressable';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { formatQueueLabel } from '../utils/queueNumbers';

function Ring({ delay }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.85, duration: 1600, delay, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.55, duration: 1, delay, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity, delay]);

  return <Animated.View style={[styles.ring, { transform: [{ scale }], opacity }]} />;
}

// หน้าเรียกคิวเต็มจอ — ขึ้นทับทุกอย่างตอนถึงคิวจริง (เสียง/สั่นสั่งจาก QueueContext แล้ว)
export default function IncomingCallOverlay({ visible, queueNumber, onDismiss, onSnooze }) {
  const nudge = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return undefined;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(nudge, { toValue: -9, duration: 180, useNativeDriver: true }),
        Animated.timing(nudge, { toValue: 9, duration: 180, useNativeDriver: true }),
        Animated.timing(nudge, { toValue: 0, duration: 180, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, nudge]);

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        <View style={styles.ringWrap}>
          <Ring delay={0} />
          <Ring delay={800} />
          <View style={styles.bellCircle}>
            <Animated.View style={{ transform: [{ rotate: nudge.interpolate({ inputRange: [-9, 9], outputRange: ['-9deg', '9deg'] }) }] }}>
              <Ionicons name="notifications" size={52} color={colors.primary} />
            </Animated.View>
          </View>
        </View>

        <Text style={styles.title}>ถึงคิวคุณแล้ว!</Text>
        <Text style={styles.numberText}>{formatQueueLabel(queueNumber)}</Text>
        <Text style={styles.sub}>รับอาหารได้เลยที่เคาน์เตอร์ กรุณาแจ้งหมายเลขคิวกับพนักงาน</Text>

        <AnimatedPressable style={styles.ackBtn} onPress={onDismiss}>
          <Text style={styles.ackText}>กำลังไปรับแล้ว</Text>
        </AnimatedPressable>
        {onSnooze && (
          <AnimatedPressable style={styles.snoozeBtn} onPress={onSnooze}>
            <Text style={styles.snoozeText}>ขออีก 5 นาที</Text>
          </AnimatedPressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.primary },
  ringWrap: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  ring: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: colors.primaryGlow },
  bellCircle: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: fonts.heading, color: colors.cream, fontSize: 34, lineHeight: 39, textAlign: 'center' },
  numberText: { fontFamily: fonts.heading, color: colors.cream, fontSize: 76, lineHeight: 82, marginVertical: 4 },
  sub: { fontFamily: fonts.bodySemiBold, color: colors.cream, opacity: 0.95, fontSize: 15, maxWidth: 260, textAlign: 'center', lineHeight: 21 },
  ackBtn: {
    marginTop: 28, width: '100%', maxWidth: 280, borderRadius: 999,
    paddingVertical: 17, backgroundColor: colors.cream, alignItems: 'center',
  },
  ackText: { fontFamily: fonts.heading, color: colors.primaryDeep, fontSize: 16 },
  snoozeBtn: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  snoozeText: { fontFamily: fonts.bodyBold, color: colors.cream, fontSize: 13.5 },
});
