import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text, AppState, Linking, Alert } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as Updates from 'expo-updates';
import 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';

import { ThemeProvider } from '@/contexts/theme-context';
import { MachineTypesProvider } from '@/contexts/machine-types-context';
import { NavigationProvider } from '@/contexts/navigation-context';
import { initDatabase, getMachineTypes } from '@/lib/database';
import { loadLanguage } from '@/lib/i18n';
import '@/lib/i18n';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const prepare = async () => {
      await initDatabase();
      await loadLanguage();
      await getMachineTypes();
      await NavigationBar.setVisibilityAsync('hidden');
      setIsInitialized(true);
    };
    prepare();
  }, []);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/Mazart23/qr-track/main/build-info.json');
        
        if (!response.ok) {
          throw new Error('failed: Build info not found');
        }
        
        const buildInfo = await response.json();
        
        const currentRuntime = Constants.expoConfig?.runtimeVersion;
        const serverRuntime = buildInfo.runtimeVersion;
        
        const currentHash = currentRuntime?.substring(currentRuntime.indexOf('-') + 1);
        const serverHash = serverRuntime?.substring(serverRuntime.indexOf('-') + 1);
        
        if (serverHash && currentHash && serverHash !== currentHash && buildInfo.downloadUrl) {
          Alert.alert(
            t('newVersionAvailable'),
            t('newVersionMessage', { version: buildInfo.version }),
            [
              { text: t('later'), style: 'cancel' },
              { 
                text: t('download'), 
                onPress: () => Linking.openURL(buildInfo.downloadUrl)
              }
            ]
          );
        } else {
          throw new Error('stopped: Runtime versions compatible');
        }
      } catch (e) {
        console.log('Update check ', e.message);
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        } catch (updateError) {
          console.log('OTA update check failed:', updateError);
        }
      }
      
      setIsReady(true);
    };
    if (isInitialized) {
      checkUpdate();
      setIsReady(true);
    }
  }, [isInitialized]);

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
    <NavigationProvider>
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
              <Stack.Screen name="machines-config" options={{ title: t('machinesConfig') }} />
              <Stack.Screen name="machines-filters-config" options={{ title: t('machinesFilters') }} />
              <Stack.Screen name="machines-sorting-config" options={{ title: t('machinesSorting') }} />
              <Stack.Screen name="reports-config" options={{ title: t('reportsConfig') }} />
              <Stack.Screen name="reports-filters-config" options={{ title: t('reportsFilters') }} />
              <Stack.Screen name="reports-sorting-config" options={{ title: t('reportsSorting') }} />
              <Stack.Screen name="scan-qr-edit" options={{ presentation: 'modal', title: t('scanQRCode') }} />
              <Stack.Screen name="device-reports" options={{ presentation: 'modal', animation: 'slide_from_bottom', title: t('allReports') }} />
            </Stack>
            <StatusBar style="auto" />
          </NavigationThemeProvider>
          </MachineTypesProvider>
        )}
      </ThemeProvider>
    </NavigationProvider>
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
