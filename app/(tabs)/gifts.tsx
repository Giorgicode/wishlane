import AmbientBg from '@/components/ambient-bg';
import SkeletonBlock from '@/components/skeleton-block';
import { C, glass, glassStrong, R, S, SCREEN, shadow, spring, T, TAB_BAR_HEIGHT } from '@/constants/design';
import { useAuth } from '@/hooks/useAuth';
import { assignGiftToEvent, createGift, deleteGift, updateGift } from '@/lib/firestore';
import { useAppData } from '@/contexts/AppDataContext';
import { toast } from '@/lib/toast';
import type { EventItem, Gift } from '@/types/firebase';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Dimensions, FlatList, Image, KeyboardAvoidingView,
  Linking, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import Animated, {
  FadeIn, FadeInUp, FadeOut,
  interpolate, interpolateColor,
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';

const FAB_SIZE = 60;
// Cap width so the form stays compact on wide screens (web)
const FAB_EXPANDED_W = Math.min(SCREEN.width - 32, 380);
const FAB_EXPANDED_H = Math.max(Math.min(Dimensions.get('window').height * 0.58, 460), 360);

/* ─── Gift categories ────────────────────────────────────────── */
export interface GiftCategory {
  key: string;
  label: string;
  color: string;
  imageUri: string;
}

export const GIFT_CATEGORIES: GiftCategory[] = [
  {
    key: 'beauty',
    label: 'Beauty',
    color: '#F472B6',
    imageUri: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=80',
  },
  {
    key: 'wellness',
    label: 'Wellness',
    color: '#5AF0D0',
    imageUri: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80',
  },
  {
    key: 'hair',
    label: 'Hair Care',
    color: '#C084FC',
    imageUri: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
  },
  {
    key: 'food',
    label: 'Food & Drink',
    color: '#F59E0B',
    imageUri: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80',
  },
  {
    key: 'outdoor',
    label: 'Outdoor',
    color: '#38BDF8',
    imageUri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
  },
  {
    key: 'fashion',
    label: 'Fashion',
    color: '#FF6B81',
    imageUri: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=400&q=80',
  },
  {
    key: 'tech',
    label: 'Tech',
    color: '#34D399',
    imageUri: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
  },
  {
    key: 'home',
    label: 'Home',
    color: '#C8A95A',
    imageUri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=80',
  },
  {
    key: 'experience',
    label: 'Experience',
    color: '#A78BFA',
    imageUri: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=400&q=80',
  },
  {
    key: 'fitness',
    label: 'Fitness',
    color: '#FB923C',
    imageUri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80',
  },
  {
    key: 'other',
    label: 'Other',
    color: C.t2,
    imageUri: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=400&q=80',
  },
];

function getCategoryMeta(key?: string): GiftCategory {
  return GIFT_CATEGORIES.find((c) => c.key === key) ?? GIFT_CATEGORIES[GIFT_CATEGORIES.length - 1];
}

/* ─── Category photo card (used in picker) ───────────────────── */
const CAT_CARD_W = 72;
const CAT_CARD_H = 56;

function CatPhotoCard({ cat, selected, onPress }: { cat: GiftCategory; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.catCard, selected && { borderColor: cat.color, borderWidth: 2 }]}>
      <Image source={{ uri: cat.imageUri }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />
      <View style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: selected ? cat.color + '55' : 'rgba(4,4,14,0.52)' },
      ]} />
      <Text style={[styles.catCardLabel, selected && { color: '#fff', fontWeight: '700' }]}>
        {cat.label}
      </Text>
    </Pressable>
  );
}

/* ─── Gift card ──────────────────────────────────────────────── */
const CARD_H = 108;
const THUMB_SIZE = 80;

function GiftCard({ item, onEdit, onDelete, onAssign, eventName }: {
  item: Gift; onEdit: () => void; onDelete: () => void;
  onAssign: () => void; eventName?: string;
}) {
  const cat = getCategoryMeta(item.category);
  const accent = cat.color;

  return (
    <Animated.View entering={FadeInUp.duration(380)} style={styles.card}>
      {/* Left color strip */}
      <View style={[styles.cardStrip, { backgroundColor: accent }]} />

      {/* Main content */}
      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <View style={[styles.catLabel, { backgroundColor: accent + '18', borderColor: accent + '45' }]}>
            <Text style={[styles.catLabelText, { color: accent }]}>{cat.label.toUpperCase()}</Text>
          </View>
          {!!item.price && (
            <View style={styles.pricePill}>
              <Text style={styles.pricePillText}>{item.price}</Text>
            </View>
          )}
          {!!item.reservedBy && (
            <View style={styles.reservedPill}>
              <Text style={styles.reservedPillText}>Reserved</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>

        {!!item.description ? (
          <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
        ) : item.type === 'online' && !!item.link ? (
          <Pressable onPress={() => Linking.openURL(item.link!)}>
            <Text style={styles.cardLink} numberOfLines={1}>{item.link}</Text>
          </Pressable>
        ) : item.type === 'brand' && !!item.brand ? (
          <Text style={styles.cardMeta}>{item.brand}</Text>
        ) : item.type === 'location' && (item.city || item.place) ? (
          <Text style={styles.cardMeta}>{[item.place, item.city].filter(Boolean).join(' · ')}</Text>
        ) : null}

        {!!eventName && (
          <View style={styles.eventPill}>
            <View style={styles.eventPillDot} />
            <Text style={styles.eventPillText} numberOfLines={1}>{eventName}</Text>
          </View>
        )}
      </View>

      {/* Photo thumbnail + action buttons */}
      <View style={styles.cardRight}>
        <View style={[styles.thumbWrap, { borderColor: accent + '45' }]}>
          <Image source={{ uri: cat.imageUri }} style={styles.thumb} resizeMode="cover" />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: accent + '14', borderRadius: R.md }]} />
        </View>
        <View style={styles.actionRow}>
          <Pressable onPress={onEdit} hitSlop={6} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>Edit</Text>
          </Pressable>
          <Pressable onPress={onAssign} hitSlop={6} style={[styles.iconBtn, styles.iconBtnAssign]}>
            <Text style={[styles.iconBtnText, styles.iconBtnAssignText]}>Assign</Text>
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={6} style={[styles.iconBtn, styles.iconBtnDel]}>
            <Text style={[styles.iconBtnText, styles.iconBtnDelText]}>Del</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

/* ─── Screen ─────────────────────────────────────────────────── */
type GiftType = 'online' | 'brand' | 'location';

const TYPE_OPTS: { key: GiftType; label: string }[] = [
  { key: 'online',   label: 'Online'  },
  { key: 'brand',    label: 'Brand'   },
  { key: 'location', label: 'Place'   },
];
const TYPE_COLOR: Record<GiftType, string> = {
  online:   C.teal,
  brand:    C.rose,
  location: C.goldLux,
};

export default function GiftsScreen() {
  const { gifts, giftsReady, events } = useAppData();
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', type: 'online' as GiftType, link: '', brand: '', country: '', city: '', place: '', category: 'beauty' });
  const [formVisible, setFormVisible] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '',
    type: 'online' as GiftType,
    category: 'beauty',
    link: '', brand: '', country: '', city: '', place: '',
  });
  const [giftToAssign, setGiftToAssign] = useState<Gift | null>(null);
  const [pickedEventId, setPickedEventId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const { uid } = useAuth();

  const filteredGifts = useMemo(() => {
    let result = gifts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((g) =>
        g.name.toLowerCase().includes(q) ||
        (g.description ?? '').toLowerCase().includes(q) ||
        (g.brand ?? '').toLowerCase().includes(q),
      );
    }
    if (filterCategory) {
      result = result.filter((g) => g.category === filterCategory);
    }
    return result;
  }, [gifts, searchQuery, filterCategory]);
  const isOpen = useSharedValue(0);

  const getEventName = (eventId?: string | null): string | undefined =>
    eventId ? (events.find((e) => e.id === eventId)?.name ?? undefined) : undefined;

  const openAssignModal = (gift: Gift) => {
    setPickedEventId(gift.eventId ?? null);
    setGiftToAssign(gift);
  };

  const handleSaveAssign = async () => {
    if (!uid || !giftToAssign) return;
    setAssigning(true);
    try {
      await assignGiftToEvent(uid, giftToAssign.id, pickedEventId);
      const eventName = pickedEventId ? events.find((e) => e.id === pickedEventId)?.name : null;
      toast.success(eventName ? `Assigned to "${eventName}"` : 'Removed from event', 'Gift updated');
      setGiftToAssign(null);
    } catch {
      toast.error('Failed to assign gift');
    } finally {
      setAssigning(false);
    }
  };

  const openFAB = () => { setFormVisible(true); isOpen.value = withSpring(1, spring.snappy); };
  const closeFAB = () => { isOpen.value = withSpring(0, spring.fast); setTimeout(() => setFormVisible(false), 320); };

  const handleAddGift = async () => {
    setAddError(null);
    if (!uid) {
      setAddError('Not signed in — please refresh the page and sign in again.');
      console.error('[gifts] uid is null');
      return;
    }
    if (!form.name.trim()) { setAddError('Gift name is required'); return; }
    setSaving(true);
    try {
      await createGift(uid, {
        name: form.name.trim(),
        description: form.description || undefined,
        price: form.price || undefined,
        type: form.type,
        category: form.category,
        link: form.link || undefined,
        brand: form.brand || undefined,
        country: form.country || undefined,
        city: form.city || undefined,
        place: form.place || undefined,
      });
      setForm({ name: '', description: '', price: '', type: 'online', category: 'beauty', link: '', brand: '', country: '', city: '', place: '' });
      setAddError(null);
      closeFAB();
    } catch (err: any) {
      console.error('[gifts] createGift failed:', err);
      setAddError(err?.message ?? 'Save failed — check console for details');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGift = (giftId: string) => {
    if (!uid) return;
    Alert.alert('Delete Gift', 'Delete this gift?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteGift(uid, giftId); }
        catch { toast.error('Failed to delete gift'); }
      }},
    ]);
  };

  const openEditGift = (item: Gift) => {
    setEditForm({
      name: item.name,
      description: item.description ?? '',
      price: item.price ?? '',
      type: (item.type as GiftType) ?? 'online',
      link: item.link ?? '',
      brand: item.brand ?? '',
      country: item.country ?? '',
      city: item.city ?? '',
      place: item.place ?? '',
      category: item.category ?? 'other',
    });
    setEditingGift(item);
  };

  const saveEditGift = async () => {
    if (!uid || !editingGift) return;
    if (!editForm.name.trim()) { toast.error('Gift name is required'); return; }
    try {
      await updateGift(uid, editingGift.id, {
        name: editForm.name.trim(),
        description: editForm.description,
        price: editForm.price,
        type: editForm.type,
        link: editForm.type === 'online' ? editForm.link : '',
        brand: editForm.type === 'brand' ? editForm.brand : '',
        country: editForm.type === 'location' ? editForm.country : '',
        city: editForm.type === 'location' ? editForm.city : '',
        place: editForm.type === 'location' ? editForm.place : '',
        category: editForm.category,
      });
      setEditingGift(null);
    } catch { toast.error('Failed to save changes'); }
  };

  const selectedCat = getCategoryMeta(form.category);

  const morphStyle = useAnimatedStyle(() => ({
    width: interpolate(isOpen.value, [0, 1], [FAB_SIZE, FAB_EXPANDED_W]),
    height: interpolate(isOpen.value, [0, 1], [FAB_SIZE, FAB_EXPANDED_H]),
    borderRadius: interpolate(isOpen.value, [0, 1], [FAB_SIZE / 2, R.xl]),
    backgroundColor: interpolateColor(isOpen.value, [0, 1], [C.rose, 'rgba(10,10,22,0.97)']),
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
      <AmbientBg preset="rose" />

      {!giftsReady && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.skeletonList}>
          {[...Array(4)].map((_, i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonStrip} />
              <View style={{ flex: 1, padding: S.sm, gap: 8 }}>
                <SkeletonBlock width="30%" height={10} radius={R.full} />
                <SkeletonBlock width="65%" height={16} />
                <SkeletonBlock width="50%" height={11} />
              </View>
              <View style={{ width: 92, alignItems: 'center', justifyContent: 'center', gap: 8, paddingRight: S.xs }}>
                <SkeletonBlock width={76} height={68} radius={R.md} />
              </View>
            </View>
          ))}
        </Animated.View>
      )}

      <FlatList
        data={filteredGifts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Animated.View entering={FadeIn.duration(400)}>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>MY COLLECTION</Text>
              <View style={styles.eyebrowRule} />
              <Text style={styles.screenTitle}>{gifts.length} {gifts.length === 1 ? 'Gift' : 'Gifts'}</Text>
            </View>

            {/* Search bar */}
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search gifts…"
                placeholderTextColor={C.t3}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {!!searchQuery && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Text style={styles.searchClear}>✕</Text>
                </Pressable>
              )}
            </View>

            {/* Category filter strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterScrollContent}
            >
              <Pressable
                style={[styles.filterChip, !filterCategory && styles.filterChipActive]}
                onPress={() => setFilterCategory(null)}
              >
                <Text style={[styles.filterChipText, !filterCategory && styles.filterChipTextActive]}>All</Text>
              </Pressable>
              {GIFT_CATEGORIES.filter((cat) => gifts.some((g) => g.category === cat.key)).map((cat) => (
                <Pressable
                  key={cat.key}
                  style={[styles.filterChip, filterCategory === cat.key && { backgroundColor: cat.color + '20', borderColor: cat.color + '60' }]}
                  onPress={() => setFilterCategory(filterCategory === cat.key ? null : cat.key)}
                >
                  <Text style={[styles.filterChipText, filterCategory === cat.key && { color: cat.color }]}>{cat.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        }
        ListEmptyComponent={
          searchQuery || filterCategory
            ? <View style={styles.emptySearch}><Text style={styles.emptySearchText}>No gifts match your search</Text></View>
            : <EmptyState />
        }
        renderItem={({ item }) => (
          <GiftCard
            item={item}
            onEdit={() => openEditGift(item)}
            onDelete={() => handleDeleteGift(item.id)}
            onAssign={() => openAssignModal(item)}
            eventName={getEventName(item.eventId)}
          />
        )}
      />

      {/* Backdrop */}
      {formVisible && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={closeFAB} />
        </Animated.View>
      )}

      {/* Morphing FAB */}
      <Animated.View style={[styles.fabShell, morphStyle]}>
        {/* Collapsed: + */}
        <Animated.View
          style={[StyleSheet.absoluteFillObject, styles.fabCenter, plusStyle]}
          pointerEvents={formVisible ? 'none' : 'auto'}
        >
          <Pressable style={StyleSheet.absoluteFillObject} onPress={openFAB} />
          <Text style={styles.plusText}>+</Text>
        </Animated.View>

        {/* Expanded: form */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.formInner, formContentStyle]}
          pointerEvents={formVisible ? 'box-none' : 'none'}
        >
          {/* Header with live category preview */}
          <View style={styles.formHeader}>
            <View style={styles.formTitleRow}>
              <View style={[styles.formCatPreview, { borderColor: selectedCat.color + '80' }]}>
                <Image source={{ uri: selectedCat.imageUri }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(4,4,14,0.35)', borderRadius: R.sm }]} />
              </View>
              <View>
                <Text style={styles.formTitle}>New Gift</Text>
                <Text style={[styles.formCatSub, { color: selectedCat.color }]}>{selectedCat.label}</Text>
              </View>
            </View>
            <Pressable onPress={closeFAB} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Category photo strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.catScroll}
              contentContainerStyle={styles.catScrollContent}
            >
              {GIFT_CATEGORIES.map((cat) => (
                <CatPhotoCard
                  key={cat.key}
                  cat={cat}
                  selected={form.category === cat.key}
                  onPress={() => setForm({ ...form, category: cat.key })}
                />
              ))}
            </ScrollView>

            <TextInput style={styles.formInput} placeholder="Gift name *" placeholderTextColor={C.t3} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
            <TextInput style={styles.formInput} placeholder="Description (optional)" placeholderTextColor={C.t3} value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
            <TextInput style={styles.formInput} placeholder="Price (e.g. $35)" placeholderTextColor={C.t3} value={form.price} onChangeText={(t) => setForm({ ...form, price: t })} />

            {/* Where to get it */}
            <View style={styles.typeRow}>
              {TYPE_OPTS.map((opt) => (
                <Pressable
                  key={opt.key}
                  style={[styles.typeBtn, form.type === opt.key && { backgroundColor: TYPE_COLOR[opt.key] + '20', borderColor: TYPE_COLOR[opt.key] + '60' }]}
                  onPress={() => setForm({ ...form, type: opt.key })}
                >
                  <Text style={[styles.typeBtnText, form.type === opt.key && { color: TYPE_COLOR[opt.key] }]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
            {form.type === 'online'   && <TextInput style={styles.formInput} placeholder="Product URL"  placeholderTextColor={C.t3} value={form.link}  onChangeText={(t) => setForm({ ...form, link: t })} />}
            {form.type === 'brand'    && <TextInput style={styles.formInput} placeholder="Brand name"   placeholderTextColor={C.t3} value={form.brand} onChangeText={(t) => setForm({ ...form, brand: t })} />}
            {form.type === 'location' && <TextInput style={styles.formInput} placeholder="City / Place" placeholderTextColor={C.t3} value={form.city}  onChangeText={(t) => setForm({ ...form, city: t })} />}

            {!!addError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{addError}</Text>
              </View>
            )}

            <Pressable
              style={[styles.submitBtn, { backgroundColor: selectedCat.color, shadowColor: selectedCat.color, opacity: saving ? 0.6 : 1 }]}
              onPress={handleAddGift}
              disabled={saving}
            >
              <Text style={styles.submitBtnText}>{saving ? 'Saving…' : 'Add to Wishlist'}</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </Animated.View>

      {/* Edit modal */}
      <Modal visible={!!editingGift} transparent animationType="slide" onRequestClose={() => setEditingGift(null)}>
        <KeyboardAvoidingView style={styles.modalBg} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit Gift</Text>
              <Pressable onPress={() => setEditingGift(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetSectionLabel}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: S.sm }} contentContainerStyle={{ gap: S.xs, paddingHorizontal: 2 }}>
                {GIFT_CATEGORIES.map((cat) => (
                  <CatPhotoCard key={cat.key} cat={cat} selected={editForm.category === cat.key} onPress={() => setEditForm({ ...editForm, category: cat.key })} />
                ))}
              </ScrollView>

              <TextInput style={styles.sheetInput} placeholder="Gift name"   placeholderTextColor={C.t3} value={editForm.name}        onChangeText={(t) => setEditForm({ ...editForm, name: t })} />
              <TextInput style={styles.sheetInput} placeholder="Description" placeholderTextColor={C.t3} value={editForm.description} onChangeText={(t) => setEditForm({ ...editForm, description: t })} />
              <TextInput style={styles.sheetInput} placeholder="Price"       placeholderTextColor={C.t3} value={editForm.price}       onChangeText={(t) => setEditForm({ ...editForm, price: t })} />

              <Text style={[styles.sheetSectionLabel, { marginTop: S.xs }]}>TYPE</Text>
              <View style={styles.typeRow}>
                {TYPE_OPTS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    style={[styles.typeBtn, editForm.type === opt.key && { backgroundColor: TYPE_COLOR[opt.key] + '20', borderColor: TYPE_COLOR[opt.key] + '60' }]}
                    onPress={() => setEditForm({ ...editForm, type: opt.key })}
                  >
                    <Text style={[styles.typeBtnText, editForm.type === opt.key && { color: TYPE_COLOR[opt.key] }]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
              {editForm.type === 'online'   && <TextInput style={styles.sheetInput} placeholder="Product URL" placeholderTextColor={C.t3} value={editForm.link}  onChangeText={(t) => setEditForm({ ...editForm, link: t })} autoCapitalize="none" />}
              {editForm.type === 'brand'    && <TextInput style={styles.sheetInput} placeholder="Brand name" placeholderTextColor={C.t3} value={editForm.brand} onChangeText={(t) => setEditForm({ ...editForm, brand: t })} />}
              {editForm.type === 'location' && <>
                <TextInput style={styles.sheetInput} placeholder="Country"     placeholderTextColor={C.t3} value={editForm.country} onChangeText={(t) => setEditForm({ ...editForm, country: t })} />
                <TextInput style={styles.sheetInput} placeholder="City"        placeholderTextColor={C.t3} value={editForm.city}    onChangeText={(t) => setEditForm({ ...editForm, city: t })} />
                <TextInput style={styles.sheetInput} placeholder="Place/Store" placeholderTextColor={C.t3} value={editForm.place}   onChangeText={(t) => setEditForm({ ...editForm, place: t })} />
              </>}
            </ScrollView>

            <Pressable style={styles.primaryBtn} onPress={saveEditGift}>
              <Text style={styles.primaryBtnText}>Save Changes</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Assign to Event modal */}
      <Modal visible={!!giftToAssign} transparent animationType="slide" onRequestClose={() => setGiftToAssign(null)}>
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Assign to Event</Text>
                {!!giftToAssign?.name && (
                  <Text style={styles.assignGiftName} numberOfLines={1}>{giftToAssign.name}</Text>
                )}
              </View>
              <Pressable onPress={() => setGiftToAssign(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {/* No-event option */}
              <Pressable
                style={[styles.eventOption, pickedEventId === null && styles.eventOptionActive]}
                onPress={() => setPickedEventId(null)}
              >
                <View style={[styles.eventOptionRadio, pickedEventId === null && { borderColor: C.rose, backgroundColor: C.rose + '25' }]}>
                  {pickedEventId === null && <View style={styles.eventOptionRadioDot} />}
                </View>
                <Text style={[styles.eventOptionText, pickedEventId === null && { color: C.cream }]}>
                  No event (unassign)
                </Text>
              </Pressable>

              {events.length === 0 ? (
                <Text style={styles.assignEmptyText}>No events yet — create one on the Events tab</Text>
              ) : (
                events.map((ev) => (
                  <Pressable
                    key={ev.id}
                    style={[styles.eventOption, pickedEventId === ev.id && styles.eventOptionActive]}
                    onPress={() => setPickedEventId(ev.id)}
                  >
                    <View style={[styles.eventOptionRadio, pickedEventId === ev.id && { borderColor: C.rose, backgroundColor: C.rose + '25' }]}>
                      {pickedEventId === ev.id && <View style={styles.eventOptionRadioDot} />}
                    </View>
                    <Text style={[styles.eventOptionText, pickedEventId === ev.id && { color: C.cream }]} numberOfLines={1}>
                      {ev.name}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>

            <Pressable
              style={[styles.primaryBtn, assigning && { opacity: 0.6 }]}
              onPress={handleSaveAssign}
              disabled={assigning}
            >
              <Text style={styles.primaryBtnText}>{assigning ? 'Saving…' : 'Save'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ─── Empty state ────────────────────────────────────────────── */
function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyGrid}>
        {GIFT_CATEGORIES.slice(0, 6).map((cat) => (
          <View key={cat.key} style={[styles.emptyThumb, { borderColor: cat.color + '40' }]}>
            <Image source={{ uri: cat.imageUri }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(7,7,15,0.28)', borderRadius: R.md }]} />
            <Text style={styles.emptyThumbLabel}>{cat.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.emptyText}>Your wishlist is empty</Text>
      <Text style={styles.emptySub}>Tap + to add your first gift</Text>
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' } as any,
  listContent: { paddingHorizontal: S.md, paddingTop: 80, paddingBottom: TAB_BAR_HEIGHT + FAB_SIZE + 40, maxWidth: 712, alignSelf: 'center' as const, width: '100%' },

  header: { marginBottom: S.xl },
  eyebrow: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 2.4, color: C.taupe, marginBottom: 8 },
  eyebrowRule: { height: 1, width: 40, backgroundColor: C.goldLux, marginBottom: 12, opacity: 0.7, borderRadius: 1 },
  screenTitle: { fontSize: 40, fontWeight: '800' as const, letterSpacing: -1.2, color: C.cream, lineHeight: 42 },

  /* ── Search & filter ── */
  searchBar: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: R.md, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: S.sm, paddingVertical: 8,
    marginBottom: S.xs, gap: S.xs,
  },
  searchIcon: { fontSize: 16, color: C.t3, width: 18, textAlign: 'center' as const },
  searchInput: { flex: 1, ...T.small, color: C.t1, paddingVertical: 0 } as any,
  searchClear: { ...T.small, color: C.t3 } as any,

  filterScroll: { marginBottom: S.md },
  filterScrollContent: { gap: S.xs, paddingHorizontal: 2, paddingVertical: 2 },
  filterChip: {
    paddingHorizontal: S.sm, paddingVertical: 6,
    borderRadius: R.full, borderWidth: 1,
    borderColor: C.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  filterChipActive: { backgroundColor: 'rgba(255,107,129,0.15)', borderColor: C.rose + '60' },
  filterChipText: { ...T.micro, color: C.t3, fontWeight: '600' as const } as any,
  filterChipTextActive: { color: C.rose },
  emptySearch: { alignItems: 'center' as const, paddingTop: S.xxl },
  emptySearchText: { ...T.body, color: C.t3 } as any,

  /* ── Gift card ── */
  card: {
    flexDirection: 'row',
    minHeight: CARD_H,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    marginBottom: S.sm,
    overflow: 'hidden',
    maxWidth: 680,
    alignSelf: 'center' as const,
    width: '100%',
    ...shadow.sm,
  } as any,
  cardStrip: { width: 3 },
  cardContent: { flex: 1, paddingVertical: S.sm, paddingLeft: S.sm, justifyContent: 'center' },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: 5 },
  catLabel: { borderRadius: R.full, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  catLabelText: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 1.2 },
  pricePill: { backgroundColor: 'rgba(90,240,208,0.12)', borderRadius: R.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(90,240,208,0.30)' },
  pricePillText: { fontSize: 9, fontWeight: '700' as const, color: C.teal, letterSpacing: 0.8 },
  reservedPill: { backgroundColor: 'rgba(200,169,90,0.14)', borderRadius: R.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(200,169,90,0.35)' },
  reservedPillText: { fontSize: 9, fontWeight: '700' as const, color: C.goldLux, letterSpacing: 0.8 },
  cardName: { ...T.h3, color: C.cream, marginBottom: 2 } as any,
  cardDesc: { ...T.small, color: C.t2 } as any,
  cardLink: { ...T.small, color: C.teal, textDecorationLine: 'underline' } as any,
  cardMeta: { ...T.small, color: C.taupe } as any,

  cardRight: { width: THUMB_SIZE + 16, alignItems: 'center', justifyContent: 'center', paddingRight: S.sm, paddingLeft: 4, gap: 6 },
  thumbWrap: { width: THUMB_SIZE - 4, height: THUMB_SIZE - 12, borderRadius: R.md, overflow: 'hidden', borderWidth: 1.5 },
  thumb: { width: '100%', height: '100%' } as any,
  actionRow: { flexDirection: 'column', alignItems: 'stretch', gap: 3, width: THUMB_SIZE - 4 },
  iconBtn: { paddingHorizontal: 6, paddingVertical: 4, alignItems: 'center', justifyContent: 'center', borderRadius: R.xs, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' },
  iconBtnText: { fontSize: 10, color: C.t2, fontWeight: '600' as const, letterSpacing: 0.3 },
  iconBtnAssign: { backgroundColor: 'rgba(255,107,129,0.12)', borderColor: C.rose + '40' },
  iconBtnAssignText: { color: C.rose },
  iconBtnDel: { backgroundColor: 'rgba(248,113,113,0.07)', borderColor: 'rgba(248,113,113,0.25)' },
  iconBtnDelText: { color: C.error },

  eventPill: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  eventPillDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.rose, opacity: 0.8 },
  eventPillText: { fontSize: 9, color: C.rose, fontWeight: '600' as const, letterSpacing: 0.4 },

  /* ── Category photo card (picker) ── */
  catCard: {
    width: CAT_CARD_W,
    height: CAT_CARD_H,
    borderRadius: R.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 5,
  },
  catCardLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.4,
    textAlign: 'center',
  },

  /* ── Empty state ── */
  emptyState: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, gap: S.md },
  emptyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs, justifyContent: 'center', marginBottom: S.sm },
  emptyThumb: { width: 96, height: 72, borderRadius: R.md, overflow: 'hidden', borderWidth: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 },
  emptyThumbLabel: { fontSize: 10, fontWeight: '600' as const, color: 'rgba(255,255,255,0.80)', letterSpacing: 0.3 },
  emptyText: { fontSize: 20, fontWeight: '700' as const, color: C.cream },
  emptySub: { ...T.small, color: C.taupe } as any,

  /* ── FAB ── */
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.62)', zIndex: 10 },
  fabShell: { position: 'absolute', bottom: TAB_BAR_HEIGHT + 16, right: 16, overflow: 'hidden', zIndex: 20, ...shadow.glow },
  fabCenter: { alignItems: 'center', justifyContent: 'center' },
  plusText: { ...T.h1, color: C.white, lineHeight: 36 } as any,

  formInner: { padding: S.md, paddingTop: S.sm },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.xs },
  formTitleRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  formCatPreview: { width: 36, height: 36, borderRadius: R.sm, overflow: 'hidden', borderWidth: 1.5 },
  formTitle: { ...T.h3, color: C.cream } as any,
  formCatSub: { fontSize: 11, fontWeight: '600' as const, marginTop: 1 },
  closeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: C.border },
  closeBtnText: { ...T.small, color: C.t2 } as any,

  catScroll: { marginBottom: S.sm },
  catScrollContent: { gap: S.xs, paddingHorizontal: 2 },

  formInput: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: R.md, borderWidth: 1,
    borderColor: C.border, color: C.t1, paddingHorizontal: S.md,
    paddingVertical: 9, marginBottom: S.xs, ...T.small,
  } as any,
  typeRow: { flexDirection: 'row', gap: S.xs, marginBottom: S.xs },
  typeBtn: { flex: 1, paddingVertical: 7, borderRadius: R.md, borderWidth: 1, borderColor: C.border, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  typeBtnText: { ...T.micro, color: C.t3 } as any,
  errorBox: { backgroundColor: 'rgba(248,113,113,0.15)', borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(248,113,113,0.40)', padding: S.sm, marginBottom: S.xs },
  errorText: { fontSize: 12, color: C.error, fontWeight: '600' as const },
  submitBtn: { borderRadius: R.md, paddingVertical: 13, alignItems: 'center', marginTop: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  submitBtnText: { ...T.h3, color: C.white } as any,

  /* ── Edit modal ── */
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' },
  modalSheet: {
    ...glassStrong,
    borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl,
    padding: S.lg, paddingBottom: S.xxl, maxHeight: '90%',
    borderBottomWidth: 0, ...shadow.lg,
  } as any,
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: S.md },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.sm },
  sheetTitle: { ...T.h2, color: C.cream } as any,
  sheetSectionLabel: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 2, color: C.taupe, marginBottom: S.xs },
  sheetInput: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: R.md, borderWidth: 1,
    borderColor: C.border, color: C.t1, padding: S.md, marginBottom: S.sm, ...T.body,
  } as any,
  primaryBtn: { backgroundColor: C.rose, borderRadius: R.lg, paddingVertical: 16, alignItems: 'center', marginTop: S.sm, ...shadow.glow },
  primaryBtnText: { ...T.h3, color: C.white } as any,

  /* ── Skeleton ── */
  skeletonList: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, paddingHorizontal: S.md, paddingTop: 80, gap: S.sm, zIndex: 1 },
  skeletonCard: {
    flexDirection: 'row', minHeight: 108, borderRadius: R.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden',
  },
  skeletonStrip: { width: 3, backgroundColor: 'rgba(255,255,255,0.10)' },

  /* ── Assign modal ── */
  assignGiftName: { ...T.small, color: C.taupe, marginTop: 2 } as any,
  eventOption: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: R.md,
    borderWidth: 1, borderColor: C.border,
    padding: S.sm, marginBottom: S.xs,
  },
  eventOptionActive: { borderColor: C.rose + '50', backgroundColor: 'rgba(255,107,129,0.08)' },
  eventOptionRadio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: C.t3,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  eventOptionRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.rose },
  eventOptionText: { ...T.body, color: C.t2, flex: 1 } as any,
  assignEmptyText: { ...T.small, color: C.t3, textAlign: 'center', paddingVertical: S.lg, fontStyle: 'italic' } as any,
});
