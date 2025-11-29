import { View, Text, StyleSheet } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';

interface NumberRangePickerProps {
  label: string;
  min: number | null;
  max: number | null;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
  colorScheme: 'light' | 'dark';
  minLimit?: number;
  maxLimit?: number;
}

export default function NumberRangePicker({ label, min, max, onMinChange, onMaxChange, colorScheme, minLimit, maxLimit }: NumberRangePickerProps) {
  const { t } = useTranslation();

  const effectiveMin = min ?? minLimit ?? 0;
  const effectiveMax = max ?? maxLimit ?? 100;
  const rangeMin = minLimit ?? 0;
  const rangeMax = maxLimit ?? 100;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: Colors[colorScheme].text }]}>{label}</Text>
      
      <View style={styles.valuesRow}>
        <Text style={[styles.valueText, { color: Colors[colorScheme].text }]}>
          {t('from')}: {effectiveMin}
        </Text>
        <Text style={[styles.valueText, { color: Colors[colorScheme].text }]}>
          {t('to')}: {effectiveMax}
        </Text>
      </View>
      
      <View style={styles.sliderContainer}>
        <MultiSlider
          values={[effectiveMin, effectiveMax]}
          min={rangeMin}
          max={rangeMax}
          step={1}
          onValuesChange={(values) => {
            onMinChange(values[0]);
            onMaxChange(values[1]);
          }}
          selectedStyle={{ backgroundColor: Colors[colorScheme].tint }}
          unselectedStyle={{ backgroundColor: Colors[colorScheme].border }}
          markerStyle={{ backgroundColor: Colors[colorScheme].tint, height: 24, width: 24 }}
          sliderLength={280}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  valuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sliderContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
});
