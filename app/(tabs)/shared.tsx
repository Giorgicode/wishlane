import AmbientBg from '@/components/ambient-bg';
import PublicProfileModal from '@/components/public-profile-modal';
import SkeletonBlock from '@/components/skeleton-block';
import { C, glass, glassStrong, R, S, shadow, T, TAB_BAR_HEIGHT } from '@/constants/design';
import { useAuth } from '@/hooks/useAuth';
import { reserveGift, subscribeToSharedEventGifts, subscribeToSharedEvents, trackEventView, trackGiftReservation, unshareEventWithUser, unreserveGift } from '@/lib/firestore';
import { toast } from '@/lib/toast';
import type { EventItem, Gift } from '@/types/firebase';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, FlatList, Modal, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

type SharedEvent = EventItem & { ownerName: string; eventOwnerId: string };

export default function SharedScreen() {
  const [sharedEvents, setSharedEvents] = useState<SharedEvent[]>([]);
  const [sharedReady, setSharedReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<SharedEvent | null>(null);
  const [eventGifts, setEventGifts] = useState<Gift[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [reservingId, setReservingId] = useState<string | null>(null);
  const [profileOwnerUid, setProfileOwnerUid] = useState<string | null>(null);
  const giftsUnsubRef = useRef<(() => void) | null>(null);

  const { uid, user } = useAuth();

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sharedEvents;
    return sharedEvents.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.ownerName.toLowerCase().includes(q) ||
        (e.description ?? '').toLowerCase().includes(q),
    );
  }, [sharedEvents, searchQuery]);

  useEffect(() => {
    if (!uid) return;
    let ready = false;
    return subscribeToSharedEvents(uid, (events) => {
      setSharedEvents(events);
      if (!ready) { ready = true; setSharedReady(true); }
    });
  }, [uid]);

  // Clean up gifts subscription on unmount
  useEffect(() => () => { giftsUnsubRef.current?.(); }, []);

  const openEventDetail = (event: SharedEvent) => {
    setSelectedEvent(event);
    setLoadingGifts(true);
    setEventGifts([]);
    setDetailVisible(true);
    giftsUnsubRef.current?.();
    giftsUnsubRef.current = subscribeToSharedEventGifts(
      event.eventOwnerId,
      event.id,
      (gifts) => { setEventGifts(gifts); setLoadingGifts(false); },
      () => setLoadingGifts(false),
    );
    if (uid) trackEventView(event.eventOwnerId, event.id, uid).catch(() => {});
  };

  const closeDetail = () => {
    setDetailVisible(false);
    giftsUnsubRef.current?.();
    giftsUnsubRef.current = null;
  };

  const handleLeaveEvent = (event: SharedEvent) => {
    if (!uid) return;
    Alert.alert(
      'Leave Event',
      `Remove "${event.name}" from your shared events?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave', style: 'destructive',
          onPress: async () => {
            try {
              await unshareEventWithUser(event.eventOwnerId, event.id, uid);
              closeDetail();
              toast.success('Event removed from your list');
            } catch { toast.error('Failed to leave event'); }
          },
        },
      ],
    );
  };

  const formatDate = (date: any) => {
    if (!date) return 'No expiration';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isExpired = (date: any): boolean => {
    if (!date) return false;
    const d = (date as any).toDate ? (date as any).toDate() : new Date(date);
    return d < new Date();
  };

  const handleReserveGift = async (gift: Gift) => {
    if (!uid || !selectedEvent || !user) return;
    setReservingId(gift.id);
    try {
      if (gift.reservedBy === uid) {
        await unreserveGift(selectedEvent.eventOwnerId, gift.id);
        toast.success('You removed your reservation', 'Unreserved');
      } else if (gift.reservedBy) {
        toast.info(`Reserved by ${gift.reservedByName || 'someone'}`, 'Taken');
        return;
      } else {
        await reserveGift(selectedEvent.eventOwnerId, gift.id, uid, user.displayName || 'Anonymous');
        trackGiftReservation(selectedEvent.eventOwnerId, selectedEvent.id).catch(() => {});
        toast.success('Gift reserved successfully', 'Reserved');
      }
      // subscription pushes the update automatically — no manual re-fetch needed
    } catch { toast.error('Failed to update reservation'); }
    finally { setReservingId(null); }
  };

  return (
    <View style={styles.root}>
      <AmbientBg preset="gold" />

      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Text style={styles.eyebrow}>SHARED WITH ME</Text>
        <View style={styles.eyebrowRule} />
        <Text style={styles.screenTitle}>{sharedEvents.length} {sharedEvents.length === 1 ? 'Event' : 'Events'}</Text>
      </Animated.View>

      {!sharedReady && (
        <View style={styles.skeletonList}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonBlock width={44} height={44} radius={22} />
              <View style={{ flex: 1, gap: 6 }}>
                <SkeletonBlock width="38%" height={10} />
                <SkeletonBlock width="68%" height={14} />
                <SkeletonBlock width="48%" height={10} />
              </View>
            </View>
          ))}
        </View>
      )}

      {sharedReady && sharedEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nothing shared yet</Text>
          <Text style={styles.emptySub}>Ask friends to share their gift events with you</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => `${item.eventOwnerId}-${item.id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search events or owners…"
                placeholderTextColor={C.t3}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Text style={styles.searchClear}>✕</Text>
                </Pressable>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptySearch}>
              <Text style={styles.emptySearchText}>No events match &quot;{searchQuery}&quot;</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Animated.View entering={FadeInUp.duration(350)}>
              <Pressable style={[styles.card, isExpired(item.expirationDate) && { opacity: 0.6 }]} onPress={() => openEventDetail(item)} onLongPress={() => handleLeaveEvent(item)} delayLongPress={500}>
                {/* Owner avatar — tap to view their profile */}
                <Pressable style={styles.ownerBadge} onPress={() => setProfileOwnerUid(item.eventOwnerId)} hitSlop={8}>
                  <Text style={styles.ownerInitialText}>{(item.ownerName || '?')[0].toUpperCase()}</Text>
                </Pressable>
                <View style={styles.cardBody}>
                  <Pressable onPress={() => setProfileOwnerUid(item.eventOwnerId)}>
                    <Text style={styles.ownerName}>{item.ownerName}</Text>
                  </Pressable>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {!!item.description && <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Text style={styles.cardDate}>{formatDate(item.expirationDate)}</Text>
                    {isExpired(item.expirationDate) && (
                      <View style={styles.expiredPill}>
                        <Text style={styles.expiredPillText}>Expired</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </Animated.View>
          )}
        />
      )}

      <PublicProfileModal
        visible={!!profileOwnerUid}
        ownerUid={profileOwnerUid}
        onClose={() => setProfileOwnerUid(null)}
      />

      {/* Event Detail Modal */}
      <Modal visible={detailVisible} transparent animationType="slide" onRequestClose={closeDetail}>
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1, marginRight: S.sm }}>
                <Text style={styles.sheetTitle} numberOfLines={2}>{selectedEvent?.name}</Text>
                <Pressable style={styles.sheetByRow} onPress={() => selectedEvent && setProfileOwnerUid(selectedEvent.eventOwnerId)}>
                  <View style={styles.sheetByDot} />
                  <Text style={styles.sheetBy}>by {selectedEvent?.ownerName}</Text>
                  <Text style={styles.sheetByArrow}>›</Text>
                </Pressable>
              </View>
              <Pressable onPress={closeDetail} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            {!!selectedEvent?.description && (
              <Text style={styles.eventDesc}>{selectedEvent.description}</Text>
            )}

            <View style={styles.giftsHeadRow}>
              <View style={styles.giftsHeadDot} />
              <Text style={styles.giftsHeading}>AVAILABLE GIFTS</Text>
            </View>

            {loadingGifts ? (
              <Text style={styles.loadingText}>Loading…</Text>
            ) : eventGifts.length === 0 ? (
              <Text style={styles.loadingText}>No gifts in this event yet</Text>
            ) : (
              <ScrollView style={styles.giftsList} showsVerticalScrollIndicator={false}>
                {eventGifts.map((gift) => {
                  const isMyReservation = gift.reservedBy === uid;
                  const isTaken = !!(gift.reservedBy && !isMyReservation);
                  return (
                    <View key={gift.id} style={[styles.giftCard, isTaken && { opacity: 0.55 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.giftName}>{gift.name}</Text>
                        {!!gift.description && <Text style={styles.giftDesc}>{gift.description}</Text>}
                        {!!gift.price && (
                          <View style={styles.giftPricePill}>
                            <Text style={styles.giftPriceText}>{gift.price}</Text>
                          </View>
                        )}
                        {gift.reservedBy ? (
                          <Text style={[styles.reservationBadge, isMyReservation ? { color: C.teal } : { color: C.warning }]}>
                            {isMyReservation ? '✦ Reserved by you' : `✦ Reserved by ${gift.reservedByName || 'someone'}`}
                          </Text>
                        ) : (
                          <Text style={styles.availableBadge}>✦ Available</Text>
                        )}
                      </View>
                      <Pressable
                        style={[
                          styles.reserveBtn,
                          isMyReservation && { backgroundColor: C.warning + '20', borderColor: C.warning + '60' },
                          isTaken && { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: C.border },
                          reservingId === gift.id && { opacity: 0.5 },
                        ]}
                        onPress={() => handleReserveGift(gift)}
                        disabled={reservingId === gift.id || isTaken}
                      >
                        <Text style={[styles.reserveBtnText, isMyReservation && { color: C.warning }, isTaken && { color: C.t3 }]}>
                          {reservingId === gift.id ? '…' : isMyReservation ? 'Undo' : isTaken ? 'Taken' : 'Reserve'}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {selectedEvent && (
              <Pressable style={styles.leaveBtn} onPress={() => handleLeaveEvent(selectedEvent)}>
                <Text style={styles.leaveBtnText}>Leave this event</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' } as any,

  header: { paddingHorizontal: S.md, paddingTop: 80, marginBottom: S.lg },
  eyebrow: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 2.4, color: C.taupe, marginBottom: 8 },
  eyebrowRule: { height: 1, width: 40, backgroundColor: C.goldLux, marginBottom: 12, opacity: 0.7, borderRadius: 1 },
  screenTitle: { fontSize: 40, fontWeight: '800' as const, letterSpacing: -1.2, color: C.cream, lineHeight: 42 },

  listContent: { paddingHorizontal: S.md, paddingBottom: TAB_BAR_HEIGHT + S.lg },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.sm, paddingBottom: 100 },
  emptyIcon: { fontSize: 52 },
  emptyText: { fontSize: 20, fontWeight: '700' as const, color: C.cream },
  emptySub: { ...T.small, color: C.taupe, textAlign: 'center', paddingHorizontal: S.xl },

  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: R.lg, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    padding: S.md, marginBottom: S.sm, ...shadow.sm,
  } as any,
  ownerBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(200,169,90,0.16)',
    borderWidth: 1.5, borderColor: C.goldLux + '60',
    alignItems: 'center', justifyContent: 'center',
    marginRight: S.sm,
  },
  ownerInitialText: { fontSize: 18, fontWeight: '700' as const, color: C.goldLux },
  cardBody: { flex: 1 },
  ownerName: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1, color: C.goldLux, marginBottom: 3 },
  cardName: { ...T.h3, color: C.cream, marginBottom: 2 },
  cardDesc: { ...T.small, color: C.t2, marginBottom: 2 },
  cardDate: { fontSize: 10, color: C.taupe, letterSpacing: 0.3 },
  expiredPill: { backgroundColor: 'rgba(239,68,68,0.14)', borderRadius: R.full, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)' },
  expiredPillText: { fontSize: 9, fontWeight: '700' as const, color: C.error },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: R.md, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: S.sm, marginBottom: S.sm, height: 40,
  },
  searchIcon: { fontSize: 17, color: C.t3, marginRight: 6 },
  searchInput: { flex: 1, ...T.body, color: C.t1, paddingVertical: 0 },
  searchClear: { fontSize: 12, color: C.t3, paddingHorizontal: 4 },
  emptySearch: { alignItems: 'center', paddingVertical: S.xxl },
  emptySearchText: { ...T.small, color: C.t3 },
  chevron: { fontSize: 24, color: C.t3 },

  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' },
  modalSheet: {
    ...glassStrong,
    borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl,
    padding: S.lg, paddingBottom: S.xxl, maxHeight: '90%',
    borderBottomWidth: 0, ...shadow.lg,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: S.md },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: S.sm },
  sheetTitle: { ...T.h2, color: C.cream },
  sheetByRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  sheetByDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.goldLux },
  sheetBy: { ...T.small, color: C.goldLux },
  sheetByArrow: { fontSize: 16, color: C.goldLux, marginLeft: 2 },
  closeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: C.border },
  closeBtnText: { ...T.small, color: C.t2 },
  eventDesc: { ...T.body, color: C.t2, marginBottom: S.md },

  giftsHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: S.sm },
  giftsHeadDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.goldLux },
  giftsHeading: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 2, color: C.taupe },

  loadingText: { ...T.small, color: C.t3, textAlign: 'center', marginVertical: S.xl },
  giftsList: { maxHeight: 340 },
  giftCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: R.md, padding: S.sm, marginBottom: S.xs,
    borderWidth: 1, borderColor: C.border, gap: S.sm,
  },
  giftName: { ...T.h3, color: C.cream },
  giftDesc: { ...T.small, color: C.t2, marginTop: 2 },
  giftPricePill: { backgroundColor: 'rgba(90,240,208,0.12)', borderRadius: R.full, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, marginTop: 4, borderWidth: 1, borderColor: 'rgba(90,240,208,0.3)' },
  giftPriceText: { fontSize: 10, fontWeight: '700' as const, color: C.teal },
  availableBadge: { fontSize: 10, fontWeight: '600' as const, color: C.success, marginTop: S.xs },
  reservationBadge: { fontSize: 10, fontWeight: '600' as const, marginTop: S.xs },
  reserveBtn: {
    backgroundColor: 'rgba(74,222,128,0.15)', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(74,222,128,0.4)',
  },
  reserveBtnText: { ...T.small, color: C.success, fontWeight: '700' as const },

  skeletonList: { position: 'absolute' as const, top: 178, left: S.md, right: S.md, gap: S.sm },
  skeletonCard: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: S.sm,
    borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: S.md,
  },

  leaveBtn: {
    marginTop: S.md,
    paddingVertical: 12,
    alignItems: 'center' as const,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.30)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  leaveBtnText: { ...T.small, color: C.error, fontWeight: '600' as const } as any,
});
