import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function ReportsConfigScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const router = useRouter();

  const options = [
    { key: 'filters', label: t('reportsFilters'), icon: 'filter-list', route: '/reports-filters-config' },
    { key: 'sorting', label: t('reportsSorting'), icon: 'sort', route: '/reports-sorting-config' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[styles.item, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
          onPress={() => router.push(option.route as any)}
        >
          <View style={styles.itemLeft}>
            <MaterialIcons name={option.icon as any} size={24} color={Colors[colorScheme].icon} />
            <Text style={[styles.itemText, { color: Colors[colorScheme].text }]}>{option.label}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={28} color={Colors[colorScheme].icon} />
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
