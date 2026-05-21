import Ionicons from '@expo/vector-icons/Ionicons';
import { C, glass, R, S, shadow, SCREEN, spring, T, TAB_BAR_HEIGHT } from '@/constants/design';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToPendingRequests } from '@/lib/firestore';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

/* ─── Tab definitions ─────────────────────────────────────── */
const TABS = [
  { name: 'index',   iconOn: 'home',     iconOff: 'home-outline',     label: 'Home'    },
  { name: 'gifts',   iconOn: 'gift',     iconOff: 'gift-outline',     label: 'Gifts'   },
  { name: 'events',  iconOn: 'calendar', iconOff: 'calendar-outline', label: 'Events'  },
  { name: 'friends', iconOn: 'people',   iconOff: 'people-outline',   label: 'Friends' },
  { name: 'shared',  iconOn: 'heart',    iconOff: 'heart-outline',    label: 'Shared'  },
] as const;

const NUM  = TABS.length;
const TAB_W = (SCREEN.width - 32) / NUM;   // 16px padding each side
const PILL_W = TAB_W - 8;
const PILL_H = 48;

/* ─── Single tab button ────────────────────────────────────── */
function TabBtn({
  tab, isFocused, onPress, badge,
}: {
  tab: (typeof TABS)[number];
  isFocused: boolean;
  onPress: () => void;
  badge?: number;
}) {
  const prog = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    prog.value = withSpring(isFocused ? 1 : 0, spring.snappy);
  }, [isFocused]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(prog.value, [0, 1], [0.92, 1.04]) }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(prog.value, [0, 1], [0.32, 1]),
    transform: [{ translateY: interpolate(prog.value, [0, 1], [4, 0]) }],
    color: interpolateColor(prog.value, [0, 1], [C.t3, C.rose]),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: prog.value,
    transform: [{ scale: prog.value }],
  }));

  return (
    <Pressable style={styles.tabBtn} onPress={onPress}>
      <Animated.View style={[styles.tabBtnInner, wrapStyle]}>
        <View>
          <Ionicons
            name={(isFocused ? tab.iconOn : tab.iconOff) as any}
            size={21}
            color={isFocused ? C.rose : C.t3}
          />
          {!!badge && badge > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{badge > 9 ? '9+' : badge}</Text>
            </View>
          )}
        </View>
        <Animated.Text style={[styles.tabLabel, labelStyle]}>
          {tab.label}
        </Animated.Text>
        <Animated.View style={[styles.dot, dotStyle]} />
      </Animated.View>
    </Pressable>
  );
}

/* ─── Custom animated tab bar ──────────────────────────────── */
function AnimatedTabBar({ state, navigation, insets }: any) {
  const { uid } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!uid) { setPendingCount(0); return; }
    return subscribeToPendingRequests(uid, (requests) => setPendingCount(requests.length));
  }, [uid]);

  const visibleRoutes = state.routes.filter((r: any) =>
    TABS.some((t) => t.name === r.name)
  );

  const activeIdx = visibleRoutes.findIndex(
    (r: any) => r.key === state.routes[state.index]?.key
  );
  const safeIdx = Math.max(0, activeIdx);

  const indicatorX = useSharedValue(safeIdx * TAB_W + 4);

  useEffect(() => {
    indicatorX.value = withSpring(safeIdx * TAB_W + 4, spring.snappy);
  }, [safeIdx]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const safeBottom = Math.max(insets?.bottom ?? 0, 8);

  return (
    <View style={[styles.outer, { paddingBottom: safeBottom }]}>
      <View style={styles.pill}>
        {/* Sliding background highlight */}
        <Animated.View style={[styles.indicator, indicatorStyle]} />

        {TABS.map((tab, index) => {
          const route = visibleRoutes[index];
          if (!route) return null;
          return (
            <TabBtn
              key={tab.name}
              tab={tab}
              isFocused={safeIdx === index}
              onPress={() => {
                if (safeIdx !== index) navigation.navigate(route.name);
              }}
              badge={tab.name === 'friends' ? pendingCount : undefined}
            />
          );
        })}
      </View>
    </View>
  );
}

/* ─── Layout ───────────────────────────────────────────────── */
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Home'    }} />
      <Tabs.Screen name="gifts"   options={{ title: 'Gifts'   }} />
      <Tabs.Screen name="events"  options={{ title: 'Events'  }} />
      <Tabs.Screen name="friends" options={{ title: 'Friends' }} />
      <Tabs.Screen name="shared"  options={{ title: 'Shared'  }} />
      {/* Hidden from tab bar */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="drag"    options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

/* ─── Styles ───────────────────────────────────────────────── */
const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: S.md,
    paddingTop: S.sm,
    backgroundColor: 'transparent',
  },
  pill: {
    ...glass,
    borderRadius: R.full,
    height: TAB_BAR_HEIGHT - S.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
    ...shadow.lg,
  } as any,
  indicator: {
    position: 'absolute',
    top: 6,
    width: PILL_W,
    height: PILL_H,
    borderRadius: R.full,
    backgroundColor: 'rgba(255,107,129,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,129,0.28)',
  } as any,
  tabBtn: {
    width: TAB_W,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    ...T.micro,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.rose,
    marginTop: 1,
  },
  tabBadge: {
    position: 'absolute',
    top: -4, right: -6,
    minWidth: 14, height: 14,
    borderRadius: 7,
    backgroundColor: C.rose,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5, borderColor: C.bg,
  },
  tabBadgeText: { color: C.white, fontSize: 8, fontWeight: '800' as const },
});
