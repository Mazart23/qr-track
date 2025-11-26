import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';
import NoQRIcon from './NoQRIcon';

interface QRCodeSectionProps {
  qrCode: string;
  isEditing: boolean;
  colorScheme: 'light' | 'dark';
  onChangeQR: () => void;
  onRemoveQR: () => void;
  sharedStyles: any;
}

export default function QRCodeSection({ qrCode, isEditing, colorScheme, onChangeQR, onRemoveQR, sharedStyles }: QRCodeSectionProps) {
  const { t } = useTranslation();
  const hasQR = qrCode && qrCode.trim() !== '';

  return (
    <View style={localStyles.sectionWrapper}>
      <View style={[localStyles.sectionWithGradient, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
        <Text style={[sharedStyles.label, { color: Colors[colorScheme].icon }]}>{t('qrCode')}</Text>
        <Text style={[sharedStyles.value, { color: Colors[colorScheme].text }]}>{qrCode || t('noQRCode')}</Text>
        {isEditing && (
          <View style={localStyles.qrButtonRow}>
            <TouchableOpacity 
              style={[localStyles.smallButton, { backgroundColor: Colors[colorScheme].tint }]} 
              onPress={onChangeQR}
            >
              <Text style={localStyles.smallButtonText}>{hasQR ? t('change') : t('add')}</Text>
            </TouchableOpacity>
            {hasQR && (
              <TouchableOpacity 
                style={[localStyles.smallButton, sharedStyles.deleteButton]} 
                onPress={onRemoveQR}
              >
                <Text style={localStyles.smallButtonText}>{t('removeQRCode')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {!hasQR && (
          <View style={localStyles.iconWrapper}>
            <NoQRIcon />
          </View>
        )}
      </View>
      {!hasQR && (
        <LinearGradient
          colors={['transparent', 'rgba(239, 68, 68, 0.15)']}
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
  qrButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  smallButton: {
    flex: 1,
    maxWidth: '50%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 14,
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
