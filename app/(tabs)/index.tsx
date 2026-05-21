import Calendar from '@/components/calendar';
import DatePickerField from '@/components/date-picker-field';
import EventDetailsModal from '@/components/event-details-modal';
import SkeletonBlock from '@/components/skeleton-block';
import { C, glass, glassStrong, R, S, serif, shadow, spring, T, TAB_BAR_HEIGHT } from '@/constants/design';
import { useAuth } from '@/hooks/useAuth';
import { deleteEvent, subscribeToEvents, subscribeToGifts, subscribeToUserProfile, updateEvent } from '@/lib/firestore';
import { toast } from '@/lib/toast';
import type { EventItem, Gift } from '@/types/firebase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Animated, {
  FadeIn, FadeInDown, FadeInLeft, FadeInRight, FadeInUp,
  useAnimatedStyle, useSharedValue,
  withDelay, withSpring, withTiming,
} from 'react-native-reanimated';

const TODAY = new Date();
const DATE_LABEL = TODAY.toLocaleDateString('en-US', {
  weekday: 'long', day: 'numeric', month: 'long',
}).toUpperCase();


function BentoCardLarge({ value, label, color, icon, delay = 0, onPress }: {
  value: number; label: string; color: string; icon: string; delay?: number; onPress?: () => void;
}) {
  return (
    <Animated.View entering={FadeInLeft.duration(600).delay(delay)} style={[styles.bentoLarge, glass]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onPress} />
      <Text style={styles.bentoLargeIcon}>{icon}</Text>
      <Text style={[styles.bentoLargeValue, { color }]}>{value}</Text>
      <Text style={styles.bentoLargeLabel}>{label}</Text>
      <View style={[styles.bentoAccent, { backgroundColor: color }]} />
    </Animated.View>
  );
}

function BentoCardSmall({ value, label, color, icon, delay = 0, onPress }: {
  value: number; label: string; color: string; icon: string; delay?: number; onPress?: () => void;
}) {
  return (
    <Animated.View entering={FadeInRight.duration(600).delay(delay)} style={[styles.bentoSmall, glass]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onPress} />
      <View style={styles.bentoSmallRow}>
        <View>
          <Text style={[styles.bentoSmallValue, { color }]}>{value}</Text>
          <Text style={styles.bentoSmallLabel}>{label}</Text>
        </View>
        <Text style={styles.bentoSmallIcon}>{icon}</Text>
      </View>
      <View style={[styles.bentoAccent, { backgroundColor: color }]} />
    </Animated.View>
  );
}

export default function HomeScreen() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [giftsReady, setGiftsReady] = useState(false);
  const [eventsReady, setEventsReady] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [editEventForm, setEditEventForm] = useState({ name: '', description: '', date: null as Date | null });
  const { uid, user } = useAuth();
  const router = useRouter();

  const heroOpacity = useSharedValue(0);
  const heroY = useSharedValue(32);

  useEffect(() => {
    if (!uid) return;
    const unsubProfile = subscribeToUserProfile(uid, setUserProfile);
    const unsubGifts = subscribeToGifts(uid, (g) => { setGifts(g); setGiftsReady(true); });
    const unsubEvents = subscribeToEvents(uid, (e) => { setEvents(e); setEventsReady(true); });
    heroOpacity.value = withDelay(80, withTiming(1, { duration: 800 }));
    heroY.value = withDelay(80, withSpring(0, spring.gentle));
    return () => { unsubProfile(); unsubGifts(); unsubEvents(); };
  }, [uid]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = userProfile?.displayName || user?.displayName || 'Friend';
  const reservedCount = gifts.filter(g => g.reservedBy).length;
  const upcomingCount = events.filter(ev => {
    const d = ev.expirationDate as any;
    const date = d?.toDate ? d.toDate() : new Date(d);
    return date >= TODAY;
  }).length;

  const handleDeleteEvent = (eventId: string) => {
    if (!uid) return;
    Alert.alert('Delete Event', 'Delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteEvent(uid, eventId);
            setShowEventModal(false);
            setSelectedEvent(null);
          } catch { toast.error('Failed to delete event'); }
        },
      },
    ]);
  };

  const handleEditEvent = (event: EventItem) => {
    const raw = event.expirationDate;
    const date = raw
      ? ((raw as any).toDate ? (raw as any).toDate() : new Date(raw as any))
      : null;
    setEditEventForm({ name: event.name, description: event.description ?? '', date });
    setEditingEvent(event);
  };

  const saveEditEvent = async () => {
    if (!uid || !editingEvent) return;
    if (!editEventForm.name.trim()) { toast.error('Event name is required'); return; }
    try {
      await updateEvent(uid, editingEvent.id, {
        name: editEventForm.name.trim(),
        description: editEventForm.description,
        expirationDate: editEventForm.date ?? null,
      });
      setSelectedEvent((prev) =>
        prev?.id === editingEvent.id
          ? { ...prev, name: editEventForm.name.trim(), description: editEventForm.description, expirationDate: editEventForm.date }
          : prev,
      );
      setEditingEvent(null);
    } catch { toast.error('Failed to update event'); }
  };

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }));

  return (
    <View style={styles.root}>
      {/* Ambient depth orbs */}
      <View style={styles.blobRose} />
      <View style={styles.blobTeal} />
      <View style={styles.blobGold} />
      <View style={styles.blobPurple} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ───────────────────────────────────────────── */}
        <Animated.View style={[styles.hero, heroStyle]}>
          {/* Eyebrow — date + greeting */}
          <Animated.Text style={styles.eyebrow} entering={FadeIn.duration(500).delay(200)}>
            {DATE_LABEL}
          </Animated.Text>

          {/* Gold thin rule */}
          <Animated.View style={styles.eyebrowRule} entering={FadeInLeft.duration(400).delay(320)} />

          {/* Name — serif editorial */}
          <Animated.Text style={styles.heroName} entering={FadeInDown.duration(700).delay(260)}>
            {getGreeting()},{'\n'}{displayName}.
          </Animated.Text>

          {/* Subline */}
          {upcomingCount > 0 && (
            <Animated.View style={styles.heroBadge} entering={FadeIn.duration(400).delay(600)}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>
                {upcomingCount} event{upcomingCount > 1 ? 's' : ''} coming up
              </Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* ── Bento stats grid ───────────────────────────────── */}
        <View style={styles.bentoGrid}>
          {giftsReady ? (
            <BentoCardLarge
              icon="✦" value={gifts.length} label="GIFTS" color={C.rose} delay={340}
              onPress={() => router.push('/(tabs)/gifts')}
            />
          ) : (
            <Animated.View entering={FadeIn.duration(300)} style={[styles.bentoLarge, glass as any]}>
              <SkeletonBlock width="40%" height={12} radius={R.xs} />
              <SkeletonBlock width="55%" height={44} radius={R.sm} />
              <SkeletonBlock width="35%" height={10} radius={R.xs} />
            </Animated.View>
          )}
          <View style={styles.bentoColumn}>
            {eventsReady ? (
              <BentoCardSmall
                icon="◇" value={events.length} label="EVENTS" color={C.teal} delay={420}
                onPress={() => router.push('/(tabs)/events')}
              />
            ) : (
              <Animated.View entering={FadeIn.duration(300)} style={[styles.bentoSmall, glass as any]}>
                <SkeletonBlock width="60%" height={28} radius={R.sm} />
                <SkeletonBlock width="45%" height={10} radius={R.xs} />
              </Animated.View>
            )}
            {giftsReady ? (
              <BentoCardSmall
                icon="✦" value={reservedCount} label="RESERVED" color={C.goldLux} delay={500}
                onPress={() => router.push('/(tabs)/shared')}
              />
            ) : (
              <Animated.View entering={FadeIn.duration(300)} style={[styles.bentoSmall, glass as any]}>
                <SkeletonBlock width="60%" height={28} radius={R.sm} />
                <SkeletonBlock width="45%" height={10} radius={R.xs} />
              </Animated.View>
            )}
          </View>
        </View>

        {/* ── Upcoming events ────────────────────────────────── */}
        {events.filter(ev => {
          const d = ev.expirationDate as any;
          if (!d) return true;
          const date = d?.toDate ? d.toDate() : new Date(d);
          return date >= TODAY;
        }).slice(0, 3).length > 0 && (
          <Animated.View entering={FadeIn.duration(600).delay(520)}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionLabel}>UPCOMING</Text>
              <View style={styles.sectionRule} />
              <Pressable onPress={() => router.push('/(tabs)/events')} hitSlop={8}>
                <Text style={styles.sectionSeeAll}>See all →</Text>
              </Pressable>
            </View>
            {events
              .filter(ev => {
                const d = ev.expirationDate as any;
                if (!d) return true;
                const date = d?.toDate ? d.toDate() : new Date(d);
                return date >= TODAY;
              })
              .sort((a, b) => {
                const da = (a.expirationDate as any);
                const db = (b.expirationDate as any);
                if (!da && !db) return 0;
                if (!da) return 1;
                if (!db) return -1;
                const ta = (da?.toDate ? da.toDate() : new Date(da)).getTime();
                const tb = (db?.toDate ? db.toDate() : new Date(db)).getTime();
                return ta - tb;
              })
              .slice(0, 3)
              .map((ev, i) => {
                const raw = ev.expirationDate as any;
                const date = raw ? (raw?.toDate ? raw.toDate() : new Date(raw)) : null;
                const diffDays = date ? Math.ceil((date.getTime() - TODAY.getTime()) / 86400000) : null;
                const countdown = diffDays === null ? 'No date'
                  : diffDays === 0 ? 'Today!'
                  : diffDays === 1 ? 'Tomorrow'
                  : `${diffDays}d away`;
                const giftCount = gifts.filter(g => g.eventId === ev.id).length;
                return (
                  <Animated.View key={ev.id} entering={FadeInUp.duration(400).delay(540 + i * 60)}>
                    <Pressable style={styles.upcomingCard} onPress={() => { setSelectedEvent(ev); setShowEventModal(true); }}>
                      <View style={styles.upcomingLeft}>
                        <Text style={styles.upcomingName} numberOfLines={1}>{ev.name}</Text>
                        {!!ev.description && <Text style={styles.upcomingDesc} numberOfLines={1}>{ev.description}</Text>}
                        {giftCount > 0 && <Text style={styles.upcomingGifts}>{giftCount} gift{giftCount !== 1 ? 's' : ''}</Text>}
                      </View>
                      <View style={styles.upcomingRight}>
                        <Text style={[styles.upcomingCountdown, diffDays !== null && diffDays <= 3 ? { color: C.rose } : { color: C.teal }]}>
                          {countdown}
                        </Text>
                        {date && <Text style={styles.upcomingDate}>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>}
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })
            }
          </Animated.View>
        )}

        {/* ── Calendar ───────────────────────────────────────── */}
        <Animated.View entering={FadeIn.duration(700).delay(540)}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionLabel}>CALENDAR</Text>
            <View style={styles.sectionRule} />
          </View>
          <Calendar
            events={events}
            gifts={gifts}
            onEventPress={(evt) => { setSelectedEvent(evt); setShowEventModal(true); }}
            onDatePress={() => {}}
          />
        </Animated.View>

        <View style={{ height: TAB_BAR_HEIGHT + S.xl }} />
      </ScrollView>

      {/* ── Modals ─────────────────────────────────────────── */}
      <EventDetailsModal
        visible={showEventModal}
        event={selectedEvent}
        gifts={gifts}
        onClose={() => setShowEventModal(false)}

        onDelete={handleDeleteEvent}
        onEdit={handleEditEvent}
        uid={uid}
        displayName={user?.displayName}
      />

      <Modal visible={!!editingEvent} transparent animationType="slide" onRequestClose={() => setEditingEvent(null)}>
        <KeyboardAvoidingView style={styles.modalBg} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit Event</Text>
              <Pressable onPress={() => setEditingEvent(null)} style={styles.sheetClose}>
                <Text style={styles.sheetCloseText}>✕</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.input} placeholder="Event name" placeholderTextColor={C.t3}
              value={editEventForm.name} onChangeText={(t) => setEditEventForm({ ...editEventForm, name: t })}
            />
            <TextInput
              style={[styles.input, { height: 80 }]} placeholder="Description"
              placeholderTextColor={C.t3} value={editEventForm.description}
              onChangeText={(t) => setEditEventForm({ ...editEventForm, description: t })} multiline
            />
            <DatePickerField
              value={editEventForm.date}
              onChange={(d) => setEditEventForm({ ...editEventForm, date: d })}
              style={styles.input}
            />
            <Pressable style={styles.primaryBtn} onPress={saveEditEvent}>
              <Text style={styles.primaryBtnText}>Save Changes</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' } as any,

  // ── Ambient orbs ────────────────────────────────────────────
  blobRose: {
    position: 'absolute', width: 420, height: 420, borderRadius: 210,
    backgroundColor: 'rgba(255,107,129,0.14)', top: -140, left: -120,
    filter: 'blur(100px)',
  } as any,
  blobTeal: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(90,240,208,0.09)', top: 200, right: -100,
    filter: 'blur(90px)',
  } as any,
  blobGold: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(200,169,90,0.12)', top: 90, left: '40%',
    filter: 'blur(70px)',
  } as any,
  blobPurple: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(138,90,255,0.08)', top: 580, left: -40,
    filter: 'blur(80px)',
  } as any,

  scroll: { paddingTop: 88, paddingHorizontal: S.md },

  // ── Hero ────────────────────────────────────────────────────
  hero: { marginBottom: S.xl + 4 },
  eyebrow: {
    fontSize: 10, fontWeight: '700' as const, letterSpacing: 2.4,
    color: C.taupe, marginBottom: 10,
  },
  eyebrowRule: {
    height: 1, width: 48, backgroundColor: C.goldLux,
    marginBottom: 14, opacity: 0.7, borderRadius: 1,
  },
  heroName: {
    fontFamily: serif,
    fontSize: 44,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    color: C.cream,
    lineHeight: 50,
    marginBottom: 16,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.goldLuxDim,
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: R.full,
    borderWidth: 1, borderColor: C.goldLux + '40',
  },
  heroBadgeDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: C.goldLux,
  },
  heroBadgeText: {
    fontSize: 11, fontWeight: '600' as const,
    color: C.goldLux, letterSpacing: 0.4,
  },

  // ── Bento grid ──────────────────────────────────────────────
  bentoGrid: {
    flexDirection: 'row', gap: S.sm,
    marginBottom: S.xl,
    height: 180,
  },
  bentoLarge: {
    flex: 1.15,
    borderRadius: R.xl,
    padding: S.md,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  bentoLargeIcon: { fontSize: 28, marginBottom: 8 },
  bentoLargeValue: {
    fontSize: 52, fontWeight: '800' as const, letterSpacing: -2,
    lineHeight: 52, marginBottom: 4,
  },
  bentoLargeLabel: {
    fontSize: 10, fontWeight: '700' as const, letterSpacing: 2,
    color: C.taupe,
  },

  bentoColumn: { flex: 1, gap: S.sm },
  bentoSmall: {
    flex: 1,
    borderRadius: R.xl,
    padding: S.md,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  bentoSmallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bentoSmallValue: {
    fontSize: 30, fontWeight: '800' as const, letterSpacing: -1,
    lineHeight: 30,
  },
  bentoSmallLabel: {
    fontSize: 9, fontWeight: '700' as const, letterSpacing: 1.8,
    color: C.taupe, marginTop: 2,
  },
  bentoSmallIcon: { fontSize: 22, opacity: 0.7 },

  bentoAccent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 2, opacity: 0.6,
  },

  // ── Section heading ─────────────────────────────────────────
  sectionHead: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: S.sm,
  },
  sectionDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: C.goldLux,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '700' as const, letterSpacing: 2.4,
    color: C.taupe,
  },
  sectionRule: { flex: 1, height: 1, backgroundColor: C.border },

  // ── Modals ──────────────────────────────────────────────────
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' },
  modalSheet: {
    ...glassStrong,
    borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl,
    padding: S.lg, paddingBottom: S.xxl,
    borderBottomWidth: 0,
    ...shadow.lg,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: 'center', marginBottom: S.md,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: S.md,
  },
  sheetTitle: { ...T.h2, color: C.cream },
  sheetClose: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  sheetCloseText: { ...T.body, color: C.t3 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: R.md, borderWidth: 1,
    borderColor: C.border, color: C.t1,
    padding: S.md, marginBottom: S.sm, ...T.body,
  },
  primaryBtn: {
    backgroundColor: C.rose, borderRadius: R.lg,
    paddingVertical: 16, alignItems: 'center',
    marginTop: S.sm, ...shadow.glow,
  },
  primaryBtnText: { ...T.h3, color: C.white },

  upcomingCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: R.lg, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: S.md, paddingVertical: S.sm,
    marginBottom: S.xs, ...shadow.sm,
  } as any,
  upcomingLeft: { flex: 1, gap: 2 },
  upcomingName: { ...T.h3, color: C.cream } as any,
  upcomingDesc: { ...T.micro, color: C.t3 } as any,
  upcomingGifts: { fontSize: 10, color: C.rose, fontWeight: '600' as const, marginTop: 2 },
  upcomingRight: { alignItems: 'flex-end', gap: 2, marginLeft: S.sm },
  upcomingCountdown: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.3 },
  upcomingDate: { fontSize: 10, color: C.t3, letterSpacing: 0.3 },
  sectionSeeAll: { fontSize: 11, fontWeight: '600' as const, color: C.rose, letterSpacing: 0.3 },
});
