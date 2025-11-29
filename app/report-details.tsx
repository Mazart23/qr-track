import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { updateReport, deleteReport } from '@/lib/database';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function ReportDetailsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, device_name, description, created_at } = params;
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description as string);
  const [updatedAt, setUpdatedAt] = useState(params.updated_at as string | undefined);

  const handleSave = async () => {
    if (!editedDescription.trim()) {
      Alert.alert(t('error'), t('enterReportDescription'));
      return;
    }
    await updateReport(Number(id), editedDescription);
    setUpdatedAt(new Date().toISOString());
    Alert.alert(t('success'), t('reportUpdated'));
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(t('confirmDelete'), t('confirmDeleteReport'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteReport(Number(id));
          Alert.alert(t('success'), t('reportDeleted'));
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.section, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
        <Text style={[styles.label, { color: Colors[colorScheme].icon }]}>{t('machine')}</Text>
        <Text style={[styles.value, { color: Colors[colorScheme].text }]}>{device_name}</Text>
      </View>
      
      <View style={[styles.section, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
        <Text style={[styles.label, { color: Colors[colorScheme].icon }]}>{t('reportDescription')}</Text>
        {isEditing ? (
          <TextInput
            style={[styles.input, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]}
            value={editedDescription}
            onChangeText={setEditedDescription}
            multiline
            numberOfLines={4}
          />
        ) : (
          <Text style={[styles.value, { color: Colors[colorScheme].text }]}>{editedDescription || '-'}</Text>
        )}
      </View>
      
      <View style={[styles.section, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
        <Text style={[styles.label, { color: Colors[colorScheme].icon }]}>{t('createdAt')}</Text>
        <Text style={[styles.value, { color: Colors[colorScheme].text }]}>
          {new Date(created_at as string).toLocaleString()}
        </Text>
      </View>
      
      {!isEditing && updatedAt && updatedAt !== created_at && (
        <View style={[styles.section, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
          <Text style={[styles.label, { color: Colors[colorScheme].icon }]}>{t('updatedAt')}</Text>
          <Text style={[styles.value, { color: Colors[colorScheme].text }]}>
            {new Date(updatedAt).toLocaleString()}
          </Text>
        </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  contentContainer: {
    paddingBottom: 50,
  },
  section: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
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
    textAlignVertical: 'top',
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
