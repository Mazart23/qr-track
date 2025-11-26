import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, Platform, Modal, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode-generator';
import * as Sharing from 'expo-sharing';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function QRsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const [count, setCount] = useState('1');
  const [size, setSize] = useState('50');
  const [qrCodes, setQrCodes] = useState<string[]>([]);
  const [showCountPicker, setShowCountPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Generate QR codes based on count
   */
  const generateQRs = async () => {
    if (isGenerating) return;
    if (!count) {
      Alert.alert(t('error'), t('selectCount'));
      return;
    }
    if (!size) {
      Alert.alert(t('error'), t('selectSize'));
      return;
    }
    setIsGenerating(true);
    const num = parseInt(count);
    const qrSize = parseInt(size)

    const codes: string[] = [];
    for (let i = 0; i < num; i++) {
      const uniqueId = `QR-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`;
      codes.push(uniqueId);
    }
    setQrCodes(codes);
    await generateFile(codes, qrSize);
    setIsGenerating(false);
  };

  /**
   * Generate QR code SVG data URL
   */
  const generateQRDataURL = (text: string) => {
    const qr = QRCode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createDataURL(4);
  };

  /**
   * Generate HTML file with QR codes
   */
  const generateFile = async (codes: string[], qrSizeMM: number) => {
    try {
      let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { margin: 0; size: A4; }
    body { margin: 0; padding: 0; }
    .qr-container { display: flex; flex-wrap: wrap; }
    .qr-item { width: ${qrSizeMM}mm; height: ${qrSizeMM}mm; }
    .qr-item img { width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>
  <div class="qr-container">
`;
      
      codes.forEach(code => {
        const dataUrl = generateQRDataURL(code);
        htmlContent += `    <div class="qr-item"><img src="${dataUrl}" alt="${code}"/></div>\n`;
      });
      
      htmlContent += `  </div>
</body>
</html>`;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QR_Codes_${Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const FileSystem = require('expo-file-system/legacy');
        const fileName = `QR_Codes_${Date.now()}.html`;
        const fileUri = FileSystem.documentDirectory + fileName;
        
        await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/html',
            dialogTitle: t('generateQRCodes'),
          });
        }
      }
      
      Alert.alert(t('success'), t('fileGeneratedSuccessfully'));
    } catch (error: any) {
      console.error('File generation error:', error);
      Alert.alert(t('error'), error?.message || t('failedToGenerateFile'));
    }
  };

  const countOptions = [1, 5, 10, 20, 50, 100, 200, 500];
  const sizeOptions = [20, 30, 40, 50, 60, 70, 80, 90, 100];

  const renderPicker = (visible: boolean, onClose: () => void, options: number[], onSelect: (val: string) => void, title: string, currentValue: string) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].card }]}>
          <Text style={[styles.modalTitle, { color: Colors[colorScheme].text, borderBottomColor: Colors[colorScheme].border }]}>{title}</Text>
          <ScrollView style={styles.pickerScroll}>
            {options.map((opt) => {
              const isSelected = opt.toString() === currentValue;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pickerItem, { borderBottomColor: Colors[colorScheme].border }, isSelected && { backgroundColor: Colors[colorScheme].tint }]}
                  onPress={() => {
                    onSelect(opt.toString());
                    onClose();
                  }}
                >
                  <Text style={[styles.pickerItemText, { color: Colors[colorScheme].icon }, isSelected && { color: '#fff', fontWeight: '700' }]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={[styles.modalCloseButton, { borderTopColor: Colors[colorScheme].border }]} onPress={onClose}>
            <Text style={[styles.modalCloseText, { color: Colors[colorScheme].tint }]}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <Text style={[styles.inputLabel, { color: Colors[colorScheme].text }]}>{t('count')}</Text>
          {Platform.OS === 'android' ? (
            <TouchableOpacity style={[styles.input, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]} onPress={() => setShowCountPicker(true)}>
              <Text style={[styles.inputText, { color: Colors[colorScheme].text }]}>{count}</Text>
            </TouchableOpacity>
          ) : (
            <TextInput
              style={[styles.input, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]}
              placeholder={t('count')}
              keyboardType="numeric"
              value={count}
              onChangeText={setCount}
            />
          )}
        </View>
        <View style={styles.inputWrapper}>
          <Text style={[styles.inputLabel, { color: Colors[colorScheme].text }]}>{t('size')}</Text>
          {Platform.OS === 'android' ? (
            <TouchableOpacity style={[styles.input, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]} onPress={() => setShowSizePicker(true)}>
              <Text style={[styles.inputText, { color: Colors[colorScheme].text }]}>{size}</Text>
            </TouchableOpacity>
          ) : (
            <TextInput
              style={[styles.input, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]}
              placeholder={t('size')}
              keyboardType="numeric"
              value={size}
              onChangeText={setSize}
            />
          )}
        </View>
      </View>
      {renderPicker(showCountPicker, () => setShowCountPicker(false), countOptions, setCount, t('count'), count)}
      {renderPicker(showSizePicker, () => setShowSizePicker(false), sizeOptions, setSize, t('size'), size)}
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: Colors[colorScheme].tint, opacity: isGenerating ? 0.6 : 1 }]} 
        onPress={generateQRs}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>{t('generate')}</Text>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.qrContainer}>
        {qrCodes.map((code, index) => (
          <View key={index} style={[styles.qrItem, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
            <Image
              source={{ uri: generateQRDataURL(code) }}
              style={styles.qrImage}
            />
            <Text style={[styles.qrText, { color: Colors[colorScheme].icon }]}>{code}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
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
  pickerItemText: {
    fontSize: 18,
    textAlign: 'center',
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
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    boxShadow: '0px 4px 12px rgba(67, 56, 202, 0.3)',
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  qrContainer: {
    flex: 1,
  },
  qrItem: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrText: {
    marginTop: 12,
    fontSize: 13,
  },
});
