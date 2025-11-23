import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { saveLanguage } from '@/lib/i18n';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/contexts/theme-context';
import { Colors } from '@/constants/theme';
import { getReportInterval, setReportInterval } from '@/lib/settings';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { theme: currentTheme, setTheme } = useTheme();
  const [reportInterval, setReportIntervalState] = useState(7);
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const interval = await getReportInterval();
    setReportIntervalState(interval);
  };

  const handleIntervalChange = async (days: number) => {
    await setReportInterval(days);
    setReportIntervalState(days);
  };

  const changeLanguage = async (lang: string) => {
    await saveLanguage(lang);
  };

  const changeTheme = (theme: 'light' | 'dark') => {
    setTheme(theme);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.label, { color: Colors[colorScheme].text }]}>{t('reportInterval')}</Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
        onPress={() => setShowIntervalPicker(true)}
      >
        <Text style={styles.flag}>📅</Text>
        <Text style={[styles.buttonText, { color: Colors[colorScheme].text }]}>
          {reportInterval} {t(reportInterval === 1 ? 'day' : 'days')}
        </Text>
      </TouchableOpacity>

      <Modal visible={showIntervalPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].card }]}>
            <Text style={[styles.modalTitle, { color: Colors[colorScheme].text, borderBottomColor: Colors[colorScheme].border }]}>{t('reportInterval')}</Text>
            <ScrollView style={styles.pickerScroll}>
              {[1, 7, 14, 30, 60, 90, 120, 180, 365].map((days) => {
                const getLabel = () => {
                  if (days === 1) return `1 ${t('day')}`;
                  if (days < 30) return `${days} ${t('days')}`;
                  return t(`interval${days}`);
                };
                return (
                  <TouchableOpacity
                    key={days}
                    style={[styles.pickerItem, { borderBottomColor: Colors[colorScheme].border }, days === reportInterval && { backgroundColor: Colors[colorScheme].tint }]}
                    onPress={() => {
                      handleIntervalChange(days);
                      setShowIntervalPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, { color: Colors[colorScheme].icon }, days === reportInterval && { color: '#fff', fontWeight: '700' }]}>
                      {getLabel()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={[styles.modalCloseButton, { borderTopColor: Colors[colorScheme].border }]} onPress={() => setShowIntervalPicker(false)}>
              <Text style={[styles.modalCloseText, { color: Colors[colorScheme].tint }]}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text style={[styles.label, { color: Colors[colorScheme].text, marginTop: 30 }]}>{t('language')}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.buttonHalf, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }, i18n.language === 'en' && styles.activeButton]}
          onPress={() => changeLanguage('en')}
        >
          <Text style={styles.flag}>🇬🇧</Text>
          <Text style={[styles.buttonText, { color: Colors[colorScheme].text }, i18n.language === 'en' && styles.activeText]}>
            {t('english')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonHalf, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }, i18n.language === 'pl' && styles.activeButton]}
          onPress={() => changeLanguage('pl')}
        >
          <Text style={styles.flag}>🇵🇱</Text>
          <Text style={[styles.buttonText, { color: Colors[colorScheme].text }, i18n.language === 'pl' && styles.activeText]}>
            {t('polish')}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { color: Colors[colorScheme].text, marginTop: 30 }]}>{t('theme')}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.buttonHalf, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }, currentTheme === 'light' && styles.activeButton]}
          onPress={() => changeTheme('light')}
        >
          <Text style={styles.flag}>☀️</Text>
          <Text style={[styles.buttonText, { color: Colors[colorScheme].text }, currentTheme === 'light' && styles.activeText]}>
            {t('lightMode')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonHalf, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }, currentTheme === 'dark' && styles.activeButton]}
          onPress={() => changeTheme('dark')}
        >
          <Text style={styles.flag}>🌙</Text>
          <Text style={[styles.buttonText, { color: Colors[colorScheme].text }, currentTheme === 'dark' && styles.activeText]}>
            {t('darkMode')}
          </Text>
        </TouchableOpacity>
      </View>

      {__DEV__ && (
        <>
          <Text style={[styles.label, { color: Colors[colorScheme].text, marginTop: 30 }]}>Developer</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
            onPress={() => router.push('/test-data')}
          >
            <Text style={styles.flag}>🧪</Text>
            <Text style={[styles.buttonText, { color: Colors[colorScheme].text }]}>Test Data</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 50,
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    gap: 16,
    elevation: 2,
    borderWidth: 2,
  },
  buttonHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 16,
    elevation: 2,
    borderWidth: 2,
  },
  flag: {
    fontSize: 32,
  },
  activeButton: {
    backgroundColor: '#4338ca',
    borderColor: '#4338ca',
    boxShadow: '0px 4px 12px rgba(67, 56, 202, 0.3)',
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '500',
  },
  activeText: {
    color: '#fff',
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
});
