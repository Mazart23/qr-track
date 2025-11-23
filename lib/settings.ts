import AsyncStorage from '@react-native-async-storage/async-storage';

const REPORT_INTERVAL_KEY = '@report_interval';

/**
 * Get report interval in days
 */
export const getReportInterval = async (): Promise<number> => {
  const interval = await AsyncStorage.getItem(REPORT_INTERVAL_KEY);
  return interval ? parseInt(interval) : 7;
};

/**
 * Set report interval in days
 */
export const setReportInterval = async (days: number) => {
  await AsyncStorage.setItem(REPORT_INTERVAL_KEY, days.toString());
};
