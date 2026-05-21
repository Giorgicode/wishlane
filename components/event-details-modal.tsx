import { C, glass, glassStrong, R, S, shadow, T } from '@/constants/design';
import { shareEventWithUserByEmail } from '@/lib/firestore';
import { toast } from '@/lib/toast';
import { EventItem, Gift } from '@/types/firebase';
import { useEffect, useState } from 'react';
import { Dimensions, FlatList, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
    FadeIn,
    Layout,
    runOnJS,
    SlideInUp,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
    ZoomIn
} from 'react-native-reanimated';

const { height } = Dimensions.get('window');

interface EventDetailsModalProps {
  visible: boolean;
  event: EventItem | null;
  gifts: Gift[];
  onClose: () => void;
  onEdit?: (event: EventItem) => void;
  onDelete?: (eventId: string) => void;
  uid?: string | null;
  displayName?: string | null;
}

export default function EventDetailsModal({
  visible,
  event,
  gifts,
  onClose,
  onEdit,
  onDelete,
  uid,
  displayName,
}: EventDetailsModalProps) {
  const [shareEmail, setShareEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [expandedGiftId, setExpandedGiftId] = useState<string | null>(null);
  const modalScale = useSharedValue(0.8);
  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(100);
  const backgroundOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      // Animate modal in
      backgroundOpacity.value = withTiming(1, { duration: 300 });
      modalOpacity.value = withTiming(1, { duration: 400 });
      modalScale.value = withSpring(1, { damping: 15, stiffness: 100 });
      modalTranslateY.value = withSpring(0, { damping: 20, stiffness: 120 });

      // Stagger content animation
      contentScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 80 }));
    } else {
      // Animate modal out
      backgroundOpacity.value = withTiming(0, { duration: 200 });
      modalOpacity.value = withTiming(0, { duration: 250 });
      modalScale.value = withTiming(0.8, { duration: 200 });
      modalTranslateY.value = withTiming(100, { duration: 200 });
      contentScale.value = withTiming(0.9, { duration: 150 });
    }
  }, [visible]);

  if (!event) return null;

  const eventGifts = gifts.filter(gift => gift.eventId === event.id);
  const eventDate = event.expirationDate
    ? ((event.expirationDate as any).toDate ? (event.expirationDate as any).toDate() : new Date(event.expirationDate as any))
    : null;

  const formatDate = (date: Date | null) => {
    if (!date) return 'No date set';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntil = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays === 0) return 'Today!';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days left`;
  };

  const handleShare = async () => {
    if (!shareEmail.trim()) { toast.error('Enter an email address'); return; }
    if (!uid || !event) return;
    setIsSharing(true);
    try {
      await shareEventWithUserByEmail(uid, event.id, shareEmail.trim(), displayName ?? undefined);
      toast.success(`Event shared with ${shareEmail.trim()}`, 'Shared');
      setShareEmail('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to share event');
    } finally {
      setIsSharing(false);
    }
  };

  const handleClose = () => {
    // Morphing close animation
    modalScale.value = withSequence(
      withTiming(1.05, { duration: 150 }),
      withTiming(0.8, { duration: 200 })
    );
    modalTranslateY.value = withTiming(50, { duration: 200 });

    setTimeout(() => {
      runOnJS(onClose)();
    }, 200);
  };

  const toggleGift = (giftId: string) =>
    setExpandedGiftId((prev) => (prev === giftId ? null : giftId));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [
      { scale: modalScale.value },
      { translateY: modalTranslateY.value },
    ],
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, backgroundAnimatedStyle]}>
        <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
          <Animated.View style={[styles.content, contentAnimatedStyle]}>
            {/* Header */}
            <Animated.View
              style={styles.header}
              entering={FadeIn.duration(400).delay(300)}
            >
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                activeOpacity={0.8}
              >
                <Animated.Text
                  style={styles.closeText}
                  entering={ZoomIn.duration(200).delay(500)}
                >
                  ✕
                </Animated.Text>
              </TouchableOpacity>
              <Animated.Text
                style={styles.headerTitle}
                entering={SlideInUp.duration(400).delay(400)}
              >
                {event.name}
              </Animated.Text>
              <View style={styles.placeholder} />
            </Animated.View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Event Info */}
              <Animated.View
                style={styles.eventInfo}
                entering={SlideInUp.duration(500).delay(600)}
                layout={Layout.springify()}
              >
                <Animated.Text
                  style={styles.eventDescription}
                  entering={FadeIn.duration(300).delay(700)}
                >
                  {event.description}
                </Animated.Text>
                <Animated.View
                  style={styles.dateContainer}
                  entering={FadeIn.duration(300).delay(800)}
                >
                  <Text style={styles.dateLabel}>Date:</Text>
                  <Text style={styles.dateValue}>{formatDate(eventDate)}</Text>
                </Animated.View>
                {eventDate && (
                  <Animated.View
                    style={styles.countdownContainer}
                    entering={FadeIn.duration(300).delay(900)}
                  >
                    <Text style={styles.countdownLabel}>In:</Text>
                    <Text style={styles.countdownValue}>{getDaysUntil(eventDate)}</Text>
                  </Animated.View>
                )}
              </Animated.View>

              {/* Gifts Section */}
              <Animated.View
                style={styles.giftsSection}
                entering={SlideInUp.duration(500).delay(1000)}
                layout={Layout.springify()}
              >
                <Animated.Text
                  style={styles.sectionTitle}
                  entering={FadeIn.duration(300).delay(1100)}
                >
                  Gifts for this Event ({eventGifts.length})
                </Animated.Text>

                {eventGifts.length === 0 ? (
                  <Animated.View
                    style={styles.emptyState}
                    entering={ZoomIn.duration(400).delay(1200)}
                  >
                    <Animated.Text
                      style={styles.emptyText}
                      entering={FadeIn.duration(300).delay(1350)}
                    >
                      No gifts assigned yet
                    </Animated.Text>
                    <Animated.Text
                      style={styles.emptySubtext}
                      entering={FadeIn.duration(300).delay(1400)}
                    >
                      Add gifts from the Gifts tab and assign them to this event
                    </Animated.Text>
                  </Animated.View>
                ) : (
                  <FlatList
                    data={eventGifts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => {
                      const isExpanded = expandedGiftId === item.id;
                      return (
                        <Animated.View
                          entering={SlideInUp.duration(400).delay(1200 + index * 100)}
                          layout={Layout.springify() as any}
                        >
                          <TouchableOpacity
                            style={[styles.giftCard, isExpanded && styles.giftCardExpanded]}
                            onPress={() => toggleGift(item.id)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.giftInfo}>
                              <Animated.Text style={styles.giftName} entering={FadeIn.duration(300).delay(1300 + index * 100)}>
                                {item.name}
                              </Animated.Text>
                              {!!item.description && (
                                <Animated.Text style={styles.giftDescription} entering={FadeIn.duration(300).delay(1350 + index * 100)}>
                                  {item.description}
                                </Animated.Text>
                              )}
                              <View style={styles.giftPillRow}>
                                {!!item.price && (
                                  <View style={styles.giftPricePill}>
                                    <Text style={styles.giftPriceText}>{item.price}</Text>
                                  </View>
                                )}
                                {!!item.type && (
                                  <View style={styles.giftTypePill}>
                                    <Text style={styles.giftTypeText}>{item.type}</Text>
                                  </View>
                                )}
                              </View>
                              {isExpanded && (
                                <Animated.View entering={FadeIn.duration(200)} style={styles.giftExpandedBody}>
                                  {item.type === 'online' && !!item.link && (
                                    <TouchableOpacity onPress={() => Linking.openURL(item.link!)}>
                                      <Text style={styles.giftLink} numberOfLines={2}>{item.link}</Text>
                                    </TouchableOpacity>
                                  )}
                                  {item.type === 'brand' && !!item.brand && (
                                    <Text style={styles.giftDetailLine}>Brand: {item.brand}</Text>
                                  )}
                                  {item.type === 'location' && (item.city || item.place) && (
                                    <Text style={styles.giftDetailLine}>
                                      {[item.place, item.city, item.country].filter(Boolean).join(' · ')}
                                    </Text>
                                  )}
                                </Animated.View>
                              )}
                            </View>
                            <Animated.Text style={styles.giftArrow} entering={ZoomIn.duration(200).delay(1450 + index * 100)}>
                              {isExpanded ? '↑' : '↓'}
                            </Animated.Text>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    }}
                    scrollEnabled={false}
                  />
                )}
              </Animated.View>

              {/* Share Section */}
              <Animated.View
                style={styles.sharingSection}
                entering={SlideInUp.duration(500).delay(1300)}
                layout={Layout.springify()}
              >
                <Animated.Text style={styles.sectionTitle} entering={FadeIn.duration(300).delay(1400)}>
                  Share with a Friend
                </Animated.Text>
                <View style={styles.shareRow}>
                  <TextInput
                    style={styles.shareInput}
                    placeholder="Enter email address"
                    value={shareEmail}
                    onChangeText={setShareEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={[styles.shareBtn, isSharing && { opacity: 0.6 }]}
                    onPress={handleShare}
                    disabled={isSharing}
                  >
                    <Text style={styles.shareBtnText}>{isSharing ? '...' : 'Share'}</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Quick Actions */}
              <Animated.View
                style={styles.actionsSection}
                entering={SlideInUp.duration(500).delay(1500)}
              >
                {onEdit && (
                  <Animated.View
                    entering={ZoomIn.duration(300).delay(1600)}
                    style={{ marginBottom: 10 }}
                  >
                    <TouchableOpacity
                      style={styles.actionButton}
                      activeOpacity={0.8}
                      onPress={() => onEdit(event)}
                    >
                      <Text style={styles.actionText}>Edit Event</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
                {onDelete && (
                  <Animated.View entering={ZoomIn.duration(300).delay(1700)}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      activeOpacity={0.8}
                      onPress={() => onDelete(event.id)}
                    >
                      <Text style={[styles.actionText, styles.deleteText]}>Delete Event</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </Animated.View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: height * 0.88,
    borderTopLeftRadius: R.xxl,
    borderTopRightRadius: R.xxl,
    overflow: 'hidden',
    ...shadow.lg,
  } as any,
  content: {
    flex: 1,
    backgroundColor: C.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: S.lg,
    paddingTop: S.xl,
    paddingBottom: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: { ...T.small, color: C.t2 } as any,
  headerTitle: {
    ...T.h2,
    color: C.cream,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: S.sm,
  } as any,
  placeholder: { width: 32 },
  scrollContent: { flex: 1 },
  eventInfo: {
    ...glass,
    margin: S.lg,
    marginBottom: S.sm,
    padding: S.md,
    borderRadius: R.lg,
  } as any,
  eventDescription: {
    ...T.body,
    color: C.t2,
    marginBottom: S.sm,
  } as any,
  dateContainer: {
    flexDirection: 'row',
    marginBottom: S.xs,
    alignItems: 'center',
    gap: S.xs,
  },
  dateLabel: {
    ...T.small,
    color: C.t3,
    fontWeight: '600' as const,
  } as any,
  dateValue: {
    ...T.small,
    color: C.cream,
    flex: 1,
  } as any,
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
  },
  countdownLabel: {
    ...T.small,
    color: C.t3,
    fontWeight: '600' as const,
  } as any,
  countdownValue: {
    ...T.small,
    color: C.rose,
    fontWeight: '700' as const,
    flex: 1,
  } as any,
  giftsSection: {
    paddingHorizontal: S.lg,
    paddingBottom: S.sm,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 2,
    color: C.taupe,
    marginBottom: S.sm,
    marginTop: S.sm,
  },
  emptyState: {
    ...glass,
    alignItems: 'center',
    paddingVertical: S.xl,
    borderRadius: R.lg,
  } as any,
  emptyText: {
    ...T.body,
    color: C.cream,
    textAlign: 'center',
  } as any,
  emptySubtext: {
    ...T.small,
    color: C.t3,
    textAlign: 'center',
    marginTop: S.xs,
    paddingHorizontal: S.lg,
  } as any,
  giftCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: R.md,
    padding: S.sm,
    marginBottom: S.xs,
    borderWidth: 1,
    borderColor: C.border,
  },
  giftInfo: { flex: 1 },
  giftName: {
    ...T.h3,
    color: C.cream,
    marginBottom: 2,
  } as any,
  giftDescription: {
    ...T.small,
    color: C.t2,
    marginBottom: 4,
  } as any,
  giftPillRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  giftPricePill: {
    backgroundColor: 'rgba(90,240,208,0.12)', borderRadius: R.full,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(90,240,208,0.30)',
  },
  giftPriceText: { fontSize: 9, fontWeight: '700' as const, color: C.teal, letterSpacing: 0.8 },
  giftTypePill: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: R.full,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  giftTypeText: { fontSize: 9, fontWeight: '600' as const, color: C.t3 },
  giftCardExpanded: { borderColor: C.rose + '40', backgroundColor: 'rgba(255,107,129,0.06)' },
  giftExpandedBody: { marginTop: S.xs, paddingTop: S.xs, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  giftLink: { ...T.small, color: C.teal, textDecorationLine: 'underline', marginBottom: 2 } as any,
  giftDetailLine: { ...T.small, color: C.taupe } as any,
  giftArrow: {
    fontSize: 16,
    color: C.t3,
  },
  sharingSection: {
    paddingHorizontal: S.lg,
    paddingBottom: S.sm,
  },
  shareRow: {
    flexDirection: 'row',
    gap: S.xs,
    alignItems: 'center',
  },
  shareInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: C.borderMed,
    borderWidth: 1,
    borderRadius: R.md,
    paddingHorizontal: S.sm,
    paddingVertical: 10,
    fontSize: 14,
    color: C.cream,
  },
  shareBtn: {
    backgroundColor: C.rose,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    paddingVertical: 10,
  },
  shareBtnText: { ...T.small, color: '#fff', fontWeight: '700' as const } as any,
  actionsSection: {
    paddingHorizontal: S.lg,
    paddingTop: S.xs,
    paddingBottom: S.xxl,
    gap: S.sm,
  },
  actionButton: {
    backgroundColor: 'rgba(255,107,129,0.14)',
    borderRadius: R.lg,
    padding: S.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,107,129,0.30)',
  },
  actionText: {
    ...T.body,
    color: C.rose,
    fontWeight: '700' as const,
  } as any,
  deleteButton: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.30)',
  },
  deleteText: { color: C.error },
});