import DateTimePicker from '@react-native-community/datetimepicker';
import { C, R, S, T } from '@/constants/design';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface Props {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  style?: object;
}

const fmt = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function DatePickerField({ value, onChange, placeholder = 'Expiration date (optional)', style }: Props) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value ?? new Date());

  if (Platform.OS === 'web') {
    const str = value ? value.toISOString().split('T')[0] : '';
    return (
      <TextInput
        style={[styles.field, style]}
        placeholder={placeholder}
        placeholderTextColor={C.t3}
        value={str}
        onChangeText={(t) => {
          const d = new Date(t);
          onChange(isNaN(d.getTime()) ? null : d);
        }}
        autoCapitalize="none"
      />
    );
  }

  if (Platform.OS === 'android') {
    return (
      <>
        <Pressable style={[styles.field, style]} onPress={() => { setTempDate(value ?? new Date()); setShow(true); }}>
          <Text style={value ? styles.valueText : styles.placeholder}>
            {value ? fmt(value) : placeholder}
          </Text>
          {value && (
            <Pressable onPress={() => onChange(null)} hitSlop={8} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </Pressable>
          )}
        </Pressable>
        {show && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(_, selected) => {
              setShow(false);
              if (selected) onChange(selected);
            }}
          />
        )}
      </>
    );
  }

  // iOS — spinner in a modal
  return (
    <>
      <Pressable style={[styles.field, style]} onPress={() => { setTempDate(value ?? new Date()); setShow(true); }}>
        <Text style={value ? styles.valueText : styles.placeholder}>
          {value ? fmt(value) : placeholder}
        </Text>
        {value && (
          <Pressable onPress={() => onChange(null)} hitSlop={8} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </Pressable>
      <Modal visible={show} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.toolbar}>
              <Pressable onPress={() => setShow(false)}>
                <Text style={styles.toolbarCancel}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => { setShow(false); onChange(tempDate); }}>
                <Text style={styles.toolbarDone}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              onChange={(_, selected) => { if (selected) setTempDate(selected); }}
              style={styles.picker}
              textColor={C.t1}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: S.md,
    paddingVertical: 10,
    marginBottom: S.xs,
    minHeight: 42,
  },
  placeholder: { ...T.small, color: C.t3, flex: 1 },
  valueText: { ...T.small, color: C.t1, flex: 1 },
  clearBtn: { paddingLeft: S.sm },
  clearText: { ...T.small, color: C.t3 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' as const },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, paddingBottom: 32 },
  toolbar: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingHorizontal: S.lg, paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.border },
  toolbarCancel: { ...T.body, color: C.t3 },
  toolbarDone: { ...T.body, color: C.rose, fontWeight: '700' as const },
  picker: { height: 200 },
});
