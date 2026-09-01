import { View, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

// กล่อง dropdown ธรรมดาแบบที่เว็บ/แอปทั่วไปใช้ตอนกรอกฟอร์ม (วันเกิด, เวลานัด ฯลฯ)
export default function SelectField({ options, value, onChange, style }) {
  return (
    <View style={[styles.box, style]}>
      <Picker
        selectedValue={value}
        onValueChange={onChange}
        style={styles.picker}
        itemStyle={styles.pickerItem}
      >
        {options.map((opt) => (
          <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    justifyContent: 'center',
    ...Platform.select({
      web: { paddingHorizontal: 4 },
      default: {},
    }),
  },
  picker: {
    color: colors.textDark,
    ...Platform.select({
      web: { fontFamily: fonts.bodySemiBold, fontSize: 15, height: 42, border: 'none', backgroundColor: 'transparent' },
      default: {},
    }),
  },
  pickerItem: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
});
