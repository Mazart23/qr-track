import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { checkQRExists, addDevice, addReport, checkDeviceNameExists } from '@/lib/database';

export default function ScanScreen() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [qrData, setQrData] = useState('');
  const [isNewDevice, setIsNewDevice] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
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

  /**
   * Handle QR code scan
   */
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

  /**
   * Submit new device
   */
  const handleDeviceSubmit = async () => {
    if (!deviceName.trim()) {
      Alert.alert(t('error'), t('enterDeviceName'));
      return;
    }

    const trimmedName = deviceName.trim();
    const nameExists = await checkDeviceNameExists(trimmedName);
    if (nameExists) {
      Alert.alert(t('error'), t('deviceNameExists'));
      return;
    }

    try {
      await addDevice(qrData, trimmedName, location?.latitude, location?.longitude);
      Alert.alert(t('success'), t('deviceAddedSuccessfully'));
      router.back();
    } catch (error) {
      Alert.alert(t('error'), t('failedToAddDevice'));
    }
  };

  /**
   * Submit new report
   */
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
        <TouchableOpacity style={styles.button} onPress={handleDeviceSubmit}>
          <Text style={styles.buttonText}>{t('addDevice')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>{t('cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (scanned && !isNewDevice) {
    const getDeviceName = async () => {
      const device = await checkQRExists(qrData);
      return device;
    };
    
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
    justifyContent: 'center',
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
});
