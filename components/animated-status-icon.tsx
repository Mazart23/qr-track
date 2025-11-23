import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type StatusIconProps = {
  status: 'today' | 'overdue' | 'no-report';
  size?: number;
};

export default function AnimatedStatusIcon({ status, size = 32 }: StatusIconProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'today') {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [status, scaleAnim]);

  useEffect(() => {
    if (status === 'overdue') {
      const shake = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -5, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 5, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
          Animated.delay(700),
        ])
      );
      shake.start();
      return () => shake.stop();
    }
  }, [status, shakeAnim]);

  useEffect(() => {
    if (status === 'no-report') {
      const float = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: -8, duration: 1000, useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      );
      float.start();
      return () => float.stop();
    }
  }, [status, floatAnim]);

  if (status === 'today') {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <MaterialIcons name="check-circle" size={size} color="#22c55e" />
      </Animated.View>
    );
  }

  if (status === 'overdue') {
    return (
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <MaterialIcons name="warning" size={size} color="#f97316" />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
      <MaterialIcons name="help" size={size} color="#eab308" />
    </Animated.View>
  );
}
