import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { getReports } from '@/lib/database';
import ScanButton from '@/components/scan-button';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function ReportsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);

  const loadReports = async () => {
    const data = await getReports();
    setReports(data);
  };

  useFocusEffect(() => {
    loadReports();
  });

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
            onPress={() => router.push({
              pathname: '/report-details',
              params: item,
            })}
          >
            <Text style={[styles.itemDevice, { color: Colors[colorScheme].tint }]}>{item.device_name}</Text>
            <Text style={[styles.itemDescription, { color: Colors[colorScheme].text }]}>{item.description}</Text>
            <Text style={[styles.itemDate, { color: Colors[colorScheme].icon }]}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: Colors[colorScheme].icon }]}>{t('noReportsYet')}</Text>
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
    paddingVertical: 20,
  },
  item: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
  },
  itemDevice: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 13,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});
