import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal, Button } from 'react-native';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';

interface DateRangePickerProps {
  label: string;
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  colorScheme: 'light' | 'dark';
}

export default function DateRangePicker({ label, startDate, endDate, onStartDateChange, onEndDateChange, colorScheme }: DateRangePickerProps) {
  const { t } = useTranslation();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: Colors[colorScheme].text }]}>{label}</Text>
      
      <View style={styles.row}>
        <View style={styles.dateContainer}>
          <Text style={[styles.dateLabel, { color: Colors[colorScheme].icon }]}>{t('from')}</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }]}
            onPress={() => {
              setTempStartDate(startDate);
              setShowStartPicker(true);
            }}
          >
            <Text style={[styles.dateText, { color: Colors[colorScheme].text }]}>
              {startDate ? startDate.toLocaleDateString() : t('selectDate')}
            </Text>
          </TouchableOpacity>
          {startDate && (
            <TouchableOpacity onPress={() => onStartDateChange(null)} style={styles.clearButton}>
              <Text style={[styles.clearText, { color: Colors[colorScheme].tint }]}>{t('clear')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.dateContainer}>
          <Text style={[styles.dateLabel, { color: Colors[colorScheme].icon }]}>{t('to')}</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }]}
            onPress={() => {
              setTempEndDate(endDate);
              setShowEndPicker(true);
            }}
          >
            <Text style={[styles.dateText, { color: Colors[colorScheme].text }]}>
              {endDate ? endDate.toLocaleDateString() : t('selectDate')}
            </Text>
          </TouchableOpacity>
          {endDate && (
            <TouchableOpacity onPress={() => onEndDateChange(null)} style={styles.clearButton}>
              <Text style={[styles.clearText, { color: Colors[colorScheme].tint }]}>{t('clear')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {Platform.OS === 'android' && showStartPicker && (
        <DateTimePicker
          value={tempStartDate || new Date()}
          mode="date"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (event.type === 'set' && date) {
              onStartDateChange(date);
            }
          }}
        />
      )}

      {Platform.OS === 'android' && showEndPicker && (
        <DateTimePicker
          value={tempEndDate || new Date()}
          mode="date"
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (event.type === 'set' && date) {
              onEndDateChange(date);
            }
          }}
        />
      )}
      
      {Platform.OS === 'ios' && (
        <Modal visible={showStartPicker || showEndPicker} transparent animationType="slide">
          <View style={styles.iosModalOverlay}>
            <View style={[styles.iosModalContent, { backgroundColor: Colors[colorScheme].card }]}>
              <DateTimePicker
                value={(showStartPicker ? tempStartDate : tempEndDate) || new Date()}
                mode="date"
                display="spinner"
                onChange={(event, date) => {
                  if (showStartPicker) {
                    setTempStartDate(date || tempStartDate);
                  } else {
                    setTempEndDate(date || tempEndDate);
                  }
                }}
              />
              <View style={styles.iosModalButtons}>
                <TouchableOpacity
                  style={[styles.iosModalButton, { borderColor: Colors[colorScheme].border }]}
                  onPress={() => {
                    setShowStartPicker(false);
                    setShowEndPicker(false);
                  }}
                >
                  <Text style={[styles.iosModalButtonText, { color: Colors[colorScheme].text }]}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iosModalButton, { backgroundColor: Colors[colorScheme].tint }]}
                  onPress={() => {
                    if (showStartPicker && tempStartDate) {
                      onStartDateChange(tempStartDate);
                    } else if (showEndPicker && tempEndDate) {
                      onEndDateChange(tempEndDate);
                    }
                    setShowStartPicker(false);
                    setShowEndPicker(false);
                  }}
                >
                  <Text style={[styles.iosModalButtonText, { color: '#fff' }]}>{t('apply')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  dateContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  dateButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  clearButton: {
    marginTop: 4,
    alignItems: 'center',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  iosModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  iosModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  iosModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  iosModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
