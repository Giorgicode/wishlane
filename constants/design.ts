import { Dimensions } from 'react-native';

export const SCREEN = Dimensions.get('window');

/** Dark-luxury color palette */
export const C = {
  // Backgrounds — layered depth
  bg:       '#07070F',
  surface:  '#0F0F1C',
  surface2: '#171728',
  surface3: '#202035',

  // Borders
  border:      'rgba(255,255,255,0.07)',
  borderMed:   'rgba(255,255,255,0.13)',
  borderBright:'rgba(255,107,129,0.28)',

  // Rose primary
  rose:      '#FF6B81',
  roseSoft:  '#FF9AA2',
  roseDeep:  '#C93557',
  roseDim:   'rgba(255,107,129,0.13)',
  roseGlow:  'rgba(255,107,129,0.35)',

  // Text
  t1: 'rgba(255,255,255,0.93)',
  t2: 'rgba(255,255,255,0.55)',
  t3: 'rgba(255,255,255,0.28)',

  // Accent
  teal:    '#5AF0D0',
  tealDim: 'rgba(90,240,208,0.10)',
  gold:    '#FFD060',
  goldDim: 'rgba(255,208,96,0.10)',

  // Luxury warm palette
  cream:    '#F2E8DA',       // warm ivory — editorial headlines
  taupe:    '#A89070',       // warm taupe — secondary text
  goldLux:  '#C8A95A',       // 24k muted gold — CTAs, rules, accents
  goldLuxDim: 'rgba(200,169,90,0.15)',

  // Status
  success: '#4ADE80',
  warning: '#FBBF24',
  error:   '#F87171',

  white: '#FFFFFF',
};

/** Border radius */
export const R = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   20,
  xl:   28,
  xxl:  36,
  full: 9999,
};

/** Spacing */
export const S = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

/** Typography */
export const T = {
  hero: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1.2 },
  h1:   { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.7 },
  h2:   { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  h3:   { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 as any },
  small:{ fontSize: 13, fontWeight: '500' as const },
  micro:{ fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.3 },
  label:{ fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.1 },
};

/** Shadow presets */
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 5,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.65,
    shadowRadius: 32,
    elevation: 20,
  },
  glow: {
    shadowColor: '#FF6B81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
  },
};

/** Spring animation configs */
export const spring = {
  gentle:  { damping: 20, stiffness: 200 },
  snappy:  { damping: 18, stiffness: 350, mass: 0.8 },
  bouncy:  { damping: 12, stiffness: 180 },
  fast:    { damping: 22, stiffness: 450, mass: 0.7 },
};

/** Glassmorphism — works via RN-web backdropFilter */
export const glass = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
} as any;

export const glassStrong = {
  backgroundColor: 'rgba(255,255,255,0.07)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.14)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
} as any;

/** Gold glow shadow */
export const goldGlow = {
  shadowColor: '#C8A95A',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.45,
  shadowRadius: 24,
  elevation: 14,
};

/** Luxury serif — use for editorial hero names/titles */
import { Platform } from 'react-native';
export const serif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia, "Times New Roman", serif',
});

/** Tab bar geometry — used by screens for padding */
export const TAB_BAR_HEIGHT = 78;
