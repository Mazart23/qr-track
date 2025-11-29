import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useNavigation } from '@/contexts/navigation-context';

export default function MachinesConfigScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { navigate, isNavigating } = useNavigation();

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
        onPress={() => navigate(() => router.push('/machine-types'))}
        disabled={isNavigating}
      >
        <View style={styles.buttonLeft}>
          <MaterialIcons name="category" size={24} color={Colors[colorScheme].icon} />
          <Text style={[styles.buttonText, { color: Colors[colorScheme].text }]}>{t('machineTypes')}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={28} color={Colors[colorScheme].icon} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
        onPress={() => navigate(() => router.push('/machines-filters-config'))}
        disabled={isNavigating}
      >
        <View style={styles.buttonLeft}>
          <MaterialIcons name="filter-list" size={24} color={Colors[colorScheme].icon} />
          <Text style={[styles.buttonText, { color: Colors[colorScheme].text }]}>{t('machinesFilters')}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={28} color={Colors[colorScheme].icon} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
        onPress={() => navigate(() => router.push('/machines-sorting-config'))}
        disabled={isNavigating}
      >
        <View style={styles.buttonLeft}>
          <MaterialIcons name="sort" size={24} color={Colors[colorScheme].icon} />
          <Text style={[styles.buttonText, { color: Colors[colorScheme].text }]}>{t('machinesSorting')}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={28} color={Colors[colorScheme].icon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  button: {
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
  buttonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
