import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import 'react-native-reanimated';
import "./globals.css"

import { ThemeProvider } from '@/contexts/theme-context';
import { initDatabase } from '@/lib/database';
import { loadLanguage } from '@/lib/i18n';
import '@/lib/i18n';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      await initDatabase();
      await loadLanguage();
      setIsReady(true);
    };
    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationThemeProvider value={DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="scan" options={{ presentation: 'modal', title: 'Scan QR' }} />
          <Stack.Screen name="device-details" options={{ title: 'Machine Details' }} />
          <Stack.Screen name="report-details" options={{ title: 'Report Details' }} />
        </Stack>
        <StatusBar style="auto" />
      </NavigationThemeProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 200,
    height: 200,
  },
});
