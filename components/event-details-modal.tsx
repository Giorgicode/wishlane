import DatePickerField from '@/components/date-picker-field';
import { C, glass, R, S, shadow, T } from '@/constants/design';
import { assignGiftToEvent, createGift, shareEventWithUserByEmail } from '@/lib/firestore';
import { toast } from '@/lib/toast';
import { EventItem, Gift } from '@/types/firebase';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Dimensions, FlatList, Linking, Modal,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import Animated, {
  FadeIn, Layout, runOnJS, SlideInUp,
  useAnimatedStyle, useSharedValue,
  withDelay, withSequence, withSpring, withTiming, ZoomIn,
} from 'react-native-reanimated';

const { height } = Dimensions.get('window');

interface EventDetailsModalProps {
  visible: boolean;
  event: EventItem | null;
  gifts: Gift[];
  onClose: () => void;
  onSave?: (eventId: string, patch: { name: string; description: string; expirationDate: Date | null }) => Promise<void>;
  onDelete?: (eventId: string) => void;
  uid?: string | null;
  displayName?: string | null;
}

export default function EventDetailsModal({
  visible, event, gifts, onClose, onSave, onDelete, uid, displayName,
}: EventDetailsModalProps) {
  const [shareEmail, setShareEmail]       = useState('');
  const [isSharing, setIsSharing]         = useState(false);
  const [expandedGiftId, setExpandedGiftId] = useState<string | null>(null);
  const [editName, setEditName]           = useState('');
  const [editDesc, setEditDesc]           = useState('');
  const [editDate, setEditDate]           = useState<Date | null>(null);
  const [saving, setSaving]               = useState(false);
  const [addGiftOpen, setAddGiftOpen]     = useState(false);
  const [newGiftName, setNewGiftName]     = useState('');
  const [newGiftDesc, setNewGiftDesc]     = useState('');
  const [newGiftPrice, setNewGiftPrice]   = useState('');
  const [addingGift, setAddingGift]       = useState(false);

  const modalScale       = useSharedValue(0.8);
  const modalOpacity     = useSharedValue(0);
  const modalTranslateY  = useSharedValue(100);
  const backgroundOpacity = useSharedValue(0);
  const contentScale     = useSharedValue(0.9);

  // All useAnimatedStyle calls before any early return
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }, { translateY: modalTranslateY.value }],
  }));
  const backgroundAnimatedStyle = useAnimatedStyle(() => ({ opacity: backgroundOpacity.value }));
  const contentAnimatedStyle    = useAnimatedStyle(() => ({ transform: [{ scale: contentScale.value }] }));

  useEffect(() => {
    if (visible) {
      backgroundOpacity.value = withTiming(1, { duration: 300 });
      modalOpacity.value      = withTiming(1, { duration: 400 });
      modalScale.value        = withSpring(1, { damping: 15, stiffness: 100 });
      modalTranslateY.value   = withSpring(0, { damping: 20, stiffness: 120 });
      contentScale.value      = withDelay(200, withSpring(1, { damping: 12, stiffness: 80 }));
    } else {
      backgroundOpacity.value = withTiming(0, { duration: 200 });
      modalOpacity.value      = withTiming(0, { duration: 250 });
      modalScale.value        = withTiming(0.8, { duration: 200 });
      modalTranslateY.value   = withTiming(100, { duration: 200 });
      contentScale.value      = withTiming(0.9, { duration: 150 });
    }
  }, [visible]);

  // Populate edit fields whenever event changes
  useEffect(() => {
    if (!event) return;
    setEditName(event.name ?? '');
    setEditDesc(event.description ?? '');
    const raw = event.expirationDate;
    setEditDate(raw ? ((raw as any).toDate ? (raw as any).toDate() : new Date(raw as any)) : null);
  }, [event?.id, visible]);

  if (!event) return null;

  const eventGifts = gifts.filter(g => g.eventId === event.id);
  const isDirty = editName !== (event.name ?? '') ||
    editDesc !== (event.description ?? '') ||
    editDate?.getTime() !== (event.expirationDate
      ? ((event.expirationDate as any).toDate
          ? (event.expirationDate as any).toDate().getTime()
          : new Date(event.expirationDate as any).getTime())
      : null);

  const getDaysUntil = (date: Date) => {
    const diff = Math.ceil((date.getTime() - Date.now()) / 86400000);
    if (diff < 0)  return `${Math.abs(diff)} days ago`;
    if (diff === 0) return 'Today!';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days left`;
  };

  const handleSave = async () => {
    if (!onSave || !editName.trim()) { toast.error('Event name is required'); return; }
    setSaving(true);
    try {
      await onSave(event.id, { name: editName.trim(), description: editDesc.trim(), expirationDate: editDate });
      toast.success('Event updated');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleShare = async () => {
    if (!shareEmail.trim()) { toast.error('Enter an email address'); return; }
    if (!uid) return;
    setIsSharing(true);
    try {
      await shareEventWithUserByEmail(uid, event.id, shareEmail.trim(), displayName ?? undefined);
      toast.success(`Shared with ${shareEmail.trim()}`, 'Shared');
      setShareEmail('');
    } catch (e: any) { toast.error(e.message || 'Failed to share event'); }
    finally { setIsSharing(false); }
  };

  const handleAddGift = async () => {
    if (!uid || !newGiftName.trim()) { toast.error('Gift name is required'); return; }
    setAddingGift(true);
    try {
      const gift = await createGift(uid, { name: newGiftName.trim(), description: newGiftDesc.trim(), price: newGiftPrice.trim() });
      await assignGiftToEvent(uid, gift.id, event.id);
      setNewGiftName(''); setNewGiftDesc(''); setNewGiftPrice('');
      setAddGiftOpen(false);
      toast.success('Gift added to event');
    } catch { toast.error('Failed to add gift'); }
    finally { setAddingGift(false); }
  };

  const handleClose = () => {
    modalScale.value    = withSequence(withTiming(1.05, { duration: 150 }), withTiming(0.8, { duration: 200 }));
    modalTranslateY.value = withTiming(50, { duration: 200 });
    setTimeout(() => runOnJS(onClose)(), 200);
  };

  const toggleGift = (id: string) => setExpandedGiftId(prev => prev === id ? null : id);

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
      <Animated.View style={[styles.overlay, backgroundAnimatedStyle]}>
        <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
          <Animated.View style={[styles.content, contentAnimatedStyle]}>

            {/* Header */}
            <Animated.View style={styles.header} entering={FadeIn.duration(400).delay(300)}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.8}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.headerTitle}
                value={editName}
                onChangeText={setEditName}
                placeholder="Event name"
                placeholderTextColor={C.t3}
              />
              {onSave && (
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving || !isDirty}
                  style={[styles.saveBtn, (!isDirty || saving) && { opacity: 0.4 }]}
                >
                  {saving
                    ? <ActivityIndicator size="small" color={C.rose} />
                    : <Text style={styles.saveBtnText}>Save</Text>
                  }
                </TouchableOpacity>
              )}
            </Animated.View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>

              {/* Event Info — editable */}
              <Animated.View style={styles.eventInfo} entering={SlideInUp.duration(500).delay(600)} layout={Layout.springify()}>
                <TextInput
                  style={styles.descInput}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  placeholder="Add a description…"
                  placeholderTextColor={C.t3}
                  multiline
                />
                <DatePickerField
                  value={editDate}
                  onChange={setEditDate}
                  showTime
                  placeholder="Event date & time (optional)"
                  style={styles.dateField}
                />
                {editDate && (
                  <Animated.View style={styles.countdownContainer} entering={FadeIn.duration(300).delay(800)}>
                    <Text style={styles.countdownLabel}>In:</Text>
                    <Text style={styles.countdownValue}>{getDaysUntil(editDate)}</Text>
                  </Animated.View>
                )}
              </Animated.View>

              {/* Gifts */}
              <Animated.View style={styles.giftsSection} entering={SlideInUp.duration(500).delay(1000)} layout={Layout.springify()}>
                <View style={styles.giftsSectionHeader}>
                  <Text style={styles.sectionTitle}>Gifts for this Event ({eventGifts.length})</Text>
                  <TouchableOpacity
                    style={[styles.addGiftBtn, addGiftOpen && styles.addGiftBtnActive]}
                    onPress={() => setAddGiftOpen(o => !o)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.addGiftBtnText, addGiftOpen && { color: C.t3 }]}>{addGiftOpen ? '✕' : '+ Add Gift'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Inline add-gift form */}
                {addGiftOpen && (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.addGiftForm}>
                    <TextInput
                      style={styles.addGiftInput}
                      placeholder="Gift name *"
                      placeholderTextColor={C.t3}
                      value={newGiftName}
                      onChangeText={setNewGiftName}
                    />
                    <TextInput
                      style={styles.addGiftInput}
                      placeholder="Description (optional)"
                      placeholderTextColor={C.t3}
                      value={newGiftDesc}
                      onChangeText={setNewGiftDesc}
                    />
                    <TextInput
                      style={styles.addGiftInput}
                      placeholder="Price (optional)"
                      placeholderTextColor={C.t3}
                      value={newGiftPrice}
                      onChangeText={setNewGiftPrice}
                    />
                    <TouchableOpacity
                      style={[styles.addGiftSubmit, addingGift && { opacity: 0.6 }]}
                      onPress={handleAddGift}
                      disabled={addingGift}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addGiftSubmitText}>{addingGift ? 'Adding…' : 'Add to Event'}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {eventGifts.length === 0 && !addGiftOpen ? (
                  <Animated.View style={styles.emptyState} entering={ZoomIn.duration(400).delay(1200)}>
                    <Text style={styles.emptyText}>No gifts yet</Text>
                    <Text style={styles.emptySubtext}>Tap "+ Add Gift" to add the first one</Text>
                  </Animated.View>
                ) : (
                  <FlatList
                    data={eventGifts}
                    keyExtractor={item => item.id}
                    scrollEnabled={false}
                    renderItem={({ item, index }) => {
                      const isExpanded = expandedGiftId === item.id;
                      return (
                        <Animated.View entering={SlideInUp.duration(400).delay(1200 + index * 100)} layout={Layout.springify() as any}>
                          <TouchableOpacity
                            style={[styles.giftCard, isExpanded && styles.giftCardExpanded]}
                            onPress={() => toggleGift(item.id)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.giftInfo}>
                              <Text style={styles.giftName}>{item.name}</Text>
                              {!!item.description && <Text style={styles.giftDescription}>{item.description}</Text>}
                              <View style={styles.giftPillRow}>
                                {!!item.price && <View style={styles.giftPricePill}><Text style={styles.giftPriceText}>{item.price}</Text></View>}
                                {!!item.type  && <View style={styles.giftTypePill}><Text style={styles.giftTypeText}>{item.type}</Text></View>}
                              </View>
                              {isExpanded && (
                                <Animated.View entering={FadeIn.duration(200)} style={styles.giftExpandedBody}>
                                  {item.type === 'online'   && !!item.link && <TouchableOpacity onPress={() => Linking.openURL(item.link!)}><Text style={styles.giftLink}>{item.link}</Text></TouchableOpacity>}
                                  {item.type === 'brand'    && !!item.brand && <Text style={styles.giftDetailLine}>Brand: {item.brand}</Text>}
                                  {item.type === 'location' && (item.city || item.place) && <Text style={styles.giftDetailLine}>{[item.place, item.city, item.country].filter(Boolean).join(' · ')}</Text>}
                                </Animated.View>
                              )}
                            </View>
                            <Text style={styles.giftArrow}>{isExpanded ? '↑' : '↓'}</Text>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    }}
                  />
                )}
              </Animated.View>

              {/* Share */}
              <Animated.View style={styles.sharingSection} entering={SlideInUp.duration(500).delay(1300)} layout={Layout.springify()}>
                <Text style={styles.sectionTitle}>Share with a Friend</Text>
                <View style={styles.shareRow}>
                  <TextInput
                    style={styles.shareInput}
                    placeholder="Enter email address"
                    placeholderTextColor={C.t3}
                    value={shareEmail}
                    onChangeText={setShareEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={[styles.shareBtn, isSharing && { opacity: 0.6 }]} onPress={handleShare} disabled={isSharing}>
                    <Text style={styles.shareBtnText}>{isSharing ? '…' : 'Share'}</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Delete */}
              {onDelete && (
                <Animated.View style={styles.actionsSection} entering={SlideInUp.duration(500).delay(1500)}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    activeOpacity={0.8}
                    onPress={() => onDelete(event.id)}
                  >
                    <Text style={[styles.actionText, styles.deleteText]}>Delete Event</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  modalContainer: {
    height: height * 0.88,
    borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl,
    overflow: 'hidden', ...shadow.lg,
  } as any,
  content: { flex: 1, backgroundColor: C.surface },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: S.lg, paddingTop: S.xl, paddingBottom: S.md,
    borderBottomWidth: 1, borderBottomColor: C.border, gap: S.sm,
  },
  closeButton: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  closeText: { ...T.small, color: C.t2 } as any,
  headerTitle: {
    ...T.h2, color: C.cream, flex: 1,
    paddingVertical: 4, paddingHorizontal: S.xs,
    borderRadius: R.sm,
    borderWidth: 1, borderColor: 'transparent',
  } as any,
  saveBtn: {
    paddingHorizontal: S.md, paddingVertical: 8,
    borderRadius: R.full, borderWidth: 1,
    borderColor: C.rose + '60', backgroundColor: C.rose + '18',
    flexShrink: 0,
  },
  saveBtnText: { ...T.small, color: C.rose, fontWeight: '700' as const } as any,
  scrollContent: { flex: 1 },
  eventInfo: { ...glass, margin: S.lg, marginBottom: S.sm, padding: S.md, borderRadius: R.lg } as any,
  descInput: {
    ...T.body, color: C.t2, marginBottom: S.sm,
    minHeight: 40, paddingVertical: S.xs,
  } as any,
  dateField: { marginBottom: S.xs },
  countdownContainer: { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  countdownLabel: { ...T.small, color: C.t3, fontWeight: '600' as const } as any,
  countdownValue: { ...T.small, color: C.rose, fontWeight: '700' as const, flex: 1 } as any,
  giftsSection: { paddingHorizontal: S.lg, paddingBottom: S.sm },
  giftsSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: S.sm, marginBottom: S.sm },
  sectionTitle: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 2, color: C.taupe },
  addGiftBtn: { paddingHorizontal: S.sm, paddingVertical: 5, borderRadius: R.full, borderWidth: 1, borderColor: C.rose + '60', backgroundColor: C.rose + '14' },
  addGiftBtnActive: { borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.06)' },
  addGiftBtnText: { fontSize: 11, fontWeight: '700' as const, color: C.rose },
  addGiftForm: { ...glass, borderRadius: R.lg, padding: S.md, marginBottom: S.sm, gap: S.xs } as any,
  addGiftInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: R.md, borderWidth: 1, borderColor: C.border, color: C.t1, paddingHorizontal: S.sm, paddingVertical: 10, fontSize: 14 },
  addGiftSubmit: { backgroundColor: C.rose, borderRadius: R.md, paddingVertical: 12, alignItems: 'center', marginTop: S.xs },
  addGiftSubmitText: { ...T.small, color: '#fff', fontWeight: '700' as const } as any,
  emptyState: { ...glass, alignItems: 'center', paddingVertical: S.xl, borderRadius: R.lg } as any,
  emptyText: { ...T.body, color: C.cream, textAlign: 'center' } as any,
  emptySubtext: { ...T.small, color: C.t3, textAlign: 'center', marginTop: S.xs, paddingHorizontal: S.lg } as any,
  giftCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: R.md,
    padding: S.sm, marginBottom: S.xs, borderWidth: 1, borderColor: C.border,
  },
  giftInfo: { flex: 1 },
  giftName: { ...T.h3, color: C.cream, marginBottom: 2 } as any,
  giftDescription: { ...T.small, color: C.t2, marginBottom: 4 } as any,
  giftPillRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  giftPricePill: { backgroundColor: 'rgba(90,240,208,0.12)', borderRadius: R.full, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(90,240,208,0.30)' },
  giftPriceText: { fontSize: 9, fontWeight: '700' as const, color: C.teal, letterSpacing: 0.8 },
  giftTypePill: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: R.full, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  giftTypeText: { fontSize: 9, fontWeight: '600' as const, color: C.t3 },
  giftCardExpanded: { borderColor: C.rose + '40', backgroundColor: 'rgba(255,107,129,0.06)' },
  giftExpandedBody: { marginTop: S.xs, paddingTop: S.xs, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  giftLink: { ...T.small, color: C.teal, textDecorationLine: 'underline', marginBottom: 2 } as any,
  giftDetailLine: { ...T.small, color: C.taupe } as any,
  giftArrow: { fontSize: 16, color: C.t3 },
  sharingSection: { paddingHorizontal: S.lg, paddingBottom: S.sm },
  shareRow: { flexDirection: 'row', gap: S.xs, alignItems: 'center' },
  shareInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderColor: C.borderMed,
    borderWidth: 1, borderRadius: R.md, paddingHorizontal: S.sm, paddingVertical: 10,
    fontSize: 14, color: C.cream,
  },
  shareBtn: { backgroundColor: C.rose, borderRadius: R.md, paddingHorizontal: S.md, paddingVertical: 10 },
  shareBtnText: { ...T.small, color: '#fff', fontWeight: '700' as const } as any,
  actionsSection: { paddingHorizontal: S.lg, paddingTop: S.xs, paddingBottom: S.xxl },
  actionButton: { backgroundColor: 'rgba(255,107,129,0.14)', borderRadius: R.lg, padding: S.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,107,129,0.30)' },
  actionText: { ...T.body, color: C.rose, fontWeight: '700' as const } as any,
  deleteButton: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.30)' },
  deleteText: { color: C.error },
});
