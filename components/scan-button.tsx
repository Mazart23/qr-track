import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ScanButton() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={() => router.push('/scan')}
    >
      <Text style={styles.text}>{t('scanQRCode')}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 130,
    right: 20,
    backgroundColor: '#4338ca',
    paddingHorizontal: 28,
    paddingVertical: 20,
    borderRadius: 30,
    boxShadow: '0px 6px 20px rgba(67, 56, 202, 0.4)',
    elevation: 8,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
});
