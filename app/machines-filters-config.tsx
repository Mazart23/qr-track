import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const FILTERS_CONFIG_KEY = '@machines_filters_config';

const DEFAULT_FILTERS = {
  machineType: true,
  status: true,
  lastReportDate: true,
  daysUntilReport: true,
  reportsCount: true,
  createdAt: true,
  updatedAt: true,
};

export default function MachinesFiltersConfigScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [activeFilters, setActiveFilters] = useState<any>({});

  useEffect(() => {
    loadConfig();
    loadActiveFilters();
  }, []);

  const loadConfig = async () => {
    const saved = await AsyncStorage.getItem(FILTERS_CONFIG_KEY);
    if (saved) {
      setFilters(JSON.parse(saved));
    }
  };

  const loadActiveFilters = async () => {
    const filterTypes = await AsyncStorage.getItem('@filter_types');
    const filterStatuses = await AsyncStorage.getItem('@filter_statuses');
    const lastReportDateFrom = await AsyncStorage.getItem('@last_report_date_from');
    const lastReportDateTo = await AsyncStorage.getItem('@last_report_date_to');
    const daysUntilReportMin = await AsyncStorage.getItem('@days_until_report_min');
    const daysUntilReportMax = await AsyncStorage.getItem('@days_until_report_max');
    const reportsCountMin = await AsyncStorage.getItem('@reports_count_min');
    const reportsCountMax = await AsyncStorage.getItem('@reports_count_max');
    const createdDateFrom = await AsyncStorage.getItem('@created_date_from');
    const createdDateTo = await AsyncStorage.getItem('@created_date_to');
    const updatedDateFrom = await AsyncStorage.getItem('@updated_date_from');
    const updatedDateTo = await AsyncStorage.getItem('@updated_date_to');

    setActiveFilters({
      machineType: filterTypes && JSON.parse(filterTypes).length > 0,
      status: filterStatuses && JSON.parse(filterStatuses).length > 0,
      lastReportDate: lastReportDateFrom || lastReportDateTo,
      daysUntilReport: daysUntilReportMin || daysUntilReportMax,
      reportsCount: reportsCountMin || reportsCountMax,
      createdAt: createdDateFrom || createdDateTo,
      updatedAt: updatedDateFrom || updatedDateTo,
    });
  };

  const toggleFilter = async (key: keyof typeof DEFAULT_FILTERS) => {
    if (filters[key] && activeFilters[key]) return;
    const newFilters = { ...filters, [key]: !filters[key] };
    setFilters(newFilters);
    await AsyncStorage.setItem(FILTERS_CONFIG_KEY, JSON.stringify(newFilters));
  };

  const filterOptions = [
    { key: 'machineType', label: t('machineType'), icon: 'category' },
    { key: 'status', label: t('status'), icon: 'info' },
    { key: 'lastReportDate', label: t('lastReportDate'), icon: 'event' },
    { key: 'daysUntilReport', label: t('daysUntilReport'), icon: 'schedule' },
    { key: 'reportsCount', label: t('reportsCount'), icon: 'numbers' },
    { key: 'createdAt', label: t('createdAt'), icon: 'add-circle' },
    { key: 'updatedAt', label: t('updatedAt'), icon: 'update' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      {filterOptions.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[styles.item, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
          onPress={() => toggleFilter(option.key as keyof typeof DEFAULT_FILTERS)}
        >
          <View style={styles.itemLeft}>
            <MaterialIcons name={option.icon as any} size={24} color={Colors[colorScheme].icon} />
            <Text style={[styles.itemText, { color: Colors[colorScheme].text }]}>{option.label}</Text>
          </View>
          <MaterialIcons
            name={filters[option.key as keyof typeof DEFAULT_FILTERS] ? 'check-box' : 'check-box-outline-blank'}
            size={28}
            color={filters[option.key as keyof typeof DEFAULT_FILTERS] ? Colors[colorScheme].tint : Colors[colorScheme].icon}
            style={{ opacity: filters[option.key as keyof typeof DEFAULT_FILTERS] && activeFilters[option.key] ? 0.5 : 1 }}
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  itemText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
