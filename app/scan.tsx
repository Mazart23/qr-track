import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, ScrollView, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { checkQRExists, addDevice, addReport, checkDeviceNameExists, checkSerialNumberExists } from '@/lib/database';
import { useMachineTypes } from '@/contexts/machine-types-context';
import { pickAndProcessImage } from '@/lib/image-helper';

export default function ScanScreen() {
  const { t } = useTranslation();
  const { machineTypes } = useMachineTypes();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [qrData, setQrData] = useState('');
  const [isNewDevice, setIsNewDevice] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [machineTypeId, setMachineTypeId] = useState<number | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [reportDescription, setReportDescription] = useState('');
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [deviceImage, setDeviceImage] = useState<string | undefined>(undefined);
  const [deviceImageThumbnail, setDeviceImageThumbnail] = useState<string | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    })();
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{t('cameraPermissionRequired')}</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>{t('grantPermission')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setQrData(data);

    const device = await checkQRExists(data);
    if (device) {
      setIsNewDevice(false);
      setDeviceId(device.id);
    } else {
      setIsNewDevice(true);
    }
  };

  const handleDeviceSubmit = async () => {
    const trimmedName = deviceName?.trim() || '';
    const trimmedSerial = serialNumber?.trim() || '';

    if (trimmedName) {
      const nameExists = await checkDeviceNameExists(trimmedName);
      if (nameExists) {
        Alert.alert(t('error'), t('deviceNameExists'));
        return;
      }
    }

    if (trimmedSerial) {
      const serialExists = await checkSerialNumberExists(trimmedSerial);
      if (serialExists) {
        Alert.alert(t('error'), t('serialNumberExists'));
        return;
      }
    }

    try {
      await addDevice(qrData, trimmedName, machineTypeId || 0, trimmedSerial, location?.latitude, location?.longitude, deviceImage, deviceImageThumbnail);
      Alert.alert(t('success'), t('deviceAddedSuccessfully'));
      router.back();
    } catch (error) {
      Alert.alert(t('error'), t('failedToAddDevice'));
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await pickAndProcessImage();
      if (result) {
        setDeviceImage(result.image);
        setDeviceImageThumbnail(result.thumbnail);
      }
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('invalidImageAspectRatio'));
    }
  };

  const handleReportSubmit = async () => {
    if (!reportDescription.trim()) {
      Alert.alert(t('error'), t('enterReportDescription'));
      return;
    }

    try {
      await addReport(deviceId!, reportDescription);
      Alert.alert(t('success'), t('reportAddedSuccessfully'));
      router.back();
    } catch (error) {
      Alert.alert(t('error'), t('failedToAddReport'));
    }
  };

  if (scanned && isNewDevice) {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.title}>{t('addNewDevice')}</Text>
        <ScrollView>
          {deviceImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: deviceImage }} style={styles.deviceImage} resizeMode="contain" />
              <TouchableOpacity style={styles.changeImageButton} onPress={handlePickImage}>
                <Text style={styles.changeImageText}>{t('changeImage')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addImageButton} onPress={handlePickImage}>
              <MaterialIcons name="add-photo-alternate" size={48} color="#64748b" />
              <Text style={styles.addImageText}>{t('addImage')}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('qrCode')}</Text>
            <Text style={styles.qrValue}>{qrData}</Text>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('deviceName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('deviceName')}
              value={deviceName}
              onChangeText={setDeviceName}
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('serialNumber')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('serialNumber')}
              value={serialNumber}
              onChangeText={setSerialNumber}
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('machineType')}</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowTypePicker(true)}
            >
              <Text style={{ color: machineTypeId ? '#212529' : '#999' }}>
                {machineTypeId ? machineTypes.find(t => t.id === machineTypeId)?.name : t('selectMachineType')}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleDeviceSubmit}>
            <Text style={styles.buttonText}>{t('addDevice')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal visible={showTypePicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('selectMachineType')}</Text>
              <ScrollView style={styles.pickerScroll}>
                {machineTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.pickerItem, type.id === machineTypeId && { backgroundColor: '#4338ca' }]}
                    onPress={() => {
                      setMachineTypeId(type.id);
                      setShowTypePicker(false);
                    }}
                  >
                    <View style={styles.pickerItemContent}>
                      {type.color && type.icon && (
                        <View style={[styles.typePreview, { backgroundColor: type.color }]}>
                          <MaterialIcons name={type.icon as any} size={20} color="#fff" />
                        </View>
                      )}
                      <Text style={[styles.pickerItemText, type.id === machineTypeId && { color: '#fff', fontWeight: '700' }]}>
                        {type.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowTypePicker(false)}>
                <Text style={styles.modalCloseText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (scanned && !isNewDevice) {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.title}>{t('addReport')}</Text>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('machine')}</Text>
          <Text style={styles.qrValue}>{qrData}</Text>
        </View>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('reportDescription')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('reportDescription')}
            value={reportDescription}
            onChangeText={setReportDescription}
            multiline
            numberOfLines={4}
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={handleReportSubmit}>
          <Text style={styles.buttonText}>{t('submitReport')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>{t('cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned}
      />
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeText}>{t('close')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  imageContainer: {
    marginBottom: 24,
  },
  deviceImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  changeImageButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#4338ca',
    borderRadius: 8,
    alignItems: 'center',
  },
  changeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addImageButton: {
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  addImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginTop: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
    color: '#212529',
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 10,
  },
  qrValue: {
    fontSize: 16,
    color: '#495057',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#4338ca',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(67, 56, 202, 0.3)',
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelText: {
    color: '#4338ca',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
  },
  message: {
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#dee2e6',
  },
  pickerScroll: {
    maxHeight: 400,
  },
  pickerItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
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
    color: '#212529',
  },
  modalCloseButton: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4338ca',
    textAlign: 'center',
  },
});
