import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text, AppState } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';

import { ThemeProvider } from '@/contexts/theme-context';
import { MachineTypesProvider } from '@/contexts/machine-types-context';
import { initDatabase } from '@/lib/database';
import { loadLanguage } from '@/lib/i18n';
import '@/lib/i18n';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const prepare = async () => {
      await initDatabase();
      await loadLanguage();
      await NavigationBar.setVisibilityAsync('hidden');
      setIsReady(true);
    };
    prepare();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        await NavigationBar.setVisibilityAsync('hidden');
      }
    });
    return () => subscription.remove();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.version}>v{Constants.expoConfig?.version}</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      {({ theme }) => (
        <MachineTypesProvider>
          <NavigationThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ 
              animation: 'slide_from_right',
              detachPreviousScreen: false
            }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="scan" options={{ presentation: 'modal', title: t('scanQRCode') }} />
              <Stack.Screen name="device-details" options={{ title: t('machineDetails') }} />
              <Stack.Screen name="report-details" options={{ title: t('reportDetails') }} />
              <Stack.Screen name="machine-types" options={{ title: t('machineTypes') }} />
              <Stack.Screen name="scan-qr-edit" options={{ presentation: 'modal', title: t('scanQRCode') }} />
            </Stack>
            <StatusBar style="auto" />
          </NavigationThemeProvider>
        </MachineTypesProvider>
      )}
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
  version: {
    marginTop: 20,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
});
