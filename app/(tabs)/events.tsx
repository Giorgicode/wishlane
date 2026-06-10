import AmbientBg from '@/components/ambient-bg';
import Calendar from '@/components/calendar';
import SkeletonBlock from '@/components/skeleton-block';
import DatePickerField from '@/components/date-picker-field';
import EventDetailsModal from '@/components/event-details-modal';
import { C, glass, glassStrong, R, S, SCREEN, shadow, spring, T, TAB_BAR_HEIGHT } from '@/constants/design';
import { useAuth } from '@/hooks/useAuth';
import {
  createEvent, deleteEvent, getEventSharedWith,
  shareEventWithUserByEmail, subscribeToEventAnalytics,
  subscribeToFriends,
  unshareEventWithUser, updateEvent,
} from '@/lib/firestore';
import { useAppData } from '@/contexts/AppDataContext';
import { toast } from '@/lib/toast';
import type { EventAnalytic, EventItem, EventShare, Friend, Gift } from '@/types/firebase';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import {
  Alert, FlatList, Image, KeyboardAvoidingView, Modal,
  Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Animated, {
  FadeIn, FadeInUp, FadeOut,
  interpolate, interpolateColor,
  useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';

const FAB_SIZE = 60;
const FAB_EXPANDED_W = SCREEN.width - 32;
const FAB_EXPANDED_H = 380;

const CARD_W = SCREEN.width - 48;
const CARD_H = 360;
const SPHERE = 168;

/* ─── Photo-driven scene data ───────────────────────────────── */
const SCENES = [
  {
    uri: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=600&q=80',
    title: 'Birthday Soirée',
    sub: 'Craft the perfect celebration',
    accent: '#FF6B81',
    tag: 'BIRTHDAY',
  },
  {
    uri: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=600&q=80',
    title: 'Night Out',
    sub: 'Champagne & electric energy',
    accent: '#5AF0D0',
    tag: 'NIGHTLIFE',
  },
  {
    uri: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=600&q=80',
    title: 'Christmas Magic',
    sub: 'Snow, warmth & wonder',
    accent: '#FFD060',
    tag: 'HOLIDAY',
  },
  {
    uri: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=600&q=80',
    title: 'Ski Weekend',
    sub: 'Peaks, powder & prestige',
    accent: '#8BB4FF',
    tag: 'ADVENTURE',
  },
  {
    uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    title: 'Beach Party',
    sub: 'Sun-kissed & effortless',
    accent: '#FFB347',
    tag: 'SUMMER',
  },
];

function EventsEmptyState() {
  const [idx, setIdx] = useState(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    // Subtle breathing ring pulse
    ringScale.value = withRepeat(
      withSequence(withTiming(1.04, { duration: 2200 }), withTiming(1, { duration: 2200 })),
      -1, false,
    );
    const iv = setInterval(() => {
      opacity.value = withTiming(0, { duration: 350 });
      scale.value = withTiming(0.95, { duration: 350 });
      setTimeout(() => {
        setIdx(i => (i + 1) % SCENES.length);
        opacity.value = withTiming(1, { duration: 500 });
        scale.value = withSpring(1, { damping: 14, stiffness: 180 });
      }, 380);
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  const scene = SCENES[idx];
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <View style={sceneStyles.root}>
      {/* Scene card */}
      <Animated.View style={[sceneStyles.card, cardStyle]}>
        {/* Full-bleed blurred photo background */}
        <Image
          source={{ uri: scene.uri }}
          style={StyleSheet.absoluteFill}
          blurRadius={18}
          resizeMode="cover"
        />
        {/* Dark vignette layered over blur */}
        <View style={sceneStyles.vignette} />
        {/* Accent color tint */}
        <View style={[sceneStyles.accentTint, { backgroundColor: scene.accent + '18' }]} />

        {/* Top tag */}
        <View style={[sceneStyles.tag, { borderColor: scene.accent + '50', backgroundColor: scene.accent + '18' }]}>
          <Text style={[sceneStyles.tagText, { color: scene.accent }]}>{scene.tag}</Text>
        </View>

        {/* Sphere — double ring + sharp photo */}
        <Animated.View style={[sceneStyles.ringOuter, { borderColor: scene.accent + '35' }, ringStyle]}>
          <View style={[sceneStyles.ringInner, { borderColor: scene.accent + '60' }]}>
            <Image
              source={{ uri: scene.uri }}
              style={sceneStyles.sphereImage}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        {/* Text */}
        <Text style={[sceneStyles.title, { color: scene.accent }]}>{scene.title}</Text>
        <Text style={sceneStyles.sub}>{scene.sub}</Text>

        {/* Dot indicators */}
        <View style={sceneStyles.dots}>
          {SCENES.map((_, i) => (
            <View
              key={i}
              style={[
                sceneStyles.dot,
                {
                  backgroundColor: scene.accent,
                  width: i === idx ? 22 : 5,
                  opacity: i === idx ? 1 : 0.28,
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>

      <Animated.Text entering={FadeIn.duration(600).delay(400)} style={sceneStyles.hint}>
        Tap  +  to create your first event
      </Animated.Text>
    </View>
  );
}

const sceneStyles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingTop: S.lg,
    overflow: 'hidden',
    height: CARD_H + 80,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: R.xl + 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: S.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    ...shadow.lg,
    zIndex: 2,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,4,14,0.62)',
  },
  accentTint: {
    ...StyleSheet.absoluteFillObject,
  },

  tag: {
    position: 'absolute',
    top: S.md, left: S.md,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: R.full, borderWidth: 1,
  },
  tagText: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 1.8 },

  ringOuter: {
    width: SPHERE + 28, height: SPHERE + 28,
    borderRadius: (SPHERE + 28) / 2,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: S.lg,
    position: 'absolute',
    top: CARD_H / 2 - (SPHERE + 28) / 2 - 10,
  },
  ringInner: {
    width: SPHERE + 8, height: SPHERE + 8,
    borderRadius: (SPHERE + 8) / 2,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  sphereImage: {
    width: SPHERE, height: SPHERE,
    borderRadius: SPHERE / 2,
  },

  title: { ...T.h2, marginBottom: 4, zIndex: 3 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', zIndex: 3, marginBottom: S.sm },
  dots: { flexDirection: 'row', gap: 5, alignItems: 'center', zIndex: 3 },
  dot: { height: 5, borderRadius: R.full },
  hint: { ...T.small, color: C.t3, marginTop: S.md },
});

export default function EventsScreen() {
  const { events, eventsReady, gifts } = useAppData();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);

  // FAB form state
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', date: null as Date | null });

  // Share modal
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedEventForShare, setSelectedEventForShare] = useState<EventItem | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareMode, setShareMode] = useState<'friend' | 'email'>('friend');

  // Shared people modal
  const [sharedPeopleModalVisible, setSharedPeopleModalVisible] = useState(false);
  const [selectedEventForSharedPeople, setSelectedEventForSharedPeople] = useState<EventItem | null>(null);
  const [sharedPeople, setSharedPeople] = useState<EventShare[]>([]);
  const [loadingSharedPeople, setLoadingSharedPeople] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // Analytics modal
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);
  const [selectedEventForAnalytics, setSelectedEventForAnalytics] = useState<EventItem | null>(null);
  const [currentAnalytics, setCurrentAnalytics] = useState<EventAnalytic | null>(null);

  // Details modal
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<EventItem | null>(null);


  // Search
  const [searchQuery, setSearchQuery] = useState('');

  const { uid, user } = useAuth();

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter((e) =>
      e.name.toLowerCase().includes(q) ||
      (e.description ?? '').toLowerCase().includes(q),
    );
  }, [events, searchQuery]);
  const isOpen = useSharedValue(0);

  useEffect(() => {
    if (!uid) return;
    return subscribeToFriends(uid, setFriends);
  }, [uid]);

  useEffect(() => {
    if (!uid || !selectedEventForAnalytics) return;
    return subscribeToEventAnalytics(uid, selectedEventForAnalytics.id, setCurrentAnalytics);
  }, [uid, selectedEventForAnalytics?.id]);

  const openFAB = () => { setFormVisible(true); isOpen.value = withSpring(1, spring.snappy); };
  const closeFAB = () => { isOpen.value = withSpring(0, spring.fast); setTimeout(() => setFormVisible(false), 320); };

  const addEvent = async () => {
    if (!uid) return;
    if (!form.name.trim()) { toast.error('Event name is required'); return; }
    try {
      await createEvent(uid, { name: form.name, description: form.description, expirationDate: form.date });
      setForm({ name: '', description: '', date: null });
      closeFAB();
    } catch { toast.error('Failed to create event'); }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!uid) return;
    Alert.alert('Delete Event', 'This will permanently delete the event.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteEvent(uid, eventId); }
        catch { toast.error('Failed to delete event'); }
      }},
    ]);
  };

  const handleSaveEvent = async (eventId: string, patch: { name: string; description: string; expirationDate: Date | null }) => {
    if (!uid) return;
    await updateEvent(uid, eventId, patch);
  };

  const openShareModal = (evt: EventItem) => {
    setSelectedEventForShare(evt);
    setShareEmail('');
    setShareMode('friend');
    setShareModalVisible(true);
  };

  const openSharedPeopleModal = async (evt: EventItem) => {
    setSelectedEventForSharedPeople(evt);
    setLoadingSharedPeople(true);
    setSharedPeopleModalVisible(true);
    try {
      const shared = await getEventSharedWith(uid!, evt.id);
      setSharedPeople(shared);
    } catch { toast.error('Failed to load shared people'); }
    finally { setLoadingSharedPeople(false); }
  };

  const handleShareEvent = async () => {
    if (!uid || !selectedEventForShare) return;
    if (!shareEmail.trim()) { toast.error('Please select or enter an email'); return; }
    setIsSharing(true);
    try {
      await shareEventWithUserByEmail(uid, selectedEventForShare.id, shareEmail.trim(), user?.displayName ?? undefined);
      toast.success(`Shared with ${shareEmail.trim()}`);
      setShareModalVisible(false);
      setShareEmail('');
    } catch (err: any) { toast.error(err.message || 'Failed to share event'); }
    finally { setIsSharing(false); }
  };

  const handleRemoveSharedPerson = (share: EventShare) => {
    if (!uid || !selectedEventForSharedPeople) return;
    Alert.alert('Remove Access', `Remove ${share.sharedWithEmail}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        setRemovingUserId(share.id);
        try {
          await unshareEventWithUser(uid, selectedEventForSharedPeople.id, share.sharedWithUserId);
          setSharedPeople(sharedPeople.filter(s => s.id !== share.id));
        } catch { toast.error('Failed to remove access'); }
        finally { setRemovingUserId(null); }
      }},
    ]);
  };

  const handleCopyShareLink = () => {
    if (!selectedEventForSharedPeople?.shareCode) return;
    Clipboard.setStringAsync(`wishlane://event/${selectedEventForSharedPeople.shareCode}`)
      .then(() => toast.info('Share link copied to clipboard', 'Copied'))
      .catch(() => toast.error('Failed to copy link'));
  };

  const formatDate = (date: any) => {
    if (!date) return 'No date set';
    const d = (date as any).toDate ? (date as any).toDate() : new Date(date);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
    if (!hasTime) return dateStr;
    return `${dateStr} · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const isExpired = (date: any): boolean => {
    if (!date) return false;
    const d = (date as any).toDate ? (date as any).toDate() : new Date(date);
    return d < new Date();
  };

  // Morph styles
  const morphStyle = useAnimatedStyle(() => ({
    width: interpolate(isOpen.value, [0, 1], [FAB_SIZE, FAB_EXPANDED_W]),
    height: interpolate(isOpen.value, [0, 1], [FAB_SIZE, FAB_EXPANDED_H]),
    borderRadius: interpolate(isOpen.value, [0, 1], [FAB_SIZE / 2, R.xl]),
    backgroundColor: interpolateColor(isOpen.value, [0, 1], [C.rose, C.surface2]),
    borderWidth: interpolate(isOpen.value, [0, 1], [0, 1]),
    borderColor: C.borderMed,
  }));

  const plusStyle = useAnimatedStyle(() => ({
    opacity: interpolate(isOpen.value, [0, 0.25], [1, 0]),
    transform: [{ rotate: `${interpolate(isOpen.value, [0, 1], [0, 135])}deg` }],
  }));

  const formContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(isOpen.value, [0.45, 1], [0, 1]),
  }));

  return (
    <View style={styles.root}>
      <AmbientBg preset="mixed" />

      {!eventsReady && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.skeletonList}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={{ flex: 1, padding: S.md, gap: 8 }}>
                <SkeletonBlock width="55%" height={16} />
                <SkeletonBlock width="75%" height={11} />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <SkeletonBlock width={70} height={10} radius={R.full} />
                  <SkeletonBlock width={50} height={10} radius={R.full} />
                </View>
              </View>
              <View style={{ width: 60, justifyContent: 'space-around', alignItems: 'center', paddingVertical: S.sm }}>
                {[...Array(3)].map((_, j) => <SkeletonBlock key={j} width={28} height={8} radius={R.xs} />)}
              </View>
            </View>
          ))}
        </Animated.View>
      )}

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Animated.View entering={FadeIn.duration(400)}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>MY EVENTS</Text>
                <View style={styles.eyebrowRule} />
                <Text style={styles.screenTitle}>{events.length} {events.length === 1 ? 'Event' : 'Events'}</Text>
              </View>
              <Pressable onPress={() => setShowCalendar(!showCalendar)} style={styles.calendarToggle}>
                <Text style={styles.calendarToggleText}>{showCalendar ? 'List' : 'Cal'}</Text>
              </Pressable>
            </View>
            {showCalendar && (
              <Animated.View entering={FadeIn.duration(300)}>
                <Calendar events={events} gifts={[]} onEventPress={(evt) => { setSelectedEventForDetails(evt); setDetailsModalVisible(true); }} onDatePress={() => {}} />
              </Animated.View>
            )}
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search events…"
                placeholderTextColor={C.t3}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {!!searchQuery && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Text style={styles.searchClear}>✕</Text>
                </Pressable>
              )}
            </View>
          </Animated.View>
        }
        ListEmptyComponent={
          searchQuery ? (
            <View style={styles.emptySearch}>
              <Text style={styles.emptySearchText}>No events match "{searchQuery}"</Text>
            </View>
          ) : <EventsEmptyState />
        }
        renderItem={({ item }) => {
          const giftCount = gifts.filter((g) => g.eventId === item.id).length;
          return (
          <Animated.View entering={FadeInUp.duration(350)} style={[styles.card, isExpired(item.expirationDate) && { opacity: 0.65 }]}>
            <Pressable style={{ flex: 1 }} onPress={() => { setSelectedEventForDetails(item); setDetailsModalVisible(true); }}>
              <Text style={styles.cardName}>{item.name}</Text>
              {!!item.description && <Text style={styles.cardDesc}>{item.description}</Text>}
              <View style={styles.cardMeta}>
                <Text style={styles.cardDate}>{formatDate(item.expirationDate)}</Text>
                {giftCount > 0 && (
                  <View style={styles.giftCountPill}>
                    <Text style={styles.giftCountPillText}>{giftCount} {giftCount === 1 ? 'gift' : 'gifts'}</Text>
                  </View>
                )}
                {isExpired(item.expirationDate) && (
                  <View style={styles.expiredPill}>
                    <Text style={styles.expiredPillText}>Expired</Text>
                  </View>
                )}
                {item.sharedWith && item.sharedWith.length > 0 && (
                  <View style={styles.sharedPill}>
                    <Text style={styles.sharedPillText}>{item.sharedWith.length} shared</Text>
                  </View>
                )}
              </View>
            </Pressable>
            <View style={styles.cardActions}>
              <Pressable onPress={() => { if (selectedEventForAnalytics?.id !== item.id) { setCurrentAnalytics(null); } setSelectedEventForAnalytics(item); setAnalyticsModalVisible(true); }} hitSlop={6}>
                <Text style={styles.actionIcon}>Stats</Text>
              </Pressable>
              <Pressable onPress={() => openSharedPeopleModal(item)} hitSlop={6}>
                <Text style={styles.actionIcon}>Users</Text>
              </Pressable>
              <Pressable onPress={() => openShareModal(item)} hitSlop={6}>
                <Text style={styles.actionIcon}>Share</Text>
              </Pressable>
              <Pressable onPress={() => handleDeleteEvent(item.id)} hitSlop={6}>
                <Text style={styles.actionIcon}>Del</Text>
              </Pressable>
            </View>
          </Animated.View>
          );
        }}
      />

      {/* Backdrop */}
      {formVisible && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={closeFAB} />
        </Animated.View>
      )}

      {/* Morphing FAB */}
      <Animated.View style={[styles.fabShell, morphStyle]}>
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.fabCenter, plusStyle]} pointerEvents={formVisible ? 'none' : 'auto'}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={openFAB} />
          <Text style={styles.plusText}>+</Text>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.formInner, formContentStyle]} pointerEvents={formVisible ? 'box-none' : 'none'}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>New Event</Text>
            <Pressable onPress={closeFAB} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>
          <TextInput style={styles.formInput} placeholder="Event name *" placeholderTextColor={C.t3} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
          <TextInput style={[styles.formInput, { height: 64 }]} placeholder="Description" placeholderTextColor={C.t3} value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} multiline />
          <DatePickerField value={form.date} onChange={(d) => setForm({ ...form, date: d })} showTime placeholder="Event date & time (optional)" />
          <Pressable style={styles.submitBtn} onPress={addEvent}>
            <Text style={styles.submitBtnText}>Create Event</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* ── Share Modal ── */}
      <Modal visible={shareModalVisible} transparent animationType="slide" onRequestClose={() => setShareModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalBg} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Share Event</Text>
                <Text style={styles.sheetSub}>{selectedEventForShare?.name}</Text>
              </View>
              <Pressable onPress={() => setShareModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modeTabs}>
              {(['friend', 'email'] as const).map((m) => (
                <Pressable key={m} style={[styles.modeTab, shareMode === m && styles.modeTabActive]} onPress={() => setShareMode(m)}>
                  <Text style={[styles.modeTabText, shareMode === m && styles.modeTabTextActive]}>
                    {m === 'friend' ? 'Friends' : 'Email'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {shareMode === 'friend' ? (
              friends.length === 0 ? (
                <Text style={styles.emptyText}>No friends yet. Add friends first!</Text>
              ) : (
                <ScrollView style={styles.friendsList}>
                  {friends.map((f) => (
                    <Pressable key={f.id} style={[styles.friendOption, shareEmail === f.friendEmail && styles.friendOptionActive]} onPress={() => setShareEmail(f.friendEmail)}>
                      <View style={styles.friendInitial}><Text style={styles.friendInitialText}>{(f.friendName || f.friendEmail)[0].toUpperCase()}</Text></View>
                      <Text style={[styles.friendOptionText, shareEmail === f.friendEmail && styles.friendOptionTextActive]}>
                        {f.friendName || f.friendEmail}
                      </Text>
                      {shareEmail === f.friendEmail && <Text style={styles.checkmark}>✓</Text>}
                    </Pressable>
                  ))}
                </ScrollView>
              )
            ) : (
              <TextInput style={styles.sheetInput} placeholder="Email address" placeholderTextColor={C.t3} value={shareEmail} onChangeText={setShareEmail} autoCapitalize="none" editable={!isSharing} />
            )}

            <Pressable style={[styles.primaryBtn, isSharing && styles.btnDisabled]} onPress={handleShareEvent} disabled={isSharing}>
              <Text style={styles.primaryBtnText}>{isSharing ? 'Sharing…' : 'Share'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Analytics Modal ── */}
      <Modal visible={analyticsModalVisible} transparent animationType="slide" onRequestClose={() => setAnalyticsModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Analytics</Text>
                <Text style={styles.sheetSub}>{selectedEventForAnalytics?.name}</Text>
              </View>
              <Pressable onPress={() => setAnalyticsModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>
            {currentAnalytics ? (
              <>
                <View style={styles.analyticsRow}>
                  {[
                    { value: currentAnalytics.viewCount ?? 0, label: 'Views', color: C.teal },
                    { value: currentAnalytics.reservationCount ?? 0, label: 'Reserves', color: C.gold },
                    { value: currentAnalytics.viewedBy?.length ?? 0, label: 'Unique', color: C.rose },
                  ].map(({ value, label, color }) => (
                    <View key={label} style={[styles.analyticsCard, { borderColor: color + '44' }]}>
                      <Text style={[styles.analyticsValue, { color }]}>{value}</Text>
                      <Text style={styles.analyticsLabel}>{label}</Text>
                    </View>
                  ))}
                </View>
                {currentAnalytics.lastViewedAt && (
                  <Text style={styles.lastViewed}>Last viewed: {new Date(currentAnalytics.lastViewedAt as any).toLocaleString()}</Text>
                )}
              </>
            ) : (
              <View style={styles.analyticsEmpty}>
                <Text style={styles.emptyText}>No views yet</Text>
                <Text style={styles.emptySub}>Analytics appear once people view this event</Text>
              </View>
            )}
            <Pressable style={styles.ghostBtn} onPress={() => setAnalyticsModalVisible(false)}>
              <Text style={styles.ghostBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Event Details Modal ── */}
      <EventDetailsModal
        visible={detailsModalVisible}
        event={selectedEventForDetails}
        gifts={gifts}
        onClose={() => setDetailsModalVisible(false)}
        onSave={handleSaveEvent}
        onDelete={(eventId) => { setDetailsModalVisible(false); handleDeleteEvent(eventId); }}
        uid={uid}
        displayName={user?.displayName}
      />

      {/* ── Shared People Modal ── */}
      <Modal visible={sharedPeopleModalVisible} transparent animationType="slide" onRequestClose={() => setSharedPeopleModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>People with Access</Text>
                <Text style={styles.sheetSub}>{selectedEventForSharedPeople?.name}</Text>
              </View>
              <Pressable onPress={() => setSharedPeopleModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            {selectedEventForSharedPeople?.shareCode && (
              <View style={styles.shareLinkBox}>
                <Text style={styles.shareLinkText} numberOfLines={1}>
                  wishlane://event/{selectedEventForSharedPeople.shareCode}
                </Text>
                <Pressable onPress={handleCopyShareLink} hitSlop={8} style={styles.copyBtn}>
                  <Text style={styles.copyBtnText}>Copy</Text>
                </Pressable>
              </View>
            )}

            {loadingSharedPeople ? (
              <Text style={[styles.emptySub, { textAlign: 'center', marginTop: S.xl }]}>Loading…</Text>
            ) : sharedPeople.length === 0 ? (
              <Text style={[styles.emptySub, { textAlign: 'center', marginTop: S.xl }]}>Not shared with anyone yet</Text>
            ) : (
              <ScrollView style={{ maxHeight: 240, marginTop: S.sm }}>
                {sharedPeople.map((share) => (
                  <View key={share.id} style={styles.personRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.personEmail}>{share.sharedWithEmail}</Text>
                      <Text style={styles.personBy}>Shared by {share.sharedByName || 'you'}</Text>
                    </View>
                    <Pressable onPress={() => handleRemoveSharedPerson(share)} disabled={removingUserId === share.id} hitSlop={8}>
                      <Text style={styles.removeText}>{removingUserId === share.id ? '…' : '✕'}</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}

            <Pressable style={styles.ghostBtn} onPress={() => setSharedPeopleModalVisible(false)}>
              <Text style={styles.ghostBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' } as any,
  listContent: { paddingHorizontal: S.md, paddingTop: 80, paddingBottom: TAB_BAR_HEIGHT + FAB_SIZE + 32 },
  skeletonList: { position: 'absolute', top: 80, left: S.md, right: S.md, gap: S.sm, zIndex: 1 },
  skeletonCard: {
    flexDirection: 'row', borderRadius: R.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderLeftColor: 'rgba(255,107,129,0.2)', borderLeftWidth: 3,
  },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: S.lg },
  eyebrow: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 2.4, color: C.taupe, marginBottom: 8 },
  eyebrowRule: { height: 1, width: 40, backgroundColor: C.rose, marginBottom: 12, opacity: 0.6, borderRadius: 1 },
  screenTitle: { fontSize: 40, fontWeight: '800' as const, letterSpacing: -1.2, color: C.cream, lineHeight: 42 },
  calendarToggle: { ...glass, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 8, marginBottom: 4 } as any,
  calendarToggleText: { fontSize: 11, fontWeight: '700' as const, color: C.t2, letterSpacing: 0.5 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: R.lg, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: S.sm, paddingVertical: 10,
    marginBottom: S.md, gap: S.xs,
  },
  searchIcon: { fontSize: 16, color: C.t3 },
  searchInput: { flex: 1, ...T.small, color: C.cream } as any,
  searchClear: { ...T.small, color: C.t3, paddingHorizontal: 4 } as any,
  emptySearch: { alignItems: 'center' as const, paddingTop: S.xl },
  emptySearchText: { ...T.body, color: C.t3, textAlign: 'center' as const } as any,

  emptyState: { alignItems: 'center', paddingTop: 60, gap: S.sm },
  emptyText: { ...T.h3, color: C.cream },
  emptySub: { ...T.small, color: C.taupe },

  card: {
    flexDirection: 'row', borderRadius: R.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    padding: S.md, marginBottom: S.sm, ...shadow.sm,
    borderLeftColor: C.rose + '50', borderLeftWidth: 3,
  } as any,
  cardName: { ...T.h3, color: C.cream, marginBottom: 2 },
  cardDesc: { ...T.small, color: C.t2, marginBottom: S.xs },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  cardDate: { ...T.micro, color: C.taupe },
  giftCountPill: { backgroundColor: 'rgba(255,107,129,0.12)', borderRadius: R.full, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(255,107,129,0.30)' },
  giftCountPillText: { ...T.micro, color: C.rose, fontWeight: '700' as const } as any,
  expiredPill: { backgroundColor: 'rgba(239,68,68,0.14)', borderRadius: R.full, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)' },
  expiredPillText: { ...T.micro, color: C.error, fontWeight: '700' as const },
  sharedPill: { backgroundColor: 'rgba(90,240,208,0.12)', borderRadius: R.full, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(90,240,208,0.3)' },
  sharedPillText: { ...T.micro, color: C.teal },
  cardActions: { flexDirection: 'column', justifyContent: 'space-around', paddingLeft: S.sm, gap: 4 },
  actionIcon: { fontSize: 10, color: C.t3, fontWeight: '600' as const, letterSpacing: 0.3, textAlign: 'center' },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 10 },

  fabShell: { position: 'absolute', bottom: TAB_BAR_HEIGHT + 16, right: 16, overflow: 'hidden', zIndex: 20, ...shadow.glow },
  fabCenter: { alignItems: 'center', justifyContent: 'center' },
  plusText: { ...T.h1, color: C.white, lineHeight: 36 },

  formInner: { padding: S.md },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.sm },
  formTitle: { ...T.h3, color: C.cream },
  closeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: C.border },
  closeBtnText: { ...T.small, color: C.t2 },
  formInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: R.md, borderWidth: 1, borderColor: C.border, color: C.t1, paddingHorizontal: S.md, paddingVertical: 10, marginBottom: S.xs, ...T.small },
  submitBtn: { backgroundColor: C.rose, borderRadius: R.md, paddingVertical: 13, alignItems: 'center', marginTop: 4, ...shadow.glow },
  submitBtnText: { ...T.h3, color: C.white },

  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' },
  modalSheet: { ...glassStrong, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, padding: S.lg, paddingBottom: S.xxl, maxHeight: '90%', borderBottomWidth: 0, ...shadow.lg } as any,
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: S.md },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: S.md },
  sheetTitle: { ...T.h2, color: C.cream },
  sheetSub: { ...T.small, color: C.taupe, marginTop: 2 },
  sheetInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: R.md, borderWidth: 1, borderColor: C.border, color: C.t1, padding: S.md, marginBottom: S.sm, ...T.body },

  modeTabs: { flexDirection: 'row', marginBottom: S.md, ...glass, borderRadius: R.md, padding: 3 } as any,
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: R.sm },
  modeTabActive: { backgroundColor: 'rgba(255,107,129,0.15)', borderWidth: 1, borderColor: C.rose + '40' },
  modeTabText: { ...T.small, color: C.t3 },
  modeTabTextActive: { color: C.rose, fontWeight: '700' as const },
  friendsList: { maxHeight: 200, marginBottom: S.md },
  friendOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: S.sm, marginBottom: S.xs, gap: S.sm },
  friendOptionActive: { borderColor: C.rose + '60', backgroundColor: C.roseDim },
  friendInitial: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,107,129,0.12)', alignItems: 'center', justifyContent: 'center' },
  friendInitialText: { ...T.small, color: C.rose },
  friendOptionText: { ...T.body, color: C.t1, flex: 1 },
  friendOptionTextActive: { color: C.rose },
  checkmark: { ...T.body, color: C.rose },
  primaryBtn: { backgroundColor: C.rose, borderRadius: R.lg, paddingVertical: 16, alignItems: 'center', marginTop: S.sm, ...shadow.glow },
  primaryBtnText: { ...T.h3, color: C.white },
  btnDisabled: { backgroundColor: 'rgba(255,255,255,0.06)' },
  ghostBtn: { paddingVertical: 12, alignItems: 'center', marginTop: S.xs },
  ghostBtnText: { ...T.body, color: C.taupe },

  analyticsRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.md },
  analyticsCard: { flex: 1, alignItems: 'center', ...glass, borderRadius: R.lg, padding: S.md } as any,
  analyticsValue: { ...T.h1, marginBottom: 4 },
  analyticsLabel: { ...T.micro, color: C.taupe },
  lastViewed: { ...T.micro, color: C.taupe, textAlign: 'center', marginBottom: S.sm },
  analyticsEmpty: { alignItems: 'center', paddingVertical: S.xl, gap: S.sm },

  shareLinkBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: R.md, padding: S.sm, marginBottom: S.md, gap: S.sm, borderWidth: 1, borderColor: C.border },
  shareLinkText: { flex: 1, ...T.micro, color: C.t2, fontFamily: 'monospace' },
  copyBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.sm, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: C.border },
  copyBtnText: { fontSize: 11, color: C.t2, fontWeight: '600' as const },
  personRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface2, borderRadius: R.md, padding: S.sm, marginBottom: S.xs, borderWidth: 1, borderColor: C.border },
  personEmail: { ...T.small, color: C.t1 },
  personBy: { ...T.micro, color: C.t3, marginTop: 2 },
  removeText: { ...T.body, color: C.error, paddingHorizontal: S.sm },
});
