import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedStatusIcon from '@/components/animated-status-icon';
import { getLastReport, updateDevice, deleteDevice, getDeviceReportsCount, checkDeviceNameExists } from '@/lib/database';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { getReportInterval } from '@/lib/settings';

export default function DeviceDetailsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, name, qr_code, created_at, updated_at, latitude, longitude } = params;
  const [lastReportDate, setLastReportDate] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<'none' | 'today' | 'overdue' | 'no-report'>('none');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name as string);


  useEffect(() => {
    const loadLastReport = async () => {
      const report = await getLastReport(Number(id));
      setLastReportDate(report?.created_at || null);
      
      const interval = await getReportInterval();
      let status: 'none' | 'today' | 'overdue' | 'no-report' = 'none';
      
      if (report) {
        const lastReportDate = new Date(report.created_at);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - lastReportDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) {
          status = 'today';
        } else if (daysDiff > interval) {
          status = 'overdue';
        }
      } else {
        status = 'no-report';
      }
      
      setReportStatus(status);
    };
    loadLastReport();
  }, [id]);



  const handleSave = async () => {
    if (!editedName.trim()) {
      Alert.alert(t('error'), t('enterDeviceName'));
      return;
    }

    if (editedName.trim().toLowerCase() !== (name as string).trim().toLowerCase()) {
      const nameExists = await checkDeviceNameExists(editedName.trim());
      if (nameExists) {
        Alert.alert(t('error'), t('deviceNameExists'));
        return;
      }
    }

    await updateDevice(Number(id), editedName);
    Alert.alert(t('success'), t('deviceUpdated'));
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const reportsCount = await getDeviceReportsCount(Number(id));
    const message = reportsCount > 0 
      ? t('confirmDeleteDeviceWithReports', { count: reportsCount })
      : t('confirmDeleteDevice');
    
    Alert.alert(t('confirmDelete'), message, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteDevice(Number(id));
          Alert.alert(t('success'), t('deviceDeleted'));
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={[styles.section, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
        <Text style={[styles.label, { color: Colors[colorScheme].icon }]}>{t('deviceName')}</Text>
        {isEditing ? (
          <TextInput
            style={[styles.input, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]}
            value={editedName}
            onChangeText={setEditedName}
          />
        ) : (
          <Text style={[styles.value, { color: Colors[colorScheme].text }]}>{editedName}</Text>
        )}
      </View>
      
      <View style={[styles.section, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
        <Text style={[styles.label, { color: Colors[colorScheme].icon }]}>{t('qrCode')}</Text>
        <Text style={[styles.value, { color: Colors[colorScheme].text }]}>{qr_code}</Text>
      </View>
      
      <View style={[styles.section, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
        <Text style={[styles.label, { color: Colors[colorScheme].icon }]}>{t('createdAt')}</Text>
        <Text style={[styles.value, { color: Colors[colorScheme].text }]}>
          {new Date(created_at as string).toLocaleString()}
        </Text>
      </View>
      
      {updated_at && updated_at !== created_at && (
        <View style={[styles.section, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
          <Text style={[styles.label, { color: Colors[colorScheme].icon }]}>{t('updatedAt')}</Text>
          <Text style={[styles.value, { color: Colors[colorScheme].text }]}>
            {new Date(updated_at as string).toLocaleString()}
          </Text>
        </View>
      )}
      
      <View style={styles.sectionWrapper}>
        <View style={[styles.sectionWithGradient, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
          <Text style={[styles.label, { color: Colors[colorScheme].icon }]}>{t('lastReport')}</Text>
          <Text style={[styles.value, { color: Colors[colorScheme].text }]}>
            {lastReportDate ? new Date(lastReportDate).toLocaleString() : t('noReportsYetForDevice')}
          </Text>
          {reportStatus !== 'none' && (
            <View style={styles.iconWrapper}>
              <AnimatedStatusIcon status={reportStatus} size={40} />
            </View>
          )}
        </View>
        {reportStatus === 'today' && (
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.15)', 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.gradient}
          />
        )}
        {reportStatus === 'overdue' && (
          <LinearGradient
            colors={['rgba(249, 115, 22, 0.15)', 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.gradient}
          />
        )}
        {reportStatus === 'no-report' && (
          <LinearGradient
            colors={['rgba(234, 179, 8, 0.15)', 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.gradient}
          />
        )}
      </View>
      
      <View style={[styles.section, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
        <Text style={[styles.label, { color: Colors[colorScheme].icon }]}>{t('location')}</Text>
        <Text style={[styles.value, { color: Colors[colorScheme].text }]}>
          {latitude && longitude ? `${latitude}, ${longitude}` : t('noLocation')}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        {isEditing ? (
          <TouchableOpacity style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]} onPress={handleSave}>
            <Text style={styles.buttonText}>{t('save')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]} onPress={() => setIsEditing(true)}>
            <Text style={styles.buttonText}>{t('edit')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
          <Text style={styles.buttonText}>{t('delete')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionWrapper: {
    position: 'relative',
    marginBottom: 20,
    overflow: 'hidden',
    borderRadius: 16,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionWithGradient: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    overflow: 'hidden',
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
  input: {
    fontSize: 20,
    fontWeight: '600',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
