import { View, StyleSheet } from 'react-native';

type Preset = 'rose' | 'teal' | 'gold' | 'purple' | 'mixed';

const PRESETS: Record<Preset, { color: string; top: number; left?: number; right?: number; size: number }[]> = {
  rose: [
    { color: 'rgba(255,107,129,0.15)', top: -120, left: -100, size: 380 },
    { color: 'rgba(200,169,90,0.10)', top: 80, left: '40%' as any, size: 200 },
    { color: 'rgba(138,90,255,0.08)', top: 520, left: -40, size: 260 },
  ],
  teal: [
    { color: 'rgba(90,240,208,0.13)', top: -100, right: -80, size: 340 },
    { color: 'rgba(255,107,129,0.09)', top: 300, left: -60, size: 280 },
    { color: 'rgba(138,90,255,0.07)', top: 600, right: -40, size: 220 },
  ],
  gold: [
    { color: 'rgba(200,169,90,0.16)', top: -80, left: -60, size: 320 },
    { color: 'rgba(90,240,208,0.09)', top: 260, right: -80, size: 260 },
    { color: 'rgba(255,107,129,0.08)', top: 560, left: 20, size: 240 },
  ],
  purple: [
    { color: 'rgba(138,90,255,0.14)', top: -100, left: -80, size: 360 },
    { color: 'rgba(255,107,129,0.09)', top: 300, right: -60, size: 260 },
    { color: 'rgba(90,240,208,0.07)', top: 580, left: -20, size: 220 },
  ],
  mixed: [
    { color: 'rgba(255,107,129,0.13)', top: -120, left: -100, size: 380 },
    { color: 'rgba(90,240,208,0.09)', top: 180, right: -80, size: 300 },
    { color: 'rgba(200,169,90,0.11)', top: 80, left: '42%' as any, size: 200 },
    { color: 'rgba(138,90,255,0.08)', top: 520, left: -40, size: 260 },
  ],
};

export default function AmbientBg({ preset = 'rose' }: { preset?: Preset }) {
  return (
    <>
      {PRESETS[preset].map((b, i) => (
        <View
          key={i}
          style={[
            styles.blob,
            {
              backgroundColor: b.color,
              width: b.size,
              height: b.size,
              borderRadius: b.size / 2,
              top: b.top,
              left: b.left,
              right: b.right,
            },
          ]}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    filter: 'blur(80px)',
  } as any,
});
