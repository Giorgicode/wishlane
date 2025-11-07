import { auth } from '@/config/firebaseConfig';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { createUserWithEmailAndPassword, GoogleAuthProvider, sendEmailVerification, signInWithCredential, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Complete any pending auth session when the app resumes
WebBrowser.maybeCompleteAuthSession();

// NOTE: You must provide OAuth client IDs for native (iOS/Android) and web. See the comments below and README.

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  // Setup Google auth request for native platforms via Expo AuthSession.
  // Use environment client IDs. For production builds do NOT use the Expo proxy.
  const redirectUri = makeRedirectUri({ scheme: Constants.manifest?.scheme || 'wishlane' });
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_GOOGLE_WEB_CLIENT_ID || undefined,
    iosClientId: process.env.EXPO_GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: process.env.EXPO_GOOGLE_ANDROID_CLIENT_ID || undefined,
    webClientId: process.env.EXPO_GOOGLE_WEB_CLIENT_ID || undefined,
    redirectUri,
  });

  useEffect(() => {
    // Handle response from Expo Google auth (native)
    (async () => {
      if (response?.type === 'success') {
        const { authentication } = response;
        try {
          const credential = GoogleAuthProvider.credential(authentication?.idToken ?? null, authentication?.accessToken ?? null);
          await signInWithCredential(auth, credential);
          router.replace('/(tabs)');
        } catch (err: any) {
          Alert.alert('Google sign-in error', err.message ?? String(err));
        }
      }
    })();
  }, [response, router]);

  const handleEmailAuth = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    try {
      if (isRegister) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        try {
          await sendEmailVerification(userCred.user);
          Alert.alert('Success', 'Account created. Please verify your email (verification email sent).');
        } catch (err) {
          console.warn('Failed to send verification email', err);
          Alert.alert('Success', 'Account created. Please verify your email (verification email may not have been sent).');
        }
        // Sign out to prevent immediate access until verification
        await signOut(auth);
        return;
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        if (!userCred.user.emailVerified) {
          Alert.alert('Email not verified', 'Please verify your email before continuing. We can resend the verification email.', [
            { text: 'Resend', onPress: async () => { try { await sendEmailVerification(userCred.user); Alert.alert('Sent', 'Verification email resent.'); } catch (err) { Alert.alert('Error', String(err)); } } },
            { text: 'OK' }
          ]);
          await signOut(auth);
          return;
        }
        Alert.alert('Success', 'Logged in successfully!');
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Authentication error', e.message ?? String(e));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        router.replace('/(tabs)');
      } else {
        if (request) {
          // Detect Expo Go: use the Expo proxy only in Expo Go (development).
          const isExpoGo = Constants.appOwnership === 'expo';
          const useProxy = !!isExpoGo; // set to false for production/dev-client/standalone
          // runtime option only — cast to any to satisfy TypeScript typing differences across expo-auth-session versions
          await promptAsync({ useProxy } as any);
        } else {
          Alert.alert('Google sign-in', 'Google sign-in is not configured. Please set OAuth client IDs in environment variables.');
        }
      }
    } catch (e: any) {
      Alert.alert('Google sign-in error', e.message ?? String(e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎁 WishLane</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

      <TouchableOpacity style={styles.button} onPress={handleEmailAuth}>
        <Text style={styles.buttonText}>{isRegister ? 'Register' : 'Login'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondary} onPress={() => setIsRegister(!isRegister)}>
        <Text style={styles.link}>{isRegister ? 'Already have an account? Login' : 'No account? Register'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
        <Text style={styles.googleText}>Login with Google 🌐</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#fff8f9" },
  title: { fontSize: 32, fontWeight: "bold", color: "#ff6b81", marginBottom: 40 },
  input: { width: "100%", borderWidth: 1, borderColor: "#ffd6dc", borderRadius: 10, padding: 10, marginBottom: 15 },
  button: { backgroundColor: "#ff6b81", borderRadius: 10, paddingVertical: 15, width: "100%", alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  secondary: { marginTop: 15 },
  link: { color: "#ff6b81", fontWeight: "bold" },
  googleButton: { marginTop: 25, padding: 15, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#ffd6dc" },
  googleText: { color: "#555", fontWeight: "bold" },
});
