import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';
import AnimatedStatusIcon from '@/components/animated-status-icon';

interface LastReportSectionProps {
  lastReportDate: string | null;
  reportStatus: 'none' | 'today' | 'overdue' | 'no-report';
  colorScheme: 'light' | 'dark';
  sharedStyles: any;
}

export default function LastReportSection({ lastReportDate, reportStatus, colorScheme, sharedStyles }: LastReportSectionProps) {
  const { t } = useTranslation();

  return (
    <View style={localStyles.sectionWrapper}>
      <View style={[localStyles.sectionWithGradient, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
        <Text style={[sharedStyles.label, { color: Colors[colorScheme].icon }]}>{t('lastReportDate')}</Text>
        <Text style={[sharedStyles.value, { color: Colors[colorScheme].text }]}>
          {lastReportDate ? new Date(lastReportDate).toLocaleString() : t('noReportsYetForDevice')}
        </Text>
        {reportStatus !== 'none' && (
          <View style={localStyles.iconWrapper}>
            <AnimatedStatusIcon status={reportStatus} size={32} />
          </View>
        )}
      </View>
      {reportStatus === 'today' && (
        <LinearGradient
          colors={['transparent', 'rgba(34, 197, 94, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          locations={[0.3, 1]}
          style={localStyles.gradient}
        />
      )}
      {reportStatus === 'overdue' && (
        <LinearGradient
          colors={['transparent', 'rgba(249, 115, 22, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          locations={[0.3, 1]}
          style={localStyles.gradient}
        />
      )}
      {reportStatus === 'no-report' && (
        <LinearGradient
          colors={['transparent', 'rgba(234, 179, 8, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          locations={[0.3, 1]}
          style={localStyles.gradient}
        />
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  sectionWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  sectionWithGradient: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 20,
    fontWeight: '600',
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
});
