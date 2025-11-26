import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function NoQRIcon() {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotate = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        Animated.delay(700),
      ])
    );
    rotate.start();
    return () => rotate.stop();
  }, [rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <MaterialIcons name="qr-code" size={40} color="#ef4444" />
    </Animated.View>
  );
}
