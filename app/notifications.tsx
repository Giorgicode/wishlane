import SkeletonBlock from '@/components/skeleton-block';
import { C, glass, R, S, shadow, T } from '@/constants/design';
import { useAuth } from '@/hooks/useAuth';
import {
  deleteNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToNotifications,
} from '@/lib/firestore';
import { toast } from '@/lib/toast';
import type { Notification } from '@/types/firebase';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

const TYPE_CONFIG: Record<Notification['type'], { label: string; color: string; route: string }> = {
  friend_request: { label: 'FR', color: C.teal,    route: '/(tabs)/friends' },
  friend_accepted: { label: 'FA', color: C.rose,   route: '/(tabs)/friends' },
  event_shared:   { label: 'EV', color: C.goldLux, route: '/(tabs)/shared'  },
  gift_reserved:  { label: 'GR', color: '#A78BFA', route: '/(tabs)/events'  },
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsReady, setNotificationsReady] = useState(false);
  const { uid } = useAuth();
  const router = useRouter();
  const swipeableRefs = useRef<Map<string, Swipeable | null>>(new Map());

  useEffect(() => {
    if (!uid) return;
    let ready = false;
    return subscribeToNotifications(uid, (n) => {
      setNotifications(n);
      if (!ready) { ready = true; setNotificationsReady(true); }
    });
  }, [uid]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    if (!uid || unreadCount === 0) return;
    try {
      await markAllNotificationsAsRead(uid);
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleTap = async (n: Notification) => {
    if (!uid) return;
    if (!n.read) {
      markNotificationAsRead(uid, n.id).catch(() => {});
    }
    const cfg = TYPE_CONFIG[n.type];
    if (cfg?.route) {
      router.push(cfg.route as any);
    }
  };

  const handleDelete = (n: Notification) => {
    if (!uid) return;
    Alert.alert('Remove', 'Delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteNotification(uid, n.id).catch(() => {}) },
    ]);
  };

  const handleSwipeDelete = (n: Notification) => {
    if (!uid) return;
    deleteNotification(uid, n.id).catch(() => toast.error('Failed to delete'));
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.root}>
      {/* Ambient orbs */}
      <View style={styles.blobRose} />
      <View style={styles.blobTeal} />

      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>INBOX</Text>
          <View style={styles.eyebrowRule} />
          <Text style={styles.screenTitle}>Notifications</Text>
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </Animated.View>

      {!notificationsReady && (
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonBlock width={40} height={40} radius={20} />
              <View style={{ flex: 1, gap: 7 }}>
                <SkeletonBlock width="55%" height={12} />
                <SkeletonBlock width="80%" height={10} />
                <SkeletonBlock width="35%" height={9} />
              </View>
            </View>
          ))}
        </View>
      )}

      {notificationsReady && notifications.length === 0 ? (
        <Animated.View entering={FadeIn.duration(500).delay(200)} style={styles.emptyState}>
          <Text style={styles.emptyTitle}>All caught up</Text>
          <Text style={styles.emptySub}>
            Friend requests, shared events, and gift reservations will appear here.
          </Text>
        </Animated.View>
      ) : notificationsReady ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const cfg = TYPE_CONFIG[item.type] ?? { label: '·', color: C.t3, route: '' };
            return (
              <Animated.View entering={FadeInUp.duration(350).delay(index * 40)}>
                <Swipeable
                  ref={(ref) => { swipeableRefs.current.set(item.id, ref); }}
                  friction={2}
                  rightThreshold={60}
                  renderRightActions={() => (
                    <Pressable
                      style={styles.swipeDelete}
                      onPress={() => {
                        swipeableRefs.current.get(item.id)?.close();
                        handleSwipeDelete(item);
                      }}
                    >
                      <Text style={styles.swipeDeleteText}>Delete</Text>
                    </Pressable>
                  )}
                  onSwipeableOpen={(direction) => {
                    if (direction === 'right') {
                      // close all other open swipeables
                      swipeableRefs.current.forEach((ref, id) => {
                        if (id !== item.id) ref?.close();
                      });
                    }
                  }}
                >
                  <Pressable
                    style={[styles.card, !item.read && { borderLeftColor: cfg.color, borderLeftWidth: 3 }]}
                    onPress={() => handleTap(item)}
                  >
                    <View style={[styles.badge, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '40' }]}>
                      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={[styles.cardTitle, !item.read && { color: C.cream }]}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardMessage}>{item.message}</Text>
                      <View style={styles.cardFooter}>
                        <Text style={styles.cardTime}>{formatTime(item.createdAt)}</Text>
                        {cfg.route ? (
                          <Text style={[styles.cardNav, { color: cfg.color }]}>
                            {item.type === 'friend_request' || item.type === 'friend_accepted' ? 'Friends →' :
                             item.type === 'event_shared' ? 'Shared →' : 'Events →'}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {!item.read && <View style={[styles.unreadDot, { backgroundColor: cfg.color }]} />}

                    <Pressable onPress={() => handleDelete(item)} hitSlop={12} style={styles.deleteBtn}>
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </Pressable>
                  </Pressable>
                </Swipeable>
              </Animated.View>
            );
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' } as any,

  blobRose: {
    position: 'absolute', width: 360, height: 360, borderRadius: 180,
    backgroundColor: 'rgba(255,107,129,0.10)', top: -100, right: -80,
    filter: 'blur(90px)',
  } as any,
  blobTeal: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(90,240,208,0.07)', bottom: 100, left: -60,
    filter: 'blur(80px)',
  } as any,

  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: S.md,
    paddingTop: 56,
    paddingBottom: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: S.sm,
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: C.border,
    marginBottom: 4,
    ...shadow.sm,
  },
  backText: { ...T.h3, color: C.t1, lineHeight: 20 } as any,
  eyebrow: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 2.4, color: C.taupe, marginBottom: 6 },
  eyebrowRule: { height: 1, width: 36, backgroundColor: C.rose, marginBottom: 10, opacity: 0.6, borderRadius: 1 },
  screenTitle: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.8, color: C.cream, lineHeight: 32 },
  markAllBtn: {
    marginBottom: 4,
    paddingHorizontal: S.sm, paddingVertical: 7,
    borderRadius: R.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: C.border,
  },
  markAllText: { ...T.micro, color: C.t2, fontWeight: '600' as const } as any,

  listContent: { paddingHorizontal: S.md, paddingTop: S.md, paddingBottom: 80 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: S.sm,
    marginBottom: S.xs,
    gap: S.sm,
    ...shadow.sm,
  } as any,

  badge: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  badgeText: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 0.5 },

  cardBody: { flex: 1 },
  cardTitle: { ...T.small, color: C.t2, fontWeight: '600' as const, marginBottom: 2 } as any,
  cardMessage: { ...T.micro, color: C.t3, lineHeight: 16 } as any,
  cardFooter: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginTop: 4 },
  cardTime: { fontSize: 10, color: C.t3 + 'aa', letterSpacing: 0.3 },
  cardNav: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.3 },

  unreadDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },

  deleteBtn: { paddingHorizontal: S.xs, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { ...T.small, color: C.t3 } as any,

  swipeDelete: {
    backgroundColor: C.error,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    width: 80,
    borderRadius: R.lg,
    marginBottom: S.xs,
    marginLeft: S.xs,
  },
  swipeDeleteText: { ...T.small, color: C.white, fontWeight: '700' as const } as any,

  skeletonList: { paddingHorizontal: S.md, paddingTop: S.md, gap: S.xs },
  skeletonCard: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: S.sm,
    borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: S.sm,
  },

  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: S.xl, paddingBottom: 80, gap: S.sm,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700' as const, color: C.cream },
  emptySub: { ...T.small, color: C.taupe, textAlign: 'center', lineHeight: 20 } as any,
});
