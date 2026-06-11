import PublicProfileModal from '@/components/public-profile-modal';
import { C, glass, glassStrong, R, S, shadow, T } from '@/constants/design';
import { useAuth } from '@/hooks/useAuth';
import { getEventByShareCode, reserveGift, subscribeToSharedEventGifts, unreserveGift } from '@/lib/firestore';
import { toast } from '@/lib/toast';
import type { EventItem, Gift } from '@/types/firebase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

export default function EventShareLinkScreen() {
  const { shareCode: shareCodeParam } = useLocalSearchParams<{ shareCode: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerUid, setOwnerUid] = useState<string | null>(null);
  const [reservingId, setReservingId] = useState<string | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const giftsUnsubRef = useRef<(() => void) | null>(null);
  const { uid, user } = useAuth();

  // Load event metadata (one-shot — we only need ownerUid + event.id)
  useEffect(() => {
    const load = async () => {
      try {
        const shareCode = shareCodeParam;
        if (!shareCode) {
          toast.error('Invalid share link');
          router.back();
          return;
        }
        const result = await getEventByShareCode(shareCode);
        if (!result) {
          toast.error('Event not found or has been removed');
          router.back();
          return;
        }
        setEvent(result.event);
        setOwnerUid(result.ownerUid);
      } catch {
        toast.error('Failed to load shared event');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shareCodeParam]);

  // Real-time gifts subscription — requires auth (gift reads are owner-scoped)
  useEffect(() => {
    if (!ownerUid || !event?.id || !uid) return;
    giftsUnsubRef.current?.();
    giftsUnsubRef.current = subscribeToSharedEventGifts(ownerUid, event.id, setGifts);
    return () => { giftsUnsubRef.current?.(); giftsUnsubRef.current = null; };
  }, [ownerUid, event?.id, uid]);

  const handleReserve = async (gift: Gift) => {
    if (!uid || !ownerUid) return;
    setReservingId(gift.id);
    try {
      if (gift.reservedBy === uid) {
        await unreserveGift(ownerUid, gift.id);
        toast.success('Your reservation was removed', 'Unreserved');
      } else if (gift.reservedBy) {
        toast.info(`Reserved by ${gift.reservedByName || 'someone'}`, 'Taken');
        return;
      } else {
        await reserveGift(ownerUid, gift.id, uid, user?.displayName || 'Anonymous');
        toast.success('Gift reserved successfully', 'Reserved');
      }
      // subscription pushes updated gift state automatically
    } catch {
      toast.error('Failed to update reservation');
    } finally {
      setReservingId(null);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'No expiration';
    return new Date(date instanceof Object && date.toDate ? date.toDate() : date)
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={C.rose} />
      </View>
    );
  }

  if (!event || !ownerUid) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.blobRose} />
      <View style={styles.blobGold} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Event card */}
        <Animated.View entering={FadeIn.duration(500)} style={[styles.eventCard, glass as any]}>
          <Text style={styles.eventEyebrow}>SHARED EVENT</Text>
          <View style={styles.eyebrowRule} />
          <Text style={styles.eventTitle}>{event.name}</Text>
          {!!event.description && <Text style={styles.eventDesc}>{event.description}</Text>}
          <Text style={styles.eventDate}>Expires {formatDate(event.expirationDate)}</Text>
        </Animated.View>

        {/* Owner row — only shown when logged in */}
        {!!uid && (
          <Pressable style={styles.ownerRow} onPress={() => setProfileModalVisible(true)}>
            <Text style={styles.ownerRowLabel}>Shared by</Text>
            <Text style={styles.ownerRowArrow}>View profile ›</Text>
          </Pressable>
        )}

        {/* Section heading */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionLabel}>AVAILABLE GIFTS</Text>
          <View style={styles.sectionRule} />
        </View>

        {!uid ? null : gifts.length === 0 ? (
          <Animated.View entering={FadeIn.duration(400).delay(200)} style={styles.emptyState}>
            <Text style={styles.emptyText}>No gifts in this event yet</Text>
          </Animated.View>
        ) : (
          gifts.map((gift, i) => {
            const isMyReservation = gift.reservedBy === uid;
            const isTaken = !!(gift.reservedBy && !isMyReservation);
            return (
              <Animated.View key={gift.id} entering={FadeInUp.duration(350).delay(i * 50)}>
                <View style={[styles.giftCard, isTaken && { opacity: 0.55 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.giftName}>{gift.name}</Text>
                    {!!gift.description && <Text style={styles.giftDesc}>{gift.description}</Text>}
                    {!!gift.price && (
                      <View style={styles.pricePill}>
                        <Text style={styles.priceText}>{gift.price}</Text>
                      </View>
                    )}
                    <Text style={[
                      styles.statusBadge,
                      isMyReservation ? { color: C.teal } : isTaken ? { color: C.warning } : { color: C.success },
                    ]}>
                      {isMyReservation
                        ? '✦ Reserved by you'
                        : isTaken
                        ? `✦ Reserved by ${gift.reservedByName || 'someone'}`
                        : '✦ Available'}
                    </Text>
                  </View>

                  {uid ? (
                    <Pressable
                      style={[
                        styles.reserveBtn,
                        isMyReservation && { backgroundColor: C.warning + '20', borderColor: C.warning + '60' },
                        isTaken && { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: C.border },
                        reservingId === gift.id && { opacity: 0.5 },
                      ]}
                      onPress={() => handleReserve(gift)}
                      disabled={reservingId === gift.id || isTaken}
                    >
                      <Text style={[
                        styles.reserveBtnText,
                        isMyReservation && { color: C.warning },
                        isTaken && { color: C.t3 },
                      ]}>
                        {reservingId === gift.id ? '…' : isMyReservation ? 'Undo' : isTaken ? 'Taken' : 'Reserve'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </Animated.View>
            );
          })
        )}

        {!uid && (
          <Animated.View entering={FadeIn.duration(400).delay(300)} style={styles.signInBox}>
            <Text style={styles.signInText}>Sign in to see and reserve gifts</Text>
            <Pressable style={styles.signInBtn} onPress={() => router.push('/auth')}>
              <Text style={styles.signInBtnText}>Sign In</Text>
            </Pressable>
          </Animated.View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      <PublicProfileModal
        visible={profileModalVisible}
        ownerUid={ownerUid}
        onClose={() => setProfileModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' } as any,
  loadingRoot: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  errorText: { ...T.body, color: C.t3 } as any,

  blobRose: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(255,107,129,0.12)', top: -80, right: -60,
    filter: 'blur(80px)',
  } as any,
  blobGold: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(200,169,90,0.10)', bottom: 120, left: -40,
    filter: 'blur(70px)',
  } as any,

  scroll: { paddingHorizontal: S.md, paddingTop: S.lg },

  eventCard: {
    borderRadius: R.xl,
    padding: S.lg,
    marginBottom: S.lg,
    ...shadow.md,
  },
  eventEyebrow: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 2.4, color: C.taupe, marginBottom: 6 },
  eyebrowRule: { height: 1, width: 36, backgroundColor: C.rose, marginBottom: 12, opacity: 0.6, borderRadius: 1 },
  eventTitle: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.6, color: C.cream, marginBottom: 6, lineHeight: 32 },
  eventDesc: { ...T.body, color: C.t2, marginBottom: S.sm } as any,
  eventDate: { fontSize: 11, color: C.taupe, letterSpacing: 0.4 },

  ownerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(200,169,90,0.08)', borderRadius: R.lg,
    borderWidth: 1, borderColor: 'rgba(200,169,90,0.25)',
    paddingHorizontal: S.md, paddingVertical: 12, marginBottom: S.md,
  },
  ownerRowLabel: { ...T.small, color: C.goldLux } as any,
  ownerRowArrow: { fontSize: 12, color: C.goldLux, fontWeight: '600' as const },

  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: S.sm },
  sectionDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.rose },
  sectionLabel: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 2.4, color: C.taupe },
  sectionRule: { flex: 1, height: 1, backgroundColor: C.border },

  emptyState: { alignItems: 'center', paddingVertical: S.xl },
  emptyText: { ...T.body, color: C.t3 } as any,

  giftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: S.md,
    marginBottom: S.xs,
    gap: S.sm,
    ...shadow.sm,
  } as any,
  giftName: { ...T.h3, color: C.cream, marginBottom: 2 } as any,
  giftDesc: { ...T.small, color: C.t2, marginBottom: S.xs } as any,
  pricePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(90,240,208,0.12)',
    borderRadius: R.full,
    paddingHorizontal: 8, paddingVertical: 2,
    marginBottom: S.xs,
    borderWidth: 1, borderColor: 'rgba(90,240,208,0.30)',
  },
  priceText: { fontSize: 10, fontWeight: '700' as const, color: C.teal },
  statusBadge: { fontSize: 10, fontWeight: '600' as const, marginTop: 2 },

  reserveBtn: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: R.md,
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.4)',
  },
  reserveBtnText: { ...T.small, color: C.success, fontWeight: '700' as const } as any,

  signInBox: {
    ...glassStrong,
    borderRadius: R.xl,
    padding: S.lg,
    alignItems: 'center',
    marginTop: S.lg,
    gap: S.md,
  } as any,
  signInText: { ...T.body, color: C.t2, textAlign: 'center' } as any,
  signInBtn: {
    backgroundColor: C.rose,
    borderRadius: R.lg,
    paddingHorizontal: S.xl, paddingVertical: 14,
    ...shadow.glow,
  },
  signInBtnText: { ...T.h3, color: C.white } as any,
});
