import { auth } from '@/config/firebaseConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getUserProfile } from '@/lib/firestore';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

// Enable native screens for better performance — run once on module import
enableScreens();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Listen for auth state and choose initial route accordingly
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setInitialRoute('(tabs)');
      else setInitialRoute('auth/index');
    });
    return unsub;
  }, []);

  useEffect(() => {
    // separately load profile/avatar for top-left button
    let mounted = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (mounted) setAvatarUrl(null);
        return;
      }
      try {
        const p = await getUserProfile(user.uid);
        if (!mounted) return;
        setAvatarUrl(p?.photoURL ?? user.photoURL ?? null);
      } catch (e) {
        console.warn('failed to load profile', e);
      }
    });
    return () => {
      mounted = false;
      unsub && unsub();
    };
  }, []);


  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
  <Stack initialRouteName={initialRoute ?? 'auth/index'}>
          {/* 👇 File-based routing — no manual import needed */}
          <Stack.Screen name="auth/index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
        {/* top-left avatar across the app */}
        <View pointerEvents="box-none" style={styles.avatarContainer}>
          <Pressable onPress={() => router.push('/profile')} style={styles.avatarButton}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
          </Pressable>
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  avatarContainer: { position: 'absolute', top: 8, left: 8, zIndex: 50 },
  avatarButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ddd' },
});


