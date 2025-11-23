import AsyncStorage from '@react-native-async-storage/async-storage';

interface Device {
  id: number;
  qr_code: string;
  name: string;
  created_at: string;
  updated_at: string;
  latitude?: number;
  longitude?: number;
}

interface Report {
  id: number;
  device_id: number;
  description: string;
  created_at: string;
  updated_at: string;
}

const DEVICES_KEY = '@devices';
const REPORTS_KEY = '@reports';

/**
 * Initialize database
 */
export const initDatabase = async () => {
  const devices = await AsyncStorage.getItem(DEVICES_KEY);
  const reports = await AsyncStorage.getItem(REPORTS_KEY);
  
  if (!devices) await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify([]));
  if (!reports) await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify([]));
};

/**
 * Check if QR code exists in devices
 */
export const checkQRExists = async (qrCode: string) => {
  const devicesStr = await AsyncStorage.getItem(DEVICES_KEY);
  const devices: Device[] = devicesStr ? JSON.parse(devicesStr) : [];
  return devices.find(d => d.qr_code === qrCode);
};

/**
 * Check if device name exists
 */
export const checkDeviceNameExists = async (name: string) => {
  const devicesStr = await AsyncStorage.getItem(DEVICES_KEY);
  const devices: Device[] = devicesStr ? JSON.parse(devicesStr) : [];
  return devices.some(d => d.name.toLowerCase() === name.toLowerCase());
};

/**
 * Add new device
 */
export const addDevice = async (qrCode: string, name: string, latitude?: number, longitude?: number) => {
  const devicesStr = await AsyncStorage.getItem(DEVICES_KEY);
  const devices: Device[] = devicesStr ? JSON.parse(devicesStr) : [];
  
  const newDevice: Device = {
    id: Date.now(),
    qr_code: qrCode,
    name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    latitude,
    longitude,
  };
  
  devices.push(newDevice);
  await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify(devices));
  return newDevice.id;
};

/**
 * Get all devices
 */
export const getDevices = async () => {
  const devicesStr = await AsyncStorage.getItem(DEVICES_KEY);
  const devices: Device[] = devicesStr ? JSON.parse(devicesStr) : [];
  return devices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

/**
 * Add new report
 */
export const addReport = async (deviceId: number, description: string) => {
  const reportsStr = await AsyncStorage.getItem(REPORTS_KEY);
  const reports: Report[] = reportsStr ? JSON.parse(reportsStr) : [];
  
  const newReport: Report = {
    id: Date.now(),
    device_id: deviceId,
    description,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  reports.push(newReport);
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  return newReport.id;
};

/**
 * Get all reports with device names
 */
export const getReports = async () => {
  const reportsStr = await AsyncStorage.getItem(REPORTS_KEY);
  const devicesStr = await AsyncStorage.getItem(DEVICES_KEY);
  
  const reports: Report[] = reportsStr ? JSON.parse(reportsStr) : [];
  const devices: Device[] = devicesStr ? JSON.parse(devicesStr) : [];
  
  return reports
    .map(r => {
      const device = devices.find(d => d.id === r.device_id);
      return {
        id: r.id,
        device_name: device?.name || 'Unknown',
        description: r.description,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

/**
 * Get last report for device
 */
export const getLastReport = async (deviceId: number) => {
  const reportsStr = await AsyncStorage.getItem(REPORTS_KEY);
  const reports: Report[] = reportsStr ? JSON.parse(reportsStr) : [];
  
  const deviceReports = reports.filter(r => r.device_id === deviceId);
  if (deviceReports.length === 0) return null;
  
  return deviceReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
};

/**
 * Update device
 */
export const updateDevice = async (id: number, name: string) => {
  const devicesStr = await AsyncStorage.getItem(DEVICES_KEY);
  const devices: Device[] = devicesStr ? JSON.parse(devicesStr) : [];
  
  const index = devices.findIndex(d => d.id === id);
  if (index !== -1) {
    devices[index].name = name;
    devices[index].updated_at = new Date().toISOString();
    await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify(devices));
  }
};

/**
 * Get device reports count
 */
export const getDeviceReportsCount = async (deviceId: number) => {
  const reportsStr = await AsyncStorage.getItem(REPORTS_KEY);
  const reports: Report[] = reportsStr ? JSON.parse(reportsStr) : [];
  return reports.filter(r => r.device_id === deviceId).length;
};

/**
 * Delete device and its reports
 */
export const deleteDevice = async (id: number) => {
  const devicesStr = await AsyncStorage.getItem(DEVICES_KEY);
  const devices: Device[] = devicesStr ? JSON.parse(devicesStr) : [];
  
  const filtered = devices.filter(d => d.id !== id);
  await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify(filtered));
  
  const reportsStr = await AsyncStorage.getItem(REPORTS_KEY);
  const reports: Report[] = reportsStr ? JSON.parse(reportsStr) : [];
  const filteredReports = reports.filter(r => r.device_id !== id);
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(filteredReports));
};

/**
 * Update report
 */
export const updateReport = async (id: number, description: string) => {
  const reportsStr = await AsyncStorage.getItem(REPORTS_KEY);
  const reports: Report[] = reportsStr ? JSON.parse(reportsStr) : [];
  
  const index = reports.findIndex(r => r.id === id);
  if (index !== -1) {
    reports[index].description = description;
    reports[index].updated_at = new Date().toISOString();
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  }
};

/**
 * Delete report
 */
export const deleteReport = async (id: number) => {
  const reportsStr = await AsyncStorage.getItem(REPORTS_KEY);
  const reports: Report[] = reportsStr ? JSON.parse(reportsStr) : [];
  
  const filtered = reports.filter(r => r.id !== id);
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));
};
