import { View, Text, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';

interface ImageSectionProps {
  displayImage: string;
  isEditing: boolean;
  colorScheme: 'light' | 'dark';
  onPickImage: () => void;
  onRemoveImage: () => void;
  sharedStyles: any;
}

export default function ImageSection({ displayImage, isEditing, colorScheme, onPickImage, onRemoveImage, sharedStyles }: ImageSectionProps) {
  const { t } = useTranslation();
  const [showFullImage, setShowFullImage] = useState(false);

  if (!displayImage && !isEditing) return null;

  if (!displayImage && isEditing) {
    return (
      <TouchableOpacity 
        style={[localStyles.addImageButton, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
        onPress={onPickImage}
      >
        <MaterialIcons name="add-photo-alternate" size={48} color={Colors[colorScheme].icon} />
        <Text style={[localStyles.addImageText, { color: Colors[colorScheme].text }]}>{t('addImage')}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <View style={[localStyles.imageSection, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
        <TouchableOpacity onPress={() => setShowFullImage(true)} activeOpacity={0.9}>
          <Image source={{ uri: displayImage }} style={localStyles.deviceImage} resizeMode="contain" />
        </TouchableOpacity>
        {isEditing && (
          <View style={localStyles.imageButtonRow}>
            <TouchableOpacity 
              style={[localStyles.smallButton, { backgroundColor: Colors[colorScheme].tint }]} 
              onPress={onPickImage}
            >
              <Text style={localStyles.smallButtonText}>{t('changeImage')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[localStyles.smallButton, sharedStyles.deleteButton]} 
              onPress={onRemoveImage}
            >
              <Text style={localStyles.smallButtonText}>{t('removeImage')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={showFullImage} transparent animationType="fade" onRequestClose={() => setShowFullImage(false)}>
        <View style={localStyles.fullImageOverlay}>
          <TouchableOpacity style={localStyles.fullImageClose} onPress={() => setShowFullImage(false)} activeOpacity={1}>
            <Image source={{ uri: displayImage }} style={localStyles.fullImage} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const localStyles = StyleSheet.create({
  imageSection: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    marginBottom: 20,
  },
  deviceImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
  },
  imageButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  addImageButton: {
    padding: 40,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: 16,
    fontWeight: '600',
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
  fullImageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageClose: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
