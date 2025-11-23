import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { addMachineType, updateMachineType, deleteMachineType, getDeviceCountByType, checkMachineTypeExists } from '@/lib/database';
import { useMachineTypes } from '@/contexts/machine-types-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#84cc16', '#a855f7'];
const ICONS = ['build', 'construction', 'precision-manufacturing', 'factory', 'agriculture', 'local-shipping', 'engineering', 'handyman', 'plumbing'];

export default function MachineTypesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { machineTypes: types, refreshMachineTypes } = useMachineTypes();
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [typeName, setTypeName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);

  useFocusEffect(() => {
    refreshMachineTypes();
  });

  const handleAdd = () => {
    setEditingType(null);
    setTypeName('');
    setSelectedColor(COLORS[0]);
    setSelectedIcon(ICONS[0]);
    setShowModal(true);
  };

  const handleEdit = async (type: any) => {
    const count = await getDeviceCountByType(type.id);
    if (count > 0) {
      Alert.alert(
        t('edit'),
        t(count === 1 ? 'confirmEditTypeWithMachines_one' : 'confirmEditTypeWithMachines_other', { count }),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('edit'),
            onPress: () => {
              setEditingType(type);
              setTypeName(type.name);
              setSelectedColor(type.color || COLORS[0]);
              setSelectedIcon(type.icon || ICONS[0]);
              setShowModal(true);
            },
          },
        ]
      );
    } else {
      setEditingType(type);
      setTypeName(type.name);
      setSelectedColor(type.color || COLORS[0]);
      setSelectedIcon(type.icon || ICONS[0]);
      setShowModal(true);
    }
  };

  const handleDelete = async (type: any) => {
    const count = await getDeviceCountByType(type.id);
    const message = count > 0
      ? t(count === 1 ? 'confirmDeleteTypeWithMachines_one' : 'confirmDeleteTypeWithMachines_other', { count })
      : t('confirmDeleteType');

    Alert.alert(t('confirmDelete'), message, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteMachineType(type.id);
          Alert.alert(t('success'), t('machineTypeDeleted'));
          refreshMachineTypes();
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!typeName.trim()) {
      Alert.alert(t('error'), t('enterMachineTypeName'));
      return;
    }

    const exists = await checkMachineTypeExists(typeName.trim(), editingType?.id);
    if (exists) {
      Alert.alert(t('error'), t('machineTypeExists'));
      return;
    }

    if (editingType) {
      await updateMachineType(editingType.id, typeName.trim(), selectedColor, selectedIcon);
      Alert.alert(t('success'), t('machineTypeUpdated'));
    } else {
      await addMachineType(typeName.trim(), selectedColor, selectedIcon);
      Alert.alert(t('success'), t('machineTypeAdded'));
    }

    setShowModal(false);
    refreshMachineTypes();
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <FlatList
        data={types}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
            {item.color && item.icon && (
              <View style={[styles.typePreview, { backgroundColor: item.color }]}>
                <MaterialIcons name={item.icon} size={20} color="#fff" />
              </View>
            )}
            <Text style={[styles.itemName, { color: Colors[colorScheme].text }]}>{item.name}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.iconButton, { backgroundColor: Colors[colorScheme].tint }]} onPress={() => handleEdit(item)}>
                <Text style={styles.iconButtonText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, styles.deleteButton]} onPress={() => handleDelete(item)}>
                <Text style={styles.iconButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: Colors[colorScheme].icon }]}>{t('noMachineTypes')}</Text>
        }
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: Colors[colorScheme].tint }]} onPress={handleAdd}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].card }]}>
            <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>
              {editingType ? t('editMachineType') : t('addMachineType')}
            </Text>
            <ScrollView style={styles.modalScroll}>
              <TextInput
                style={[styles.input, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text }]}
                placeholder={t('machineTypeName')}
                value={typeName}
                onChangeText={setTypeName}
              />
              <Text style={[styles.sectionLabel, { color: Colors[colorScheme].text }]}>{t('color')}</Text>
              <View style={styles.colorGrid}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorDotWrapper, selectedColor === color && styles.colorDotSelected]}
                    onPress={() => setSelectedColor(color)}
                  >
                    <View style={[styles.colorDot, { backgroundColor: color }]} />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.sectionLabel, { color: Colors[colorScheme].text }]}>{t('icon')}</Text>
              <View style={styles.iconGrid}>
                {ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[styles.iconBox, { borderColor: selectedIcon === icon ? Colors[colorScheme].tint : Colors[colorScheme].border, backgroundColor: Colors[colorScheme].background }]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <MaterialIcons name={icon as any} size={28} color={Colors[colorScheme].text} />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]} onPress={handleSave}>
                <Text style={styles.buttonText}>{t('save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setShowModal(false)}>
                <Text style={styles.buttonText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  item: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typePreview: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  iconButtonText: {
    fontSize: 18,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  colorDotWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: '#000',
  },
  colorDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
