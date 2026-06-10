import DateTimePicker from '@react-native-community/datetimepicker';
import { C, R, S, T } from '@/constants/design';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  showTime?: boolean;
  style?: object;
}

function fmt(d: Date, showTime: boolean) {
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (!showTime) return date;
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${date} at ${time}`;
}

// Local datetime string for <input type="datetime-local"> — avoids UTC offset issues
function toLocalISOString(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function DatePickerField({
  value, onChange,
  placeholder = 'Date (optional)',
  showTime = false,
  style,
}: Props) {
  const [show, setShow] = useState(false);
  // Android needs two passes for datetime: first date, then time
  const [androidPhase, setAndroidPhase] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date>(value ?? new Date());

  const mode = showTime ? 'datetime' : 'date';
  const inputType = showTime ? 'datetime-local' : 'date';
  const todayStr = showTime
    ? toLocalISOString(new Date())
    : new Date().toISOString().split('T')[0];

  // ── Web ──────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    const str = value ? (showTime ? toLocalISOString(value) : value.toISOString().split('T')[0]) : '';
    return (
      <View style={[styles.field, style]}>
        {!value && (
          <Text style={[styles.placeholder, { flex: 0, marginRight: S.sm, pointerEvents: 'none' } as any]}>
            {placeholder}
          </Text>
        )}
        <input
          type={inputType}
          value={str}
          min={todayStr}
          onChange={(e: any) => {
            const d = new Date(e.target.value);
            onChange(isNaN(d.getTime()) ? null : d);
          }}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: str ? C.t1 : C.t3,
            fontSize: 14,
            fontFamily: 'inherit',
            colorScheme: 'dark',
            cursor: 'pointer',
          } as any}
        />
        {value && (
          <Pressable onPress={() => onChange(null)} hitSlop={8} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // ── Android — two-pass for datetime ──────────────────────────
  if (Platform.OS === 'android') {
    const handleAndroid = (_: any, selected?: Date) => {
      setShow(false);
      if (!selected) return;
      if (showTime && androidPhase === 'date') {
        // First pass gave us the date; now open time picker
        setTempDate(selected);
        setAndroidPhase('time');
        setShow(true);
      } else {
        onChange(selected);
        setAndroidPhase('date');
      }
    };
    return (
      <>
        <Pressable style={[styles.field, style]} onPress={() => {
          setTempDate(value ?? new Date());
          setAndroidPhase('date');
          setShow(true);
        }}>
          <Text style={value ? styles.valueText : styles.placeholder}>
            {value ? fmt(value, showTime) : placeholder}
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
            mode={showTime && androidPhase === 'time' ? 'time' : 'date'}
            display="default"
            minimumDate={androidPhase === 'date' ? new Date() : undefined}
            onChange={handleAndroid}
          />
        )}
      </>
    );
  }

  // ── iOS — spinner modal ───────────────────────────────────────
  return (
    <>
      <Pressable style={[styles.field, style]} onPress={() => { setTempDate(value ?? new Date()); setShow(true); }}>
        <Text style={value ? styles.valueText : styles.placeholder}>
          {value ? fmt(value, showTime) : placeholder}
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
              mode={mode}
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
  picker: { height: 220 },
});
