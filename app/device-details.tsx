import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Image } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import AnimatedStatusIcon from '@/components/animated-status-icon';
import { getLastReport, updateDevice, deleteDevice, getDeviceReportsCount, checkDeviceNameExists, checkSerialNumberExists, updateDeviceQRCode, getDeviceById, getDeviceReports } from '@/lib/database';
import { useMachineTypes } from '@/contexts/machine-types-context';
import { useNavigation } from '@/contexts/navigation-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { getReportInterval } from '@/lib/settings';
import { pickAndProcessImage } from '@/lib/image-helper';
import ImageSection from '@/components/device-details/ImageSection';
import QRCodeSection from '@/components/device-details/QRCodeSection';
import LastReportSection from '@/components/device-details/LastReportSection';
import ReportsSection from '@/components/device-details/ReportsSection';

export default function DeviceDetailsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { navigate, isNavigating } = useNavigation();
  const { machineTypes, getMachineTypeById } = useMachineTypes();
  const params = useLocalSearchParams();
  const { id } = params;
  const [device, setDevice] = useState<any>({
    name: params.name || '',
    qr_code: params.qr_code || '',
    serial_number: params.serial_number || '',
    machine_type_id: params.machine_type_id || 0,
    created_at: params.created_at || '',
    updated_at: params.updated_at || '',
    latitude: params.latitude,
    longitude: params.longitude,
  });
  const [lastReportDate, setLastReportDate] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<'none' | 'today' | 'overdue' | 'no-report'>('none');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(String(params.name || ''));
  const [editedSerialNumber, setEditedSerialNumber] = useState(String(params.serial_number || ''));
  const [editedMachineTypeId, setEditedMachineTypeId] = useState(Number(params.machine_type_id) || 0);
  const [machineTypeName, setMachineTypeName] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [editedImage, setEditedImage] = useState<string | undefined>(undefined);
  const [editedImageThumbnail, setEditedImageThumbnail] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (device.machine_type_id) {
      const type = getMachineTypeById(Number(device.machine_type_id));
      setMachineTypeName(type?.name || '');
    }
  }, [device.machine_type_id, getMachineTypeById]);

  useFocusEffect(
    useCallback(() => {
      const loadDeviceData = async () => {
        const deviceData = await getDeviceById(Number(id));
        if (deviceData) {
          setDevice(deviceData);
        }
      };
      loadDeviceData();
    }, [id])
  );

  useEffect(() => {
    const loadLastReport = async () => {
      const report = await getLastReport(Number(id));
      setLastReportDate(report?.created_at || null);
      
      const interval = await getReportInterval();
      let status: 'none' | 'today' | 'overdue' | 'no-report' = 'none';
      
      if (report) {
        const lastReportDate = new Date(report.created_at);
        const now = new Date();
        
        const isSameDay = lastReportDate.toDateString() === now.toDateString();
        
        const daysDiff = Math.floor((now.getTime() - lastReportDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (isSameDay) {
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
    if (editedName && !editedName.trim()) {
      Alert.alert(t('error'), t('enterDeviceName'));
      return;
    }

    if (editedName && device.name && editedName.trim().toLowerCase() !== device.name.trim().toLowerCase()) {
      const nameExists = await checkDeviceNameExists(editedName.trim(), Number(id));
      if (nameExists) {
        Alert.alert(t('error'), t('deviceNameExists'));
        return;
      }
    }

    if (editedSerialNumber && device.serial_number && editedSerialNumber.trim().toLowerCase() !== device.serial_number.trim().toLowerCase()) {
      const serialExists = await checkSerialNumberExists(editedSerialNumber.trim(), Number(id));
      if (serialExists) {
        Alert.alert(t('error'), t('serialNumberExists'));
        return;
      }
    }

    await updateDevice(
      Number(id), 
      editedName?.trim() || device.name, 
      editedMachineTypeId || device.machine_type_id, 
      editedSerialNumber?.trim() || device.serial_number,
      editedImage,
      editedImageThumbnail
    );
    
    const updatedDevice = {
      ...device,
      name: editedName?.trim() || device.name,
      serial_number: editedSerialNumber?.trim() || device.serial_number,
      machine_type_id: editedMachineTypeId || device.machine_type_id,
      image: editedImage !== undefined ? editedImage : device.image,
      image_thumbnail: editedImageThumbnail !== undefined ? editedImageThumbnail : device.image_thumbnail,
      updated_at: new Date().toISOString(),
    };
    setDevice(updatedDevice);
    
    const type = getMachineTypeById(editedMachineTypeId || device.machine_type_id);
    setMachineTypeName(type?.name || '');
    
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

  const handleRemoveQR = async () => {
    Alert.alert(t('confirmDelete'), t('confirmRemoveQRCode'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await updateDeviceQRCode(Number(id), null);
          setDevice({ ...device, qr_code: '' });
          Alert.alert(t('success'), t('qrCodeRemoved'));
        },
      },
    ]);
  };

  const handlePickImage = async () => {
    try {
      const result = await pickAndProcessImage();
      if (result) {
        setEditedImage(result.image);
        setEditedImageThumbnail(result.thumbnail);
      }
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('invalidImageAspectRatio'));
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(t('confirmDelete'), t('confirmRemoveImage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          setEditedImage('');
          setEditedImageThumbnail('');
        },
      },
    ]);
  };

  const hasQR = device.qr_code && device.qr_code.trim() !== '';
  const hasImage = device.image || editedImage;
  const displayImage = editedImage !== undefined ? editedImage : device.image;

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} contentContainerStyle={styles.contentContainer}>
      <ImageSection 
        displayImage={displayImage}
        isEditing={isEditing}
        colorScheme={colorScheme}
        onPickImage={handlePickImage}
        onRemoveImage={handleRemoveImage}
        sharedStyles={styles}
      />
      
      <View style={[styles.section, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
        <Text style={[styles.label, { color: Colors[colorScheme].icon }]}>{t('deviceName')}</Text>
        {isEditing ? (
          <TextInput
            style={[styles.input, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]}
            value={editedName}
            onChangeText={setEditedName}
          />
        ) : (
          <Text style={[styles.value, { color: Colors[colorScheme].text }]}>{device.name || '-'}</Text>
        )}
      </View>
      
      <View style={[styles.section, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
        <Text style={[styles.label, { color: Colors[colorScheme].icon }]}>{t('serialNumber')}</Text>
        {isEditing ? (
          <TextInput
            style={[styles.input, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]}
            value={editedSerialNumber}
            onChangeText={setEditedSerialNumber}
          />
        ) : (
          <Text style={[styles.value, { color: Colors[colorScheme].text }]}>{device.serial_number || '-'}</Text>
        )}
      </View>
      
      <View style={[styles.section, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
        <Text style={[styles.label, { color: Colors[colorScheme].icon }]}>{t('machineType')}</Text>
        {isEditing ? (
          <TouchableOpacity
            style={[styles.input, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }]}
            onPress={() => setShowTypePicker(true)}
          >
            <Text style={[styles.value, { color: Colors[colorScheme].text }]}>
              {machineTypes.find(t => t.id === editedMachineTypeId)?.name || t('selectMachineType')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.machineTypeRow}>
            {(() => {
              const type = getMachineTypeById(device.machine_type_id);
              return type?.color && type?.icon ? (
                <View style={[styles.typePreview, { backgroundColor: type.color }]}>
                  <MaterialIcons name={type.icon as any} size={20} color="#fff" />
                </View>
              ) : null;
            })()}
            <Text style={[styles.value, { color: Colors[colorScheme].text }]}>{machineTypeName || '-'}</Text>
          </View>
        )}
      </View>
      
      {!isEditing && (
        <>
          <LastReportSection
            lastReportDate={lastReportDate}
            reportStatus={reportStatus}
            colorScheme={colorScheme}
            sharedStyles={styles}
          />
          
          <ReportsSection
            deviceId={Number(id)}
            colorScheme={colorScheme}
            sharedStyles={styles}
            getDeviceReports={getDeviceReports}
          />
        </>
      )}
      <QRCodeSection
        qrCode={device.qr_code}
        isEditing={isEditing}
        colorScheme={colorScheme}
        onChangeQR={() => navigate(() => router.push({ pathname: '/scan-qr-edit', params: { deviceId: id } }))}
        onRemoveQR={handleRemoveQR}
        sharedStyles={styles}
      />
      {!isEditing && (
        <>
          <View style={[styles.section, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
            <Text style={[styles.label, { color: Colors[colorScheme].icon }]}>{t('createdAt')}</Text>
            <Text style={[styles.value, { color: Colors[colorScheme].text }]}>
              {device.created_at ? new Date(device.created_at).toLocaleString() : '-'}
            </Text>
          </View>
          
          {device.updated_at && device.updated_at !== device.created_at && (
            <View style={[styles.section, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
              <Text style={[styles.label, { color: Colors[colorScheme].icon }]}>{t('updatedAt')}</Text>
              <Text style={[styles.value, { color: Colors[colorScheme].text }]}>
                {new Date(device.updated_at).toLocaleString()}
              </Text>
            </View>
          )}
        </>
      )}

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

      <Modal visible={showTypePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].card }]}>
            <Text style={[styles.modalTitle, { color: Colors[colorScheme].text, borderBottomColor: Colors[colorScheme].border }]}>{t('selectMachineType')}</Text>
            <ScrollView style={styles.pickerScroll}>
              {machineTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.pickerItem, { borderBottomColor: Colors[colorScheme].border }, type.id === editedMachineTypeId && { backgroundColor: Colors[colorScheme].tint }]}
                  onPress={() => {
                    setEditedMachineTypeId(type.id);
                    setShowTypePicker(false);
                  }}
                >
                  <View style={styles.pickerItemContent}>
                    {type.color && type.icon && (
                      <View style={[styles.typePreview, { backgroundColor: type.color }]}>
                        <MaterialIcons name={type.icon as any} size={20} color="#fff" />
                      </View>
                    )}
                    <Text style={[styles.pickerItemText, { color: Colors[colorScheme].icon }, type.id === editedMachineTypeId && { color: '#fff', fontWeight: '700' }]}>
                      {type.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.modalCloseButton, { borderTopColor: Colors[colorScheme].border }]} onPress={() => setShowTypePicker(false)}>
              <Text style={[styles.modalCloseText, { color: Colors[colorScheme].tint }]}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  contentContainer: {
    paddingBottom: 50,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    marginBottom: 20,
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
  machineTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    padding: 20,
    textAlign: 'center',
    borderBottomWidth: 1,
  },
  pickerScroll: {
    maxHeight: 400,
  },
  pickerItem: {
    padding: 20,
    borderBottomWidth: 1,
  },
  pickerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  typePreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 18,
  },
  modalCloseButton: {
    padding: 20,
    borderTopWidth: 1,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
