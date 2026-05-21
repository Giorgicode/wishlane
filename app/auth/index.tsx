import { auth, db } from '@/config/firebaseConfig';
import { C, R, S, shadow, spring, T } from '@/constants/design';
import { createUserProfile } from '@/lib/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

WebBrowser.maybeCompleteAuthSession();

// expo-auth-session's Google hook throws on web when webClientId is absent.
// On web we use Firebase signInWithPopup directly, so stub the hook out.
const useGoogleAuth: typeof Google.useAuthRequest = Platform.OS === 'web'
  ? () => [null, null, async () => ({ type: 'dismiss' } as any)]
  : Google.useAuthRequest;

/* ─── Animated field wrapper ───────────────────────────────── */
function Field({
  label, value, onChangeText, secure, delay = 0,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  secure?: boolean; delay?: number;
}) {
  const focused = useSharedValue(0);
  const hasValue = value.length > 0;

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: focused.value === 1 ? C.rose : C.border,
    shadowOpacity: interpolate(focused.value, [0, 1], [0, 0.4]),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          focused.value || (hasValue ? 1 : 0),
          [0, 1],
          [0, -24]
        ),
      },
      {
        scale: interpolate(
          focused.value || (hasValue ? 1 : 0),
          [0, 1],
          [1, 0.82]
        ),
      },
    ],
    color: focused.value === 1 ? C.rose : C.t3,
  }));

  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(delay)}
      style={[styles.field, borderStyle]}
    >
      <Animated.Text style={[styles.fieldLabel, labelStyle]}>
        {label}
      </Animated.Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        autoCapitalize="none"
        placeholderTextColor="transparent"
        onFocus={() => { focused.value = withSpring(1, spring.fast); }}
        onBlur={() => { focused.value = withSpring(0, spring.fast); }}
      />
    </Animated.View>
  );
}

/* ─── route after sign-in ──────────────────────────────────── */
async function routeAfterSignIn(uid: string, router: ReturnType<typeof useRouter>) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists() && snap.data()?.onboardingComplete) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(tabs)/profile');
    }
  } catch {
    router.replace('/(tabs)');
  }
}

/* ─── Main screen ──────────────────────────────────────────── */
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetSending, setResetSending] = useState(false);

  const redirectUri = makeRedirectUri({ scheme: (Constants.expoConfig?.scheme as string) || 'wishlane' });
  const [request, response, promptAsync] = useGoogleAuth({
    iosClientId: process.env.EXPO_GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: process.env.EXPO_GOOGLE_ANDROID_CLIENT_ID || undefined,
    webClientId: process.env.EXPO_GOOGLE_WEB_CLIENT_ID || undefined,
    redirectUri,
  });

  // Button press feedback
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const pressIn = () => { btnScale.value = withSpring(0.95, spring.fast); };
  const pressOut = () => { btnScale.value = withSpring(1, spring.bouncy); };

  useEffect(() => {
    (async () => {
      if (response?.type === 'success') {
        const { authentication } = response;
        setLoading(true);
        setError(null);
        try {
          const credential = GoogleAuthProvider.credential(
            authentication?.idToken ?? null,
            authentication?.accessToken ?? null
          );
          const result = await signInWithCredential(auth, credential);
          const u = result.user;
          await createUserProfile(u.uid, {
            email: u.email ?? '',
            displayName: u.displayName ?? '',
            photoURL: u.photoURL ?? '',
          });
          await routeAfterSignIn(u.uid, router);
        } catch (err: any) {
          setError(err.message ?? 'Google sign-in failed');
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [response, router]);

  const handleEmailAuth = async () => {
    setError(null);
    setSuccessMsg(null);
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Persist profile to Firestore immediately so the user is findable by email
        await createUserProfile(userCred.user.uid, {
          email: userCred.user.email ?? email,
          displayName: userCred.user.displayName ?? email.split('@')[0],
        });
        try { await sendEmailVerification(userCred.user); } catch { /* ignore */ }
        await signOut(auth);
        setSuccessMsg('Account created! Check your email to verify before signing in.');
        setIsRegister(false);
        setPassword('');
        return;
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        await createUserProfile(userCred.user.uid, {
          email: userCred.user.email ?? email,
          displayName: userCred.user.displayName ?? email.split('@')[0],
          photoURL: userCred.user.photoURL ?? '',
        });
        await routeAfterSignIn(userCred.user.uid, router);
        return;
      }
    } catch (e: any) {
      const msg: string = e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password'
        ? 'Incorrect email or password.'
        : e.code === 'auth/user-not-found'
        ? 'No account found with that email.'
        : e.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists.'
        : e.code === 'auth/weak-password'
        ? 'Password must be at least 6 characters.'
        : e.message ?? 'Authentication failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        const result = await signInWithPopup(auth, new GoogleAuthProvider());
        const u = result.user;
        await createUserProfile(u.uid, {
          email: u.email ?? '',
          displayName: u.displayName ?? '',
          photoURL: u.photoURL ?? '',
        });
        await routeAfterSignIn(u.uid, router);
      } else {
        if (request) {
          const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
          await promptAsync({ useProxy: !!isExpoGo } as any);
        } else {
          setError('Google sign-in is not configured for this platform.');
        }
      }
    } catch (e: any) {
      setError(e.message ?? 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email address above, then tap Forgot password.');
      return;
    }
    setResetSending(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg('Password reset email sent — check your inbox.');
    } catch (e: any) {
      const msg = e.code === 'auth/user-not-found'
        ? 'No account found with that email.'
        : e.code === 'auth/invalid-email'
        ? 'Invalid email address.'
        : 'Failed to send reset email. Try again.';
      setError(msg);
    } finally {
      setResetSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.brand}>
          <Animated.Text
            style={styles.brandName}
            entering={FadeInUp.duration(500).delay(200)}
          >
            WishLane
          </Animated.Text>
          <Animated.Text
            style={styles.brandSub}
            entering={FadeIn.duration(400).delay(400)}
          >
            {isRegister ? 'Create your account' : 'Welcome back'}
          </Animated.Text>
        </Animated.View>

        {/* Form card */}
        <Animated.View
          style={styles.card}
          entering={FadeInUp.duration(500).delay(300).springify()}
        >
          <Field label="Email address" value={email} onChangeText={(t) => { setEmail(t); setError(null); }} delay={400} />
          <Field label="Password" value={password} onChangeText={(t) => { setPassword(t); setError(null); }} secure delay={500} />

          {/* Forgot password — sign-in mode only */}
          {!isRegister && (
            <Animated.View entering={FadeIn.duration(300).delay(550)} style={styles.forgotRow}>
              <Pressable onPress={handleForgotPassword} disabled={resetSending}>
                <Text style={[styles.forgotLink, resetSending && { opacity: 0.5 }]}>
                  {resetSending ? 'Sending…' : 'Forgot password?'}
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Inline error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Inline success */}
          {!!successMsg && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          )}

          {/* Primary button */}
          <Animated.View style={[{ marginTop: S.sm }, btnStyle]}>
            <Pressable
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleEmailAuth}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isRegister ? 'Create account' : 'Sign in'}
                </Text>
              )}
            </Pressable>
          </Animated.View>

          {/* Divider */}
          <Animated.View
            style={styles.divider}
            entering={FadeIn.duration(300).delay(600)}
          >
            <View style={styles.divLine} />
            <Text style={styles.divText}>or</Text>
            <View style={styles.divLine} />
          </Animated.View>

          {/* Google */}
          <Animated.View entering={FadeInUp.duration(400).delay(650)}>
            <Pressable style={[styles.googleBtn, loading && { opacity: 0.7 }]} onPress={handleGoogleLogin} disabled={loading}>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>

        {/* Toggle register/login */}
        <Animated.View
          style={styles.toggleRow}
          entering={FadeIn.duration(400).delay(700)}
        >
          <Text style={styles.toggleText}>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          </Text>
          <Pressable onPress={() => setIsRegister(!isRegister)}>
            <Text style={styles.toggleLink}>
              {isRegister ? 'Sign in' : 'Register'}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: S.lg,
    paddingVertical: S.xxl,
  },
  brand: { alignItems: 'center', marginBottom: S.xl },
  brandName: { ...T.hero, color: C.rose, marginBottom: S.xs },
  brandSub: { ...T.body, color: C.t2 },

  card: {
    backgroundColor: C.surface2,
    borderRadius: R.xl,
    padding: S.lg,
    borderWidth: 1,
    borderColor: C.border,
    ...shadow.md,
    gap: S.sm,
  },

  // Floating label field
  field: {
    height: 60,
    backgroundColor: C.surface3,
    borderRadius: R.md,
    borderWidth: 1,
    paddingHorizontal: S.md,
    justifyContent: 'center',
    shadowColor: C.rose,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 0,
  },
  fieldLabel: {
    position: 'absolute',
    left: S.md,
    ...T.body,
    transformOrigin: 'left center' as any,
  },
  fieldInput: {
    ...T.body,
    color: C.t1,
    paddingTop: 14,
    height: '100%',
  },

  // Buttons
  primaryBtn: {
    backgroundColor: C.rose,
    borderRadius: R.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadow.glow,
  },
  primaryBtnText: { ...T.h3, color: C.white },
  googleBtn: {
    backgroundColor: C.surface3,
    borderRadius: R.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.borderMed,
  },
  googleBtnText: { ...T.body, color: C.t1, fontWeight: '600' as const },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divText: { ...T.micro, color: C.t3 },

  // Toggle
  forgotRow: { alignItems: 'flex-end', marginTop: -S.xs },
  forgotLink: { ...T.small, color: C.t3, textDecorationLine: 'underline' } as any,

  toggleRow: { flexDirection: 'row', justifyContent: 'center', marginTop: S.lg },
  toggleText: { ...T.small, color: C.t2 },
  toggleLink: { ...T.small, color: C.rose, fontWeight: '700' as const },

  // Inline feedback
  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.15)',
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.40)',
    padding: S.sm,
  },
  errorText: { ...T.small, color: '#f87171', textAlign: 'center' },
  successBox: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.35)',
    padding: S.sm,
  },
  successText: { ...T.small, color: '#34d399', textAlign: 'center' },

});
