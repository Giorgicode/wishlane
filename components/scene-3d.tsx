/**
 * 3D animated scene objects — pure React Native Views + Reanimated
 * Depth comes from: perspective + rotateY rocking, color-face shading, float physics
 */
import { C } from '@/constants/design';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/* ─── Shared hooks ─────────────────────────────────────────── */
function useFloat(amp = 10, dur = 2400) {
  const ty = useSharedValue(0);
  useEffect(() => {
    ty.value = withRepeat(
      withSequence(
        withTiming(-amp, { duration: dur, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: dur, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );
  }, []);
  return ty;
}

function useRock(deg = 14, dur = 3200) {
  const ry = useSharedValue(-deg * 0.5);
  useEffect(() => {
    ry.value = withRepeat(
      withSequence(
        withTiming(deg, { duration: dur, easing: Easing.inOut(Easing.sin) }),
        withTiming(-deg, { duration: dur, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );
  }, []);
  return ry;
}

/* ─── Cake (Birthday) ──────────────────────────────────────── */
function CandleFlame({ delay = 0 }: { delay?: number }) {
  const sc = useSharedValue(1);
  useEffect(() => {
    sc.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.35, { duration: 320, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.75, { duration: 260, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.15, { duration: 200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1, false,
    ));
  }, []);
  const s = useAnimatedStyle(() => ({ transform: [{ scaleY: sc.value }] }));
  return <Animated.View style={[s3d.flame, s]} />;
}

function CakeTier({ w, h, top, body, frost }: { w: number; h: number; top: string; body: string; frost: string }) {
  const drips = Math.max(3, Math.floor(w / 22));
  return (
    <View style={{ width: w, alignItems: 'center' }}>
      {/* Ellipse top face */}
      <View style={{ width: w, height: Math.round(w * 0.24), borderRadius: w, backgroundColor: top, zIndex: 1 }} />
      {/* Body */}
      <View style={{ width: w, height: h, backgroundColor: body, overflow: 'visible' }}>
        {/* Frosting drips */}
        <View style={{ position: 'absolute', top: -4, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-evenly' }}>
          {Array.from({ length: drips }).map((_, i) => (
            <View key={i} style={{ width: 10, height: 14, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: frost }} />
          ))}
        </View>
        {/* Side shadow stripe for depth */}
        <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 12, backgroundColor: 'rgba(0,0,0,0.18)', borderTopRightRadius: 0 }} />
      </View>
    </View>
  );
}

export function Cake3D() {
  const ty = useFloat(9, 2200);
  const ry = useRock(16, 3400);
  const s = useAnimatedStyle(() => ({
    transform: [{ perspective: 520 }, { rotateY: `${ry.value}deg` }, { translateY: ty.value }],
  }));

  return (
    <Animated.View style={[s3d.cakeRoot, s]}>
      {/* Candles */}
      <View style={s3d.candleRow}>
        {[0, 1, 2].map(i => (
          <View key={i} style={s3d.candleWrap}>
            <CandleFlame delay={i * 120} />
            <View style={s3d.candleBody} />
          </View>
        ))}
      </View>
      {/* Tiers — top first in DOM, visually stacked */}
      <CakeTier w={72}  h={22} top="#FFD6DC" body="#FF9AA2" frost="#FFF" />
      <CakeTier w={104} h={28} top="#FF9AA2" body="#FF6B81" frost="#FFEEF0" />
      <CakeTier w={136} h={34} top="#FF6B81" body="#C93557" frost="#FFD0D8" />
      {/* Base plate */}
      <View style={s3d.basePlate} />
    </Animated.View>
  );
}

/* ─── Champagne Glass (Night Out) ──────────────────────────── */
function RisingBubble({ x, delay }: { x: number; delay: number }) {
  const ty = useSharedValue(0);
  const op = useSharedValue(1);
  useEffect(() => {
    const run = () => {
      ty.value = 0;
      op.value = 1;
      ty.value = withTiming(-54, { duration: 1600 + delay * 200, easing: Easing.out(Easing.quad) });
      op.value = withDelay(900, withTiming(0, { duration: 500 }));
      setTimeout(run, 2000 + delay * 400);
    };
    setTimeout(run, delay * 300);
  }, []);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }], opacity: op.value }));
  return <Animated.View style={[s3d.bubble, s, { left: x }]} />;
}

export function NightOut3D() {
  const ty = useFloat(8, 2600);
  const ry = useRock(12, 4000);
  const s = useAnimatedStyle(() => ({
    transform: [{ perspective: 500 }, { rotateY: `${ry.value}deg` }, { translateY: ty.value }],
  }));

  return (
    <Animated.View style={[s3d.glassRoot, s]}>
      {/* Bowl */}
      <View style={s3d.glassBowl}>
        {/* Liquid */}
        <View style={s3d.glassLiquid}>
          {/* Bubbles */}
          {[16, 28, 38, 50].map((x, i) => <RisingBubble key={i} x={x} delay={i} />)}
        </View>
        {/* Shine */}
        <View style={s3d.glassShine} />
        {/* Rim highlight */}
        <View style={s3d.glassRim} />
      </View>
      {/* Stem */}
      <View style={s3d.glassStem} />
      {/* Base */}
      <View style={s3d.glassBase} />
    </Animated.View>
  );
}

/* ─── Christmas Tree ────────────────────────────────────────── */
function TreeTier({ w, h, color, snowColor }: { w: number; h: number; color: string; snowColor: string }) {
  return (
    <View style={{ width: w, alignItems: 'center', marginBottom: -10, zIndex: 1 }}>
      {/* Snow cap on top */}
      <View style={{ width: w * 0.6, height: 12, borderRadius: 8, backgroundColor: snowColor, marginBottom: -6, zIndex: 2 }} />
      {/* Tier body — isoceles look using side padding */}
      <View style={{ width: w, height: h, backgroundColor: color, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }}>
        {/* Side shadow */}
        <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 10, backgroundColor: 'rgba(0,0,0,0.2)' }} />
        {/* Highlight left */}
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: 'rgba(255,255,255,0.08)' }} />
      </View>
    </View>
  );
}

function Ornament({ left, top, color }: { left: number; top: number; color: string }) {
  return <View style={[s3d.ornament, { left, top, backgroundColor: color }]} />;
}

export function Christmas3D() {
  const ty = useFloat(7, 3000);
  const rz = useSharedValue(0);
  const starGlow = useSharedValue(1);

  useEffect(() => {
    rz.value = withRepeat(withSequence(
      withTiming(4, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      withTiming(-4, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
    ), -1, false);
    starGlow.value = withRepeat(withSequence(
      withTiming(1.4, { duration: 700 }),
      withTiming(0.8, { duration: 500 }),
    ), -1, false);
  }, []);

  const treeStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 500 }, { rotateZ: `${rz.value}deg` }, { translateY: ty.value }],
  }));
  const starStyle = useAnimatedStyle(() => ({ transform: [{ scale: starGlow.value }] }));

  return (
    <Animated.View style={[s3d.treeRoot, treeStyle]}>
      {/* Star */}
      <Animated.View style={[s3d.star, starStyle]} />

      {/* Tree tiers */}
      <View style={{ alignItems: 'center', width: 130 }}>
        <TreeTier w={50}  h={30} color="#2E7D32" snowColor="rgba(220,240,255,0.9)" />
        <TreeTier w={80}  h={38} color="#388E3C" snowColor="rgba(220,240,255,0.85)" />
        <TreeTier w={116} h={46} color="#1B5E20" snowColor="rgba(220,240,255,0.8)" />

        {/* Ornaments */}
        <Ornament left={20} top={55} color={C.rose} />
        <Ornament left={62} top={48} color={C.gold} />
        <Ornament left={88} top={68} color={C.teal} />
        <Ornament left={36} top={82} color={C.gold} />
        <Ornament left={76} top={92} color={C.rose} />
      </View>

      {/* Trunk */}
      <View style={s3d.trunk} />
    </Animated.View>
  );
}

/* ─── Skis ──────────────────────────────────────────────────── */
export function Skiing3D() {
  const ty = useFloat(8, 2800);
  const ry = useRock(18, 3600);

  const s = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateY: `${ry.value}deg` }, { rotateZ: '-8deg' }, { translateY: ty.value }],
  }));

  return (
    <Animated.View style={[s3d.skiRoot, s]}>
      {/* Mountain silhouette */}
      <View style={s3d.mountain} />
      <View style={[s3d.mountain, s3d.mountainRight]} />

      {/* Ski 1 */}
      <View style={s3d.skiPair}>
        <View style={s3d.ski}>
          <View style={s3d.skiTip} />
          <View style={s3d.skiBody} />
          <View style={s3d.skiBinding} />
        </View>
        {/* Pole 1 */}
        <View style={s3d.pole} />
      </View>

      {/* Ski 2 */}
      <View style={[s3d.skiPair, { marginTop: 12 }]}>
        <View style={s3d.ski}>
          <View style={[s3d.skiTip, { borderBottomColor: '#1565C0' }]} />
          <View style={[s3d.skiBody, { backgroundColor: '#1565C0' }]} />
          <View style={s3d.skiBinding} />
        </View>
        <View style={s3d.pole} />
      </View>

      {/* Snow spray */}
      <View style={s3d.snowSpray} />
    </Animated.View>
  );
}

/* ─── Beach Cocktail ────────────────────────────────────────── */
function UmbrellaRib({ angle }: { angle: number }) {
  return (
    <View style={[s3d.umbrellaRib, { transform: [{ rotate: `${angle}deg` }] }]} />
  );
}

export function BeachParty3D() {
  const ty = useFloat(9, 2200);
  const ry = useRock(14, 3800);
  const liquidRz = useSharedValue(0);

  useEffect(() => {
    liquidRz.value = withRepeat(withSequence(
      withTiming(3, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      withTiming(-3, { duration: 800, easing: Easing.inOut(Easing.sin) }),
    ), -1, false);
  }, []);

  const s = useAnimatedStyle(() => ({
    transform: [{ perspective: 500 }, { rotateY: `${ry.value}deg` }, { translateY: ty.value }],
  }));
  const liquidStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${liquidRz.value}deg` }],
  }));

  return (
    <Animated.View style={[s3d.cocktailRoot, s]}>
      {/* Paper umbrella */}
      <View style={s3d.umbrellaHub}>
        {[-60, -30, 0, 30, 60].map(a => <UmbrellaRib key={a} angle={a} />)}
        <View style={s3d.umbrellaTip} />
      </View>
      <View style={s3d.umbrellaStick} />

      {/* Glass */}
      <View style={s3d.cocktailGlass}>
        {/* Liquid layers */}
        <Animated.View style={[s3d.liquidWrap, liquidStyle]}>
          <View style={[s3d.liquidLayer, { backgroundColor: 'rgba(0,188,212,0.85)', flex: 1 }]} />
          <View style={[s3d.liquidLayer, { backgroundColor: 'rgba(233,30,99,0.85)', flex: 1 }]} />
          <View style={[s3d.liquidLayer, { backgroundColor: 'rgba(255,152,0,0.85)', flex: 1 }]} />
        </Animated.View>
        {/* Glass shine */}
        <View style={s3d.cocktailShine} />
        {/* Rim */}
        <View style={s3d.cocktailRim} />
      </View>

      {/* Straw */}
      <View style={s3d.straw} />

      {/* Orange slice */}
      <View style={s3d.fruitSlice}>
        <View style={s3d.fruitInner} />
      </View>
    </Animated.View>
  );
}

/* ─── Styles ────────────────────────────────────────────────── */
const s3d = StyleSheet.create({
  // ── Cake
  cakeRoot: { alignItems: 'center', width: 160 },
  candleRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 0, zIndex: 3 },
  candleWrap: { alignItems: 'center' },
  flame: {
    width: 8, height: 12,
    backgroundColor: '#FFB347',
    borderRadius: 4,
    borderTopLeftRadius: 3, borderTopRightRadius: 3,
    shadowColor: '#FFB347', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6, elevation: 5,
    marginBottom: 1,
  },
  candleBody: {
    width: 5, height: 20,
    backgroundColor: '#FFD060',
    borderRadius: 2,
    shadowColor: '#FFD060', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 3,
  },
  basePlate: {
    width: 150, height: 8,
    backgroundColor: '#7A1A30',
    borderRadius: 4,
    marginTop: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12,
  },

  // ── Champagne Glass
  glassRoot: { alignItems: 'center', width: 100 },
  glassBowl: {
    width: 72, height: 90,
    borderRadius: 36,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    backgroundColor: 'rgba(90,240,208,0.10)',
    borderWidth: 2, borderColor: 'rgba(90,240,208,0.55)',
    overflow: 'hidden',
    shadowColor: C.teal, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16,
  },
  glassLiquid: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '72%',
    backgroundColor: 'rgba(90,240,208,0.55)',
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute', bottom: 6,
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  glassShine: {
    position: 'absolute', top: 10, left: 8,
    width: 16, height: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    transform: [{ rotate: '-15deg' }],
  },
  glassRim: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
    backgroundColor: 'rgba(90,240,208,0.8)',
  },
  glassStem: {
    width: 4, height: 50,
    backgroundColor: 'rgba(90,240,208,0.45)',
    borderRadius: 2,
  },
  glassBase: {
    width: 48, height: 7,
    backgroundColor: 'rgba(90,240,208,0.45)',
    borderRadius: 4,
    shadowColor: C.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },

  // ── Christmas Tree
  treeRoot: { alignItems: 'center', width: 140 },
  star: {
    width: 22, height: 22, borderRadius: 4,
    backgroundColor: C.gold,
    transform: [{ rotate: '45deg' }],
    shadowColor: C.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 12,
    marginBottom: 2, zIndex: 10,
  },
  ornament: {
    position: 'absolute',
    width: 10, height: 10, borderRadius: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2,
  },
  trunk: {
    width: 16, height: 22,
    backgroundColor: '#5D4037',
    borderRadius: 3,
    marginTop: 0,
  },

  // ── Skis
  skiRoot: { alignItems: 'center', width: 160, height: 160, justifyContent: 'center' },
  mountain: {
    position: 'absolute', bottom: 10, left: 0,
    width: 0, height: 0,
    borderLeftWidth: 50, borderRightWidth: 80, borderBottomWidth: 80,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: 'rgba(139,180,255,0.15)',
  },
  mountainRight: { left: 60, borderLeftWidth: 40, borderRightWidth: 60, borderBottomWidth: 60, borderBottomColor: 'rgba(139,180,255,0.10)' },
  skiPair: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ski: { flexDirection: 'row', alignItems: 'center' },
  skiTip: {
    width: 0, height: 0,
    borderTopWidth: 9, borderBottomWidth: 9, borderRightWidth: 16,
    borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#1976D2',
  },
  skiBody: {
    width: 90, height: 14,
    backgroundColor: '#1976D2',
    borderTopRightRadius: 3, borderBottomRightRadius: 3,
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6,
  },
  skiBinding: {
    position: 'absolute', left: 45,
    width: 16, height: 14,
    backgroundColor: '#E53935',
    borderRadius: 2,
  },
  pole: {
    width: 2, height: 70,
    backgroundColor: 'rgba(200,220,255,0.6)',
    borderRadius: 1,
    marginLeft: 4,
    transform: [{ rotate: '10deg' }],
  },
  snowSpray: {
    position: 'absolute', bottom: 4, right: 16,
    width: 40, height: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    transform: [{ scaleX: 1.5 }],
  },

  // ── Cocktail
  cocktailRoot: { alignItems: 'center', width: 140 },
  umbrellaHub: { width: 64, height: 32, alignItems: 'center', justifyContent: 'center', overflow: 'visible', marginBottom: -4, zIndex: 3 },
  umbrellaRib: {
    position: 'absolute',
    width: 32, height: 3,
    backgroundColor: C.rose,
    borderRadius: 2,
    left: 16,
    transformOrigin: '0 50%' as any,
  },
  umbrellaTip: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.gold, zIndex: 4 },
  umbrellaStick: {
    width: 2, height: 30, backgroundColor: C.gold, borderRadius: 1, zIndex: 2, marginBottom: -28,
  },
  cocktailGlass: {
    width: 76, height: 88,
    borderRadius: 8,
    borderTopLeftRadius: 38, borderTopRightRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    shadowColor: '#FF9800', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 16,
  },
  liquidWrap: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  liquidLayer: { flex: 1 },
  cocktailShine: {
    position: 'absolute', top: 8, left: 8,
    width: 12, height: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    transform: [{ rotate: '-12deg' }],
  },
  cocktailRim: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  straw: {
    position: 'absolute',
    width: 5, height: 80,
    backgroundColor: C.rose,
    borderRadius: 3,
    right: 28, top: 4,
    transform: [{ rotate: '10deg' }],
    zIndex: 5,
  },
  fruitSlice: {
    position: 'absolute', right: 8, top: 20,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FFB347',
    borderWidth: 3, borderColor: '#FFA000',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 4,
  },
  fruitInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.4)' },
});
