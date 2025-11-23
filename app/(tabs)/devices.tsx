import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getDevices, getLastReport } from '@/lib/database';
import ScanButton from '@/components/scan-button';
import AnimatedStatusIcon from '@/components/animated-status-icon';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { getReportInterval } from '@/lib/settings';

export default function DevicesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [devices, setDevices] = useState<any[]>([]);

  const loadDevices = async () => {
    const data = await getDevices();
    const interval = await getReportInterval();
    
    const devicesWithStatus = await Promise.all(
      data.map(async (device) => {
        const lastReport = await getLastReport(device.id);
        let status = 'none';
        
        if (lastReport) {
          const lastReportDate = new Date(lastReport.created_at);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - lastReportDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 0) {
            status = 'today';
          } else if (daysDiff > interval) {
            status = 'overdue';
          }
        } else {
          status = 'no-report';
        }
        
        return { ...device, status, animKey: Date.now() };
      })
    );
    
    setDevices(devicesWithStatus);
  };

  useFocusEffect(() => {
    loadDevices();
  });

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.itemWrapper}
            onPress={() => router.push({
              pathname: '/device-details',
              params: item,
            })}
          >
            <View style={[styles.item, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
              <Text style={[styles.itemName, { color: Colors[colorScheme].text }]}>{item.name}</Text>
              {item.status !== 'none' && <AnimatedStatusIcon key={item.animKey} status={item.status} />}
            </View>
            {item.status === 'today' && (
              <LinearGradient
                colors={['rgba(34, 197, 94, 0.15)', 'transparent']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={styles.gradient}
              />
            )}
            {item.status === 'overdue' && (
              <LinearGradient
                colors={['rgba(249, 115, 22, 0.15)', 'transparent']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={styles.gradient}
              />
            )}
            {item.status === 'no-report' && (
              <LinearGradient
                colors={['rgba(234, 179, 8, 0.15)', 'transparent']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={styles.gradient}
              />
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: Colors[colorScheme].icon }]}>{t('noDevicesYet')}</Text>
        }
      />
      <ScanButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  itemWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  item: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 16,
    pointerEvents: 'none',
  },
  itemName: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});
