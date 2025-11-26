import { View, Text, FlatList, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { getDeviceReports } from '@/lib/database';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useNavigation } from '@/contexts/navigation-context';

function ReportItem({ item, colorScheme, navigate, router, isNavigating }: any) {
  const scaleAnim = useState(() => new Animated.Value(1))[0];
  
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const isTodayReport = isToday(item.created_at);
  
  useEffect(() => {
    if (isTodayReport) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isTodayReport]);
  
  return (
    <View style={styles.itemWrapper}>
      <TouchableOpacity
        style={[styles.item, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
        onPress={() => navigate(() => router.push({
          pathname: '/report-details',
          params: item,
        }))}
        disabled={isNavigating}
      >
        <Text style={[styles.itemDescription, { color: Colors[colorScheme].text }]}>
          {item.description}
        </Text>
        <Text style={[styles.itemDate, { color: Colors[colorScheme].icon }]}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
        {isTodayReport && (
          <Animated.View style={[styles.iconWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <MaterialIcons name="check-circle" size={32} color="#22c55e" />
          </Animated.View>
        )}
      </TouchableOpacity>
      {isTodayReport && (
        <LinearGradient
          colors={['transparent', 'rgba(34, 197, 94, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          locations={[0.3, 1]}
          style={styles.gradient}
        />
      )}
    </View>
  );
}

export default function DeviceReportsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { navigate, isNavigating } = useNavigation();
  const params = useLocalSearchParams();
  const { deviceId } = params;
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
  }, [deviceId]);

  const loadReports = async () => {
    const data = await getDeviceReports(Number(deviceId));
    setReports(data);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ReportItem
            item={item}
            colorScheme={colorScheme}
            navigate={navigate}
            router={router}
            isNavigating={isNavigating}
          />
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: Colors[colorScheme].icon }]}>{t('noReportsYet')}</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 24,
    paddingBottom: 40,
  },
  itemWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  item: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    position: 'relative',
  },
  iconWrapper: {
    position: 'absolute',
    right: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 16,
    pointerEvents: 'none',
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
