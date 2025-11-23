import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { checkQRExistsExcluding, updateDeviceQRCode } from '@/lib/database';

export default function ScanQREditScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { deviceId } = params;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

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

    const existingDevice = await checkQRExistsExcluding(data, Number(deviceId));
    if (existingDevice) {
      Alert.alert(t('error'), t('qrCodeAlreadyAssigned'), [
        { text: t('cancel'), onPress: () => router.back() },
      ]);
      return;
    }

    await updateDeviceQRCode(Number(deviceId), data);
    Alert.alert(t('success'), t('qrCodeUpdated'));
    router.back();
  };

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
    color: '#fff',
  },
  button: {
    backgroundColor: '#4338ca',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
