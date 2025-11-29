import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AnimatedTabBar } from '@/components/animated-tab-bar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const tabs = [
  { name: 'devices', icon: 'machinery', key: 'devices' },
  { name: 'reports', icon: 'doc.text.fill', key: 'reports' },
  { name: 'qrs', icon: 'qrcode', key: 'newQRs' },
  { name: 'settings', icon: 'gearshape.fill', key: 'settings' },
];

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.text,
        headerShown: true,

        tabBarStyle: {
          height: 100,
          paddingBottom: 4,
          paddingTop: 4,
          backgroundColor: Colors.dark.card,
          borderTopColor: Colors.dark.border,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          marginTop: 2,
        },
        tabBarIconStyle: {
          height: 50,
          width: 50,
          marginTop: 0,
          marginBottom: 0,
        },
        headerStyle: {
          backgroundColor: Colors.dark.card,
          height: 120,
          borderBottomColor: Colors.dark.border,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontSize: 26,
          fontWeight: 'bold',
        },
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.key),
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <IconSymbol size={56} name={tab.icon} color={Colors.dark.text} />
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: Colors.dark.text }}>
                  {t(tab.key)}
                </Text>
              </View>
            ),
            headerRight: tab.name === 'devices' ? () => (
              <TouchableOpacity
                onPress={() => router.push('/machines-config')}
                style={{ marginRight: 16 }}
              >
                <IconSymbol size={32} name="gearshape.fill" color={Colors.dark.text} />
              </TouchableOpacity>
            ) : tab.name === 'reports' ? () => (
              <TouchableOpacity
                onPress={() => router.push('/reports-config')}
                style={{ marginRight: 16 }}
              >
                <IconSymbol size={32} name="gearshape.fill" color={Colors.dark.text} />
              </TouchableOpacity>
            ) : undefined,
            tabBarIcon: ({ color }) => <IconSymbol size={42} name={tab.icon} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
