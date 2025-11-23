import { View, Text, FlatList, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getDevices, getLastReport } from '@/lib/database';
import { useMachineTypes } from '@/contexts/machine-types-context';
import ScanButton from '@/components/scan-button';
import AnimatedStatusIcon from '@/components/animated-status-icon';

function NoQRIcon() {
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
      <MaterialIcons name="qr-code" size={32} color="#ef4444" />
    </Animated.View>
  );
}
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { getReportInterval } from '@/lib/settings';

function getDarkerColor(color: string) {
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 40);
  const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 40);
  const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 40);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function DevicesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { getMachineTypeById } = useMachineTypes();
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
        
        const hasQR = device.qr_code && device.qr_code.trim() !== '';
        const machineType = getMachineTypeById(device.machine_type_id);
        return { ...device, status, animKey: Date.now(), hasQR, machineType };
      })
    );
    
    setDevices(devicesWithStatus);
  };

  useFocusEffect(() => {
    loadDevices();
  });

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <TouchableOpacity 
        style={[styles.configButton, { backgroundColor: Colors[colorScheme].tint }]}
        onPress={() => router.push('/machine-types')}
      >
        <Text style={styles.configButtonText}>⚙️ {t('machineTypes')}</Text>
      </TouchableOpacity>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.item, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
            activeOpacity={0.7}
            onPress={() => router.push({
              pathname: '/device-details',
              params: {
                ...item,
                machine_type_id: item.machine_type_id,
                serial_number: item.serial_number,
              },
            })}
          >
            {!item.hasQR && (
              <LinearGradient
                colors={['transparent', 'rgba(239, 68, 68, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                locations={[0.3, 1]}
                style={styles.gradient}
              />
            )}
            {item.hasQR && item.status === 'today' && (
              <LinearGradient
                colors={['transparent', 'rgba(34, 197, 94, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                locations={[0.3, 1]}
                style={styles.gradient}
              />
            )}
            {item.hasQR && item.status === 'overdue' && (
              <LinearGradient
                colors={['transparent', 'rgba(249, 115, 22, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                locations={[0.3, 1]}
                style={styles.gradient}
              />
            )}
            {item.hasQR && item.status === 'no-report' && (
              <LinearGradient
                colors={['transparent', 'rgba(234, 179, 8, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                locations={[0.3, 1]}
                style={styles.gradient}
              />
            )}
            {item.machineType && item.machineType.color && item.machineType.icon && (
              <View style={[styles.typeIndicator, { backgroundColor: item.machineType.color, borderColor: getDarkerColor(item.machineType.color) }]}>
                <MaterialIcons name={item.machineType.icon} size={24} color="#fff" />
              </View>
            )}
            <View style={[styles.textContainer, { marginLeft: item.machineType?.color && item.machineType?.icon ? '12%' : 20 }]}>
              <Text style={[styles.itemName, { color: Colors[colorScheme].text }]}>{item.name}</Text>
              {item.serial_number && (
                <Text style={[styles.serialNumber, { color: Colors[colorScheme].icon }]}>{item.serial_number}</Text>
              )}
            </View>
            <View style={styles.iconRow}>
              {!item.hasQR && <NoQRIcon />}
              {item.status !== 'none' && <AnimatedStatusIcon key={item.animKey} status={item.status} />}
            </View>
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
    paddingTop: 10,
    paddingBottom: 20,
  },
  configButton: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  configButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  itemWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  item: {
    padding: 20,
    paddingLeft: 0,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  typeIndicator: {
    width: '10%',
    position: 'absolute',
    left: -1,
    top: -1,
    bottom: -1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderRightWidth: 2,
    zIndex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 16,
    pointerEvents: 'none',
    zIndex: 0,
  },
  textContainer: {
    flex: 1,
    zIndex: 1,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '600',
  },
  serialNumber: {
    fontSize: 14,
    marginTop: 4,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    zIndex: 1,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});
