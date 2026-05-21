import AmbientBg from '@/components/ambient-bg';
import { C, R, S, shadow, T, TAB_BAR_HEIGHT } from '@/constants/design';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface Section {
  title: string;
  icon: string;
  items: string[];
}

const SECTIONS: Section[] = [
  {
    title: 'Managing Gifts',
    icon: '◈',
    items: [
      'Tap the + button on the Gifts tab to add a gift.',
      'Choose a type — Online (link), Brand, or Place.',
      'Add a price, category photo, and description.',
      'Edit or delete gifts with the buttons on each card.',
    ],
  },
  {
    title: 'Organizing Events',
    icon: '◉',
    items: [
      'Create events on the Events tab (birthday, holiday, etc.).',
      'Set an expiration date so friends know when to shop.',
      'Assign gifts to events using the Assign button on each gift.',
      'Tap a card to see its full detail, edit, or delete it.',
    ],
  },
  {
    title: 'Sharing with Friends',
    icon: '◎',
    items: [
      'Search for friends by email on the Friends tab.',
      'Send a friend request — they accept from their Friends tab.',
      'Open any event and use the Share section to share it.',
      'Shared events appear in your friends\' Shared tab.',
    ],
  },
  {
    title: 'Reserving Gifts',
    icon: '◇',
    items: [
      'Open a shared event on the Shared tab.',
      'Tap Reserve on a gift to claim it — friends won\'t see your choice.',
      'Tap Undo to release your reservation.',
      'Taken gifts are dimmed so nothing gets bought twice.',
    ],
  },
  {
    title: 'Notifications',
    icon: '◆',
    items: [
      'Tap the bell in the top-right corner to open your inbox.',
      'Friend requests, shares, and gift reservations all appear here.',
      'Swipe left on a notification to delete it.',
      'Tap Mark all read to clear the badge.',
    ],
  },
  {
    title: 'Privacy & Security',
    icon: '◈',
    items: [
      'All data is stored securely in Firebase — owner-scoped by default.',
      'Only friends can see events you explicitly share.',
      'Reservation data is hidden from the gift owner.',
      'Sign in with Google or email — no password stored locally.',
    ],
  },
];

function AccordionSection({ section, delay }: { section: Section; delay: number }) {
  const [open, setOpen] = useState(false);
  const rotation = useSharedValue(0);

  const toggle = () => {
    setOpen((prev) => !prev);
    rotation.value = withSpring(open ? 0 : 1, { damping: 14, stiffness: 140 });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 90}deg` }],
  }));

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay)} style={styles.section}>
      <Pressable onPress={toggle} style={styles.sectionHeader}>
        <View style={styles.sectionLeft}>
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>{section.icon}</Text>
          </View>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        <Animated.Text style={[styles.chevron, chevronStyle]}>›</Animated.Text>
      </Pressable>

      {open && (
        <Animated.View entering={FadeIn.duration(250)} style={styles.sectionBody}>
          {section.items.map((item, i) => (
            <View key={i} style={styles.item}>
              <View style={styles.itemDot} />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function ExploreScreen() {
  return (
    <View style={styles.root}>
      <AmbientBg preset="mixed" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <Text style={styles.eyebrow}>GUIDE</Text>
          <View style={styles.eyebrowRule} />
          <Text style={styles.screenTitle}>How to Use</Text>
          <Text style={styles.screenSub}>Everything you need to know about Wishlane.</Text>
        </Animated.View>

        {/* Accordion sections */}
        {SECTIONS.map((s, i) => (
          <AccordionSection key={s.title} section={s} delay={i * 60} />
        ))}

        <View style={{ height: TAB_BAR_HEIGHT + S.lg }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' } as any,

  scroll: { paddingHorizontal: S.md, paddingTop: 56 },

  header: { marginBottom: S.xl },
  eyebrow: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 2.4, color: C.taupe, marginBottom: 6 },
  eyebrowRule: { height: 1, width: 36, backgroundColor: C.goldLux, marginBottom: 10, opacity: 0.6, borderRadius: 1 },
  screenTitle: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.8, color: C.cream, lineHeight: 36, marginBottom: S.xs },
  screenSub: { ...T.body, color: C.t3 } as any,

  section: {
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: S.sm,
    overflow: 'hidden',
    ...shadow.sm,
  } as any,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: S.md,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: S.sm, flex: 1 },
  iconWrap: {
    width: 34, height: 34, borderRadius: R.sm,
    backgroundColor: 'rgba(200,169,90,0.12)',
    borderWidth: 1, borderColor: 'rgba(200,169,90,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconText: { fontSize: 14, color: C.goldLux },
  sectionTitle: { ...T.h3, color: C.cream, flex: 1 } as any,
  chevron: { fontSize: 22, color: C.t3, lineHeight: 24 },

  sectionBody: {
    paddingHorizontal: S.md,
    paddingBottom: S.md,
    gap: S.xs,
  },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm },
  itemDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: C.goldLux,
    marginTop: 7, flexShrink: 0,
  },
  itemText: { ...T.small, color: C.t2, flex: 1, lineHeight: 20 } as any,
});
