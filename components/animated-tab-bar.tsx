import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';

function AnimatedTabBarButton({ route, isFocused, onPress, icon, label }: any) {
  const iconScale = useSharedValue(isFocused ? 1.5 : 1);
  const iconTranslateY = useSharedValue(isFocused ? 4.5 : 0);
  const labelOpacity = useSharedValue(isFocused ? 0 : 1);
  const labelTranslateY = useSharedValue(isFocused ? -10 : 0);

  useEffect(() => {
    if (isFocused) {
      iconScale.value = withTiming(1.5, { duration: 300 });
      iconTranslateY.value = withTiming(4.5, { duration: 300 });
      labelOpacity.value = withTiming(0, { duration: 200 });
      labelTranslateY.value = withTiming(-10, { duration: 200 });
    } else {
      iconScale.value = withTiming(1, { duration: 150 });
      iconTranslateY.value = withTiming(0, { duration: 150 });
      labelOpacity.value = withTiming(1, { duration: 150 });
      labelTranslateY.value = withTiming(0, { duration: 150 });
    }
  }, [isFocused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }, { translateY: iconTranslateY.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelTranslateY.value }],
  }));

  return (
    <TouchableOpacity
      onPress={() => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      style={styles.tabButton}
    >
      <Animated.View style={iconStyle}>
        {icon}
      </Animated.View>
      <Animated.View style={labelStyle}>
        <Text style={[styles.label, { color: isFocused ? Colors.dark.text : Colors.dark.icon }]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <AnimatedTabBarButton
            key={route.key}
            route={route}
            isFocused={isFocused}
            onPress={onPress}
            icon={options.tabBarIcon?.({ focused: isFocused, color: isFocused ? Colors.dark.text : Colors.dark.icon, size: 42 })}
            label={options.title || route.name}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 100,
    paddingBottom: 4,
    paddingTop: 4,
    backgroundColor: Colors.dark.card,
    borderTopColor: Colors.dark.border,
    borderTopWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
});
