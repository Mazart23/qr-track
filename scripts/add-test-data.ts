import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Add test machine with overdue report (7 days old)
 */
async function addTestData() {
  const testQR = 'TEST-OVERDUE-001';
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Add test device
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

  // Add overdue report
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

  console.log('Test data added:', { device: newDevice, report: newReport });
}

addTestData();
