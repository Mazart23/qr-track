import AsyncStorage from '@react-native-async-storage/async-storage';

interface Device {
  id: number;
  qr_code: string;
  name: string;
  machine_type_id: number;
  serial_number: string;
  created_at: string;
  updated_at: string;
  latitude?: number;
  longitude?: number;
  image?: string;
  image_thumbnail?: string;
}

interface MachineType {
  id: number;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
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
const MACHINE_TYPES_KEY = '@machine_types';

/**
 * Initialize database
 */
export const initDatabase = async () => {
  const devices = await AsyncStorage.getItem(DEVICES_KEY);
  const reports = await AsyncStorage.getItem(REPORTS_KEY);
  const machineTypes = await AsyncStorage.getItem(MACHINE_TYPES_KEY);
  
  if (!devices) await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify([]));
  if (!reports) await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify([]));
  if (!machineTypes) await AsyncStorage.setItem(MACHINE_TYPES_KEY, JSON.stringify([]));
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
 * Check if QR code exists excluding specific device
 */
export const checkQRExistsExcluding = async (qrCode: string, excludeId: number) => {
  const devicesStr = await AsyncStorage.getItem(DEVICES_KEY);
  const devices: Device[] = devicesStr ? JSON.parse(devicesStr) : [];
  return devices.find(d => d.qr_code === qrCode && d.id !== excludeId);
};

/**
 * Update device QR code
 */
export const updateDeviceQRCode = async (id: number, qrCode: string | null) => {
  const devicesStr = await AsyncStorage.getItem(DEVICES_KEY);
  const devices: Device[] = devicesStr ? JSON.parse(devicesStr) : [];
  
  const index = devices.findIndex(d => d.id === id);
  if (index !== -1) {
    devices[index].qr_code = qrCode || '';
    devices[index].updated_at = new Date().toISOString();
    await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify(devices));
  }
};

/**
 * Check if device name exists
 */
export const checkDeviceNameExists = async (name: string, excludeId?: number) => {
  const devicesStr = await AsyncStorage.getItem(DEVICES_KEY);
  const devices: Device[] = devicesStr ? JSON.parse(devicesStr) : [];
  return devices.some(d => d.name && name && d.name.toLowerCase() === name.toLowerCase() && d.id !== excludeId);
};

/**
 * Check if serial number exists
 */
export const checkSerialNumberExists = async (serialNumber: string, excludeId?: number) => {
  const devicesStr = await AsyncStorage.getItem(DEVICES_KEY);
  const devices: Device[] = devicesStr ? JSON.parse(devicesStr) : [];
  return devices.some(d => d.serial_number && serialNumber && d.serial_number.toLowerCase() === serialNumber.toLowerCase() && d.id !== excludeId);
};

/**
 * Add new device
 */
export const addDevice = async (qrCode: string, name: string, machineTypeId: number, serialNumber: string, latitude?: number, longitude?: number, image?: string, imageThumbnail?: string) => {
  const devicesStr = await AsyncStorage.getItem(DEVICES_KEY);
  const devices: Device[] = devicesStr ? JSON.parse(devicesStr) : [];
  
  const newDevice: Device = {
    id: Date.now(),
    qr_code: qrCode,
    name,
    machine_type_id: machineTypeId,
    serial_number: serialNumber,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    latitude,
    longitude,
    image,
    image_thumbnail: imageThumbnail,
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
 * Get device by id
 */
export const getDeviceById = async (id: number) => {
  const devicesStr = await AsyncStorage.getItem(DEVICES_KEY);
  const devices: Device[] = devicesStr ? JSON.parse(devicesStr) : [];
  return devices.find(d => d.id === id);
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
export const updateDevice = async (id: number, name: string, machineTypeId: number, serialNumber: string, image?: string, imageThumbnail?: string) => {
  const devicesStr = await AsyncStorage.getItem(DEVICES_KEY);
  const devices: Device[] = devicesStr ? JSON.parse(devicesStr) : [];
  
  const index = devices.findIndex(d => d.id === id);
  if (index !== -1) {
    devices[index].name = name;
    devices[index].machine_type_id = machineTypeId;
    devices[index].serial_number = serialNumber;
    if (image !== undefined) devices[index].image = image;
    if (imageThumbnail !== undefined) devices[index].image_thumbnail = imageThumbnail;
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

/**
 * Get all machine types
 */
export const getMachineTypes = async () => {
  const typesStr = await AsyncStorage.getItem(MACHINE_TYPES_KEY);
  const types: MachineType[] = typesStr ? JSON.parse(typesStr) : [];
  return types.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Add machine type
 */
export const addMachineType = async (name: string, color: string = '#3b82f6', icon: string = 'build') => {
  const typesStr = await AsyncStorage.getItem(MACHINE_TYPES_KEY);
  const types: MachineType[] = typesStr ? JSON.parse(typesStr) : [];
  
  const newType: MachineType = {
    id: Date.now(),
    name,
    color,
    icon,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  types.push(newType);
  await AsyncStorage.setItem(MACHINE_TYPES_KEY, JSON.stringify(types));
  return newType.id;
};

/**
 * Update machine type
 */
export const updateMachineType = async (id: number, name: string, color?: string, icon?: string) => {
  const typesStr = await AsyncStorage.getItem(MACHINE_TYPES_KEY);
  const types: MachineType[] = typesStr ? JSON.parse(typesStr) : [];
  
  const index = types.findIndex(t => t.id === id);
  if (index !== -1) {
    types[index].name = name;
    types[index].color = color || types[index].color || '#3b82f6';
    types[index].icon = icon || types[index].icon || 'build';
    types[index].updated_at = new Date().toISOString();
    await AsyncStorage.setItem(MACHINE_TYPES_KEY, JSON.stringify(types));
  }
};

/**
 * Get devices count by machine type
 */
export const getDeviceCountByType = async (typeId: number) => {
  const devicesStr = await AsyncStorage.getItem(DEVICES_KEY);
  const devices: Device[] = devicesStr ? JSON.parse(devicesStr) : [];
  return devices.filter(d => d.machine_type_id === typeId).length;
};

/**
 * Delete machine type and all related devices
 */
export const deleteMachineType = async (id: number) => {
  const typesStr = await AsyncStorage.getItem(MACHINE_TYPES_KEY);
  const types: MachineType[] = typesStr ? JSON.parse(typesStr) : [];
  
  const filtered = types.filter(t => t.id !== id);
  await AsyncStorage.setItem(MACHINE_TYPES_KEY, JSON.stringify(filtered));
  
  const devicesStr = await AsyncStorage.getItem(DEVICES_KEY);
  const devices: Device[] = devicesStr ? JSON.parse(devicesStr) : [];
  const devicesToDelete = devices.filter(d => d.machine_type_id === id);
  
  for (const device of devicesToDelete) {
    await deleteDevice(device.id);
  }
};

/**
 * Get machine type by id
 */
export const getMachineTypeById = async (id: number) => {
  const typesStr = await AsyncStorage.getItem(MACHINE_TYPES_KEY);
  const types: MachineType[] = typesStr ? JSON.parse(typesStr) : [];
  return types.find(t => t.id === id);
};

/**
 * Check if machine type name exists
 */
export const checkMachineTypeExists = async (name: string, excludeId?: number) => {
  const typesStr = await AsyncStorage.getItem(MACHINE_TYPES_KEY);
  const types: MachineType[] = typesStr ? JSON.parse(typesStr) : [];
  return types.some(t => t.name && name && t.name.toLowerCase() === name.toLowerCase() && t.id !== excludeId);
};
