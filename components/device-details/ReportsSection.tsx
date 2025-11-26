import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Rect } from 'react-native-svg';
import { useState, useEffect } from 'react';

function ModalReportItem({ item, colorScheme, navigate, router, isNavigating, setShowAllReports, isToday }: any) {
  const modalScaleAnim = useState(() => new Animated.Value(1))[0];
  const isTodayReport = isToday(item.created_at);
  
  useEffect(() => {
    if (isTodayReport) {
      Animated.sequence([
        Animated.timing(modalScaleAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(modalScaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isTodayReport]);
  
  return (
    <View style={localStyles.cardWrapper}>
      <TouchableOpacity
        style={[localStyles.reportCard, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
        onPress={() => {
          setShowAllReports(false);
          navigate(() => router.push({
            pathname: '/report-details',
            params: item,
          }));
        }}
        disabled={isNavigating}
      >
        <Text style={[localStyles.reportDescription, { color: Colors[colorScheme].text }]}>
          {item.description}
        </Text>
        <Text style={[localStyles.reportDate, { color: Colors[colorScheme].icon }]}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
        {isTodayReport && (
          <Animated.View style={[localStyles.modalIconWrapper, { transform: [{ scale: modalScaleAnim }] }]}>
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
          style={localStyles.gradient}
        />
      )}
    </View>
  );
}
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useNavigation } from '@/contexts/navigation-context';

interface Report {
  id: number;
  device_name: string;
  description: string;
  created_at: string;
}

interface ReportsSectionProps {
  deviceId: number;
  colorScheme: 'light' | 'dark';
  sharedStyles: any;
  getDeviceReports: (deviceId: number) => Promise<Report[]>;
}

export default function ReportsSection({ deviceId, colorScheme, sharedStyles, getDeviceReports }: ReportsSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { navigate, isNavigating } = useNavigation();
  const [reports, setReports] = useState<Report[]>([]);

  const scaleAnim = useState(() => new Animated.Value(1))[0];

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  useEffect(() => {
    loadReports();
  }, [deviceId]);

  useEffect(() => {
    if (reports.length > 0 && isToday(reports[0].created_at)) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [reports]);

  const loadReports = async () => {
    const data = await getDeviceReports(deviceId);
    setReports(data);
  };

  if (reports.length === 0) return null;

  const latestReport = reports[0];
  const isLatestToday = isToday(latestReport.created_at);

  return (
    <>
      <View style={localStyles.sectionWrapper}>
        <View style={[localStyles.section, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
          <Svg style={localStyles.gradientOverlay}>
            <Defs>
              <SvgRadialGradient id="grad" cx="50%" cy="60%" r="60%">
                <Stop offset="70%" stopColor={Colors[colorScheme].background} stopOpacity="1" />
                <Stop offset="100%" stopColor={Colors[colorScheme].card} stopOpacity="1" />
              </SvgRadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
          </Svg>
        <Text style={[sharedStyles.label, { color: Colors[colorScheme].icon }]}>{t('reports')}</Text>
        
        <View style={localStyles.reportCardWrapper}>
          <TouchableOpacity
            style={[localStyles.reportCard, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
            onPress={() => navigate(() => router.push({
              pathname: '/report-details',
              params: latestReport,
            }))}
            disabled={isNavigating}
          >
            <Text style={[localStyles.reportDescription, { color: Colors[colorScheme].text }]}>
              {latestReport.description}
            </Text>
            <Text style={[localStyles.reportDate, { color: Colors[colorScheme].icon }]}>
              {new Date(latestReport.created_at).toLocaleString()}
            </Text>
            {isLatestToday && (
              <Animated.View style={[localStyles.iconWrapper, { transform: [{ scale: scaleAnim }] }]}>
                <MaterialIcons name="check-circle" size={32} color="#22c55e" />
              </Animated.View>
            )}
          </TouchableOpacity>
          {isLatestToday && (
            <LinearGradient
              colors={['transparent', 'rgba(34, 197, 94, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              locations={[0.3, 1]}
              style={localStyles.cardGradient}
            />
          )}
        </View>

        {reports.length > 1 && (
          <TouchableOpacity
            style={[localStyles.showAllButton, { backgroundColor: Colors[colorScheme].tint }]}
            onPress={() => navigate(() => router.push('/device-reports?deviceId=' + deviceId))}
            disabled={isNavigating}
          >
            <Text style={localStyles.showAllButtonText}>
              {t('showAllReports')} ({reports.length})
            </Text>
          </TouchableOpacity>
        )}
          </View>
      </View>
    </>
  );
}

const localStyles = StyleSheet.create({
  sectionWrapper: {
    marginBottom: 20,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  iconWrapper: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIconWrapper: {
    position: 'absolute',
    right: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 12,
    pointerEvents: 'none',
  },
  reportCardWrapper: {
    position: 'relative',
    marginTop: 12,
  },
  reportCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  reportDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  reportDate: {
    fontSize: 13,
  },

  showAllButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  showAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  listContent: {
    padding: 24,
    paddingBottom: 40,
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  reportCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
});
