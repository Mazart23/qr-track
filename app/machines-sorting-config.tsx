import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const SORTING_CONFIG_KEY = '@machines_sorting_config';

const DEFAULT_SORTING = {
  created: true,
  name: true,
  status: true,
  type: true,
  serial: true,
  lastReport: true,
};

export default function MachinesSortingConfigScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const [sorting, setSorting] = useState(DEFAULT_SORTING);
  const [activeSortBy, setActiveSortBy] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
    loadActiveSorting();
  }, []);

  const loadConfig = async () => {
    const saved = await AsyncStorage.getItem(SORTING_CONFIG_KEY);
    if (saved) {
      setSorting(JSON.parse(saved));
    }
  };

  const loadActiveSorting = async () => {
    const sortBy = await AsyncStorage.getItem('@sort_by');
    if (sortBy) {
      setActiveSortBy(sortBy);
    }
  };

  const toggleSorting = async (key: keyof typeof DEFAULT_SORTING) => {
    if (sorting[key] && activeSortBy === key) return;
    const newSorting = { ...sorting, [key]: !sorting[key] };
    const hasAtLeastOne = Object.values(newSorting).some(v => v);
    if (!hasAtLeastOne) return;
    setSorting(newSorting);
    await AsyncStorage.setItem(SORTING_CONFIG_KEY, JSON.stringify(newSorting));
  };

  const sortingOptions = [
    { key: 'created', label: t('sortByCreated'), icon: 'event' },
    { key: 'name', label: t('sortByName'), icon: 'sort-by-alpha' },
    { key: 'status', label: t('sortByStatus'), icon: 'info' },
    { key: 'type', label: t('sortByType'), icon: 'category' },
    { key: 'serial', label: t('sortBySerial'), icon: 'tag' },
    { key: 'lastReport', label: t('sortByLastReport'), icon: 'schedule' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      {sortingOptions.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[styles.item, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
          onPress={() => toggleSorting(option.key as keyof typeof DEFAULT_SORTING)}
        >
          <View style={styles.itemLeft}>
            <MaterialIcons name={option.icon as any} size={24} color={Colors[colorScheme].icon} />
            <Text style={[styles.itemText, { color: Colors[colorScheme].text }]}>{option.label}</Text>
          </View>
          <MaterialIcons
            name={sorting[option.key as keyof typeof DEFAULT_SORTING] ? 'check-box' : 'check-box-outline-blank'}
            size={28}
            color={sorting[option.key as keyof typeof DEFAULT_SORTING] ? Colors[colorScheme].tint : Colors[colorScheme].icon}
            style={{ opacity: sorting[option.key as keyof typeof DEFAULT_SORTING] && activeSortBy === option.key ? 0.5 : 1 }}
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
