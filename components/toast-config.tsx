import { C, R, S, T } from '@/constants/design';
import { StyleSheet, Text, View } from 'react-native';

const ACCENT: Record<string, string> = {
  success: C.teal,
  info: C.goldLux,
  error: '#FF6B6B',
};

function ToastBase({ type, text1, text2 }: { type: string; text1?: string; text2?: string }) {
  const accent = ACCENT[type] ?? C.rose;
  return (
    <View style={[styles.container, { borderLeftColor: accent }]}>
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <View style={styles.body}>
        {!!text1 && <Text style={styles.title} numberOfLines={1}>{text1}</Text>}
        {!!text2 && <Text style={styles.message} numberOfLines={2}>{text2}</Text>}
      </View>
    </View>
  );
}

export const toastConfig = {
  success: ({ text1, text2 }: any) => <ToastBase type="success" text1={text1} text2={text2} />,
  info:    ({ text1, text2 }: any) => <ToastBase type="info"    text1={text1} text2={text2} />,
  error:   ({ text1, text2 }: any) => <ToastBase type="error"   text1={text1} text2={text2} />,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,15,28,0.96)',
    borderRadius: R.lg,
    borderLeftWidth: 3,
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    marginHorizontal: S.md,
    gap: S.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 240,
    maxWidth: 360,
  } as any,
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  body: { flex: 1 },
  title: { ...T.body, color: C.cream, fontWeight: '700' as const, marginBottom: 1 } as any,
  message: { ...T.small, color: C.t2 } as any,
});
