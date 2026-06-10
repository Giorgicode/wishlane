import { auth } from '@/config/firebaseConfig';
import { C, R, shadow } from '@/constants/design';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/toast-config';
import OfflineBanner from '@/components/offline-banner';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { subscribeToUserProfile } from '@/lib/firestore';
import { isPreset, presetColor } from '@/lib/avatarPresets';

enableScreens();

export default function RootLayout() {
  const [authReady, setAuthReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarInitial, setAvatarInitial] = useState<string>('');
  const { unreadCount } = useNotifications(uid);
  usePushNotifications(uid);
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();

  // Single auth listener — source of truth
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthReady(true);
      if (!user) { setAvatarUrl(null); setAvatarInitial(''); }
      else setAvatarInitial((user.displayName || user.email || '?')[0].toUpperCase());
    });
  }, []);

  // Live avatar — re-subscribes whenever uid changes
  useEffect(() => {
    if (!uid) return;
    return subscribeToUserProfile(uid, (profile: any) => {
      setAvatarUrl(profile?.photoURL ?? null);
      if (profile?.displayName || profile?.email) {
        setAvatarInitial((profile.displayName || profile.email)[0].toUpperCase());
      }
    });
  }, [uid]);

  // Guard: send unauthenticated users to /auth once the navigator is ready.
  // The auth screen itself calls router.replace('/(tabs)') after a successful sign-in.
  useEffect(() => {
    if (!authReady || !navState?.key) return;
    if (!uid && segments[0] !== 'auth') {
      router.replace('/auth');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, authReady, navState?.key]);

  // Show blank dark screen while Firebase resolves auth state
  if (!authReady) {
    return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={DarkTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth/index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="event-share-link" options={{ headerShown: true, title: 'Shared Event', headerStyle: { backgroundColor: C.surface }, headerTintColor: C.t1 }} />
          <Stack.Screen name="event/[shareCode]" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="(tabs)/profile" />
        </Stack>
        <StatusBar style="light" />

        {/* Avatar — only shown when signed in and not already on profile */}
        {!!uid && !(segments as string[]).includes('profile') && (
          <View pointerEvents="box-none" style={styles.avatarContainer}>
            <Pressable onPress={() => router.push('/profile')} style={styles.avatarButton}>
              {avatarUrl && !isPreset(avatarUrl) ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[
                  styles.avatarPlaceholder,
                  isPreset(avatarUrl) && { backgroundColor: presetColor(avatarUrl) + '30' },
                ]}>
                  {!!avatarInitial && (
                    <Text style={[styles.avatarInitialText, isPreset(avatarUrl) && { color: presetColor(avatarUrl) }]}>
                      {avatarInitial}
                    </Text>
                  )}
                </View>
              )}
            </Pressable>
          </View>
        )}

        {/* Bell — only shown when signed in */}
        {!!uid && (
          <View pointerEvents="box-none" style={styles.bellContainer}>
            <Pressable onPress={() => router.push('/notifications')} style={styles.bellButton}>
              <View style={styles.bellDot} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        )}
        <OfflineBanner />
        <Toast config={toastConfig} topOffset={60} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  avatarContainer: { position: 'absolute', top: 8, left: 8, zIndex: 50 },
  avatarButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 1.5, borderColor: C.borderMed, ...shadow.sm },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface3, alignItems: 'center', justifyContent: 'center' },
  avatarInitialText: { fontSize: 17, fontWeight: '700' as const, color: C.t2 },
  bellContainer: { position: 'absolute', top: 8, right: 8, zIndex: 50 },
  bellButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, ...shadow.sm },
  bellDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: C.t1 },
  badge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: C.roseDeep,
    borderRadius: R.full, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: C.white, fontSize: 10, fontWeight: 'bold' },
});
