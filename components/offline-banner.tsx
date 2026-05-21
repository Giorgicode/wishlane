import { C, S, T } from '@/constants/design';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const translateY = useSharedValue(-48);

  useEffect(() => {
    translateY.value = withTiming(isOnline ? -48 : 0, { duration: 280 });
  }, [isOnline]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.banner, animStyle]} pointerEvents="none">
      <View style={styles.dot} />
      <Text style={styles.text}>No internet — showing cached data</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(255,107,107,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.xs,
    zIndex: 100,
    paddingTop: 4,
  } as any,
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.white,
    opacity: 0.85,
  },
  text: { ...T.small, color: C.white, fontWeight: '600' as const } as any,
});
