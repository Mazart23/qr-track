import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import Constants from 'expo-constants';

export default function TestDataScreen() {
  if (!__DEV__) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Not available in production</Text>
      </View>
    );
  }
  const router = useRouter();
  const colorScheme = useColorScheme();

  // Only available in development mode

  const addTestData = async () => {
    const testQR = 'TEST-OVERDUE-001';
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const devicesData = await AsyncStorage.getItem('@devices');
    const devices = devicesData ? JSON.parse(devicesData) : [];
    const newDevice = {
      id: Date.now(),
      qr_code: testQR,
      name: 'TEST Machine - Overdue',
      created_at: new Date().toISOString(),
      latitude: 52.2297,
      longitude: 21.0122,
    };
    devices.push(newDevice);
    await AsyncStorage.setItem('@devices', JSON.stringify(devices));

    const reportsData = await AsyncStorage.getItem('@reports');
    const reports = reportsData ? JSON.parse(reportsData) : [];
    const newReport = {
      id: Date.now(),
      device_id: newDevice.id,
      device_name: newDevice.name,
      description: 'Test report from 7 days ago',
      created_at: sevenDaysAgo.toISOString(),
    };
    reports.push(newReport);
    await AsyncStorage.setItem('@reports', JSON.stringify(reports));

    Alert.alert('Success', 'Test data added successfully');
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Add Test Data</Text>
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]} 
        onPress={addTestData}
      >
        <Text style={styles.buttonText}>Add Test Machine with Overdue Report</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
