import AmbientBg from '@/components/ambient-bg';
import SkeletonBlock from '@/components/skeleton-block';
import { C, glass, R, S, shadow, T, TAB_BAR_HEIGHT } from '@/constants/design';
import { auth } from '@/config/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import { setUserProfile, subscribeToUserProfile, UserProfile } from '@/lib/firestore';
import { uploadImageAsync } from '@/lib/storage';
import { toast } from '@/lib/toast';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── preference options ───────────────────────────────────────
const COLOR_OPTIONS = [
  'Red', 'Rose', 'Pink', 'Orange', 'Yellow', 'Gold',
  'Green', 'Teal', 'Blue', 'Purple', 'Lavender',
  'Black', 'White', 'Silver', 'Brown', 'Beige',
];

const FOOD_OPTIONS = [
  'Italian', 'Japanese', 'Mexican', 'Thai', 'Indian',
  'French', 'Mediterranean', 'Chinese', 'American', 'Turkish',
  'Greek', 'Spanish', 'Vietnamese', 'Korean', 'Lebanese',
  'Sushi', 'Pizza', 'Pasta', 'Ramen', 'Tacos', 'Burgers', 'Salads',
];

const DESSERT_OPTIONS = [
  'Ice cream', 'Chocolate', 'Cake', 'Cookies', 'Cheesecake',
  'Macarons', 'Tiramisu', 'Donuts', 'Brownies', 'Crepes',
  'Gelato', 'Fruit tart', 'Mousse', 'Churros', 'Waffles',
];

const ACTIVITY_OPTIONS = [
  'Hiking', 'Cooking', 'Painting', 'Photography', 'Dancing',
  'Yoga', 'Meditation', 'Gardening', 'DIY crafts', 'Board games',
  'Karaoke', 'Wine tasting', 'Museum visits', 'Cinema', 'Theater',
  'Concerts', 'Beach', 'Camping', 'Road trips', 'Shopping',
];

const SPORT_OPTIONS = [
  'Soccer', 'Basketball', 'Tennis', 'Running', 'Hiking',
  'Swimming', 'Cycling', 'Golf', 'Volleyball', 'Yoga',
  'CrossFit', 'Boxing', 'Skiing', 'Surfing', 'Climbing',
];

const DISLIKE_OPTIONS = [
  'Crowds', 'Loud music', 'Spicy food', 'Alcohol', 'Sweets',
  'Outdoor activities', 'Tech gadgets', 'Sports', 'Surprises',
  'Fast food', 'Seafood', 'Early mornings',
];

const GIFT_TYPES = ['Experience', 'Physical', 'Consumable', 'Subscription', 'Handmade', 'Charity'];

// ─── small reusables ─────────────────────────────────────────
function Chip({ label, active, accent = C.rose, onPress }: {
  label: string; active: boolean; accent?: string; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && { backgroundColor: accent + '22', borderColor: accent + '80' }]}>
      <Text style={[styles.chipText, active && { color: accent }]}>{label}</Text>
    </Pressable>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.sectionCard}>
      <Text style={styles.sectionEyebrow}>{title}</Text>
      {children}
    </Animated.View>
  );
}

function FormSection({ label }: { label: string }) {
  return <Text style={styles.formSection}>{label}</Text>;
}

function FieldLabel({ label, top }: { label: string; top?: boolean }) {
  return <Text style={[styles.fieldLabel, top && { marginTop: S.sm }]}>{label}</Text>;
}

function ChipGroup({ options, selected, onToggle, accent = C.rose }: {
  options: string[]; selected: string[]; onToggle: (v: string) => void; accent?: string;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((o) => (
        <Chip key={o} label={o} active={selected.includes(o)} accent={accent} onPress={() => onToggle(o)} />
      ))}
    </View>
  );
}

function DarkInput({ label, value, onChangeText, multiline, placeholder, autoCapitalize }: {
  label: string; value: string; onChangeText: (t: string) => void;
  multiline?: boolean; placeholder?: string; autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={C.t3}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        style={[styles.fieldInput, multiline && { height: 80, paddingTop: 12 }]}
      />
    </View>
  );
}

// ─── main screen ─────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { uid, authReady } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  // form state
  const [username, setUsername]           = useState('');
  const [displayName, setDisplayName]     = useState('');
  const [photoURL, setPhotoURL]           = useState('');
  const [description, setDescription]     = useState('');
  const [gender, setGender]               = useState<UserProfile['gender']>('');
  const [favColors, setFavColors]         = useState<string[]>([]);
  const [favFood, setFavFood]             = useState<string[]>([]);
  const [favDessert, setFavDessert]       = useState<string[]>([]);
  const [favActivities, setFavActivities] = useState<string[]>([]);
  const [favSports, setFavSports]         = useState<string[]>([]);
  const [dislikes, setDislikes]           = useState<string[]>([]);
  const [whatMakesYouHappy, setHappy]     = useState('');
  const [priceRange, setPriceRange]       = useState('');
  const [allergiesInput, setAllergies]    = useState('');
  const [brandsInput, setBrands]          = useState('');
  const [preferredGiftTypes, setGiftTypes]= useState<string[]>([]);
  const [clothingSize, setClothing]       = useState('');
  const [shoeSize, setShoe]               = useState('');

  useEffect(() => {
    if (!authReady) return;
    if (!uid) { setLoading(false); return; }
    let firstFire = true;
    return subscribeToUserProfile(uid, (p: UserProfile | null) => {
      setProfile(p ?? null);
      if (firstFire) {
        firstFire = false;
        setLoading(false);
        if (!p || !p.onboardingComplete) { populateForm(p ?? {} as UserProfile); setShowEdit(true); return; }
        populateForm(p);
      }
    });
  }, [uid, authReady]);

  function populateForm(p: UserProfile) {
    setUsername(p.username ?? '');
    setDisplayName(p.displayName ?? '');
    setPhotoURL(p.photoURL ?? '');
    setDescription(p.description ?? '');
    setGender(p.gender ?? '');
    setFavColors(p.favoriteColors ?? []);
    setFavFood(p.favoriteFood ?? []);
    setFavDessert(p.favoriteDessert ?? []);
    setFavActivities(p.favoriteActivities ?? []);
    setFavSports(p.interests?.filter((i) => SPORT_OPTIONS.includes(i)) ?? []);
    setDislikes(p.dislikes ?? []);
    setHappy(p.whatMakesYouHappy ?? '');
    setPriceRange(p.priceRange ?? '');
    setAllergies((p.allergies ?? []).join(', '));
    setBrands((p.favoriteBrands ?? []).join(', '));
    setGiftTypes(p.preferredGiftTypes ?? []);
    setClothing(p.clothingSize ?? '');
    setShoe(p.shoeSize ?? '');
  }

  const toggle = (arr: string[], set: (v: string[]) => void, item: string) =>
    arr.includes(item) ? set(arr.filter((x) => x !== item)) : set([...arr, item]);

  const openEdit = () => { if (profile) populateForm(profile); setShowEdit(true); };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const save = async () => {
    if (!uid) return;
    if (!displayName.trim()) { toast.error('Please enter your name'); return; }
    const isFirstSave = !profile?.onboardingComplete;
    setSaving(true);
    try {
      const payload: Partial<UserProfile> = {
        onboardingComplete: true,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, ''),
        displayName: displayName.trim(),
        photoURL,
        description,
        gender,
        favoriteColors: favColors,
        favoriteFood: favFood,
        favoriteDessert: favDessert,
        favoriteActivities: favActivities,
        interests: favSports,
        dislikes,
        whatMakesYouHappy,
        priceRange,
        allergies: allergiesInput ? allergiesInput.split(',').map((s) => s.trim()).filter(Boolean) : [],
        favoriteBrands: brandsInput ? brandsInput.split(',').map((s) => s.trim()).filter(Boolean) : [],
        preferredGiftTypes,
        clothingSize,
        shoeSize,
      };
      await setUserProfile(uid, payload);
      setProfile((prev) => ({ ...prev, ...payload, uid } as UserProfile));
      toast.success(isFirstSave ? 'Welcome to Wishlane!' : 'Profile saved', isFirstSave ? '🎉' : 'Updated');
      setShowEdit(false);
      if (isFirstSave) router.replace('/(tabs)');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // ── loading ──
  if (loading) {
    return (
      <View style={styles.root}>
        <AmbientBg preset="rose" />
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <SkeletonBlock width={36} height={36} radius={18} />
          <View style={{ flex: 1 }} />
          <SkeletonBlock width={80} height={32} radius={R.full} />
          <SkeletonBlock width={36} height={36} radius={18} />
        </View>
        <View style={{ alignItems: 'center', paddingTop: S.xl, gap: S.md }}>
          <SkeletonBlock width={90} height={90} radius={45} />
          <SkeletonBlock width={140} height={22} />
          <SkeletonBlock width={100} height={14} />
        </View>
        <View style={{ paddingHorizontal: S.md, marginTop: S.xl, gap: S.sm }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: R.lg, borderWidth: 1, borderColor: C.border, padding: S.md, gap: S.sm }}>
              <SkeletonBlock width="30%" height={10} />
              <SkeletonBlock width="80%" height={14} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AmbientBg preset="rose" />

      {/* ── header bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.topBarRight}>
          <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
            <Text style={styles.signOutBtnText}>Sign Out</Text>
          </Pressable>
          <Pressable onPress={openEdit} style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_HEIGHT + S.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── hero ── */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
          {profile?.photoURL ? (
            <Image source={{ uri: profile.photoURL }} style={styles.heroAvatar} />
          ) : (
            <View style={styles.heroAvatarPlaceholder}>
              <Text style={styles.heroInitial}>
                {(profile?.displayName || profile?.email || '?')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.heroName}>{profile?.displayName || profile?.email || 'Your Name'}</Text>
          {!!profile?.username && <Text style={styles.heroUsername}>@{profile.username}</Text>}
          {!!profile?.description && <Text style={styles.heroDesc}>{profile.description}</Text>}
          <View style={styles.heroPills}>
            {!!profile?.gender && (
              <View style={styles.heroPill}><Text style={styles.heroPillText}>{profile.gender}</Text></View>
            )}
            {!!profile?.priceRange && (
              <View style={[styles.heroPill, { borderColor: C.goldLux + '60' }]}>
                <Text style={[styles.heroPillText, { color: C.goldLux }]}>{profile.priceRange}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── preference sections ── */}
        {(profile?.favoriteColors ?? []).length > 0 && (
          <SectionCard title="FAVOURITE COLOURS">
            <View style={styles.tagCloud}>
              {(profile!.favoriteColors!).map((t) => (
                <View key={t} style={[styles.tag, { borderColor: C.rose + '50' }]}>
                  <Text style={[styles.tagText, { color: C.roseSoft }]}>{t}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {(profile?.favoriteFood ?? []).length > 0 && (
          <SectionCard title="FAVOURITE FOOD">
            <View style={styles.tagCloud}>
              {(profile!.favoriteFood!).map((t) => (
                <View key={t} style={[styles.tag, { borderColor: C.goldLux + '50' }]}>
                  <Text style={[styles.tagText, { color: C.goldLux }]}>{t}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {(profile?.favoriteDessert ?? []).length > 0 && (
          <SectionCard title="FAVOURITE DESSERT">
            <View style={styles.tagCloud}>
              {(profile!.favoriteDessert!).map((t) => (
                <View key={t} style={[styles.tag, { borderColor: C.teal + '50' }]}>
                  <Text style={[styles.tagText, { color: C.teal }]}>{t}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {(profile?.favoriteActivities ?? []).length > 0 && (
          <SectionCard title="FAVOURITE ACTIVITIES">
            <View style={styles.tagCloud}>
              {(profile!.favoriteActivities!).map((t) => (
                <View key={t} style={[styles.tag, { borderColor: C.rose + '50' }]}>
                  <Text style={[styles.tagText, { color: C.roseSoft }]}>{t}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {(profile?.interests ?? []).length > 0 && (
          <SectionCard title="FAVOURITE SPORTS">
            <View style={styles.tagCloud}>
              {(profile!.interests!).map((t) => (
                <View key={t} style={[styles.tag, { borderColor: C.rose + '50' }]}>
                  <Text style={[styles.tagText, { color: C.roseSoft }]}>{t}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {(profile?.dislikes ?? []).length > 0 && (
          <SectionCard title="NOT A FAN OF">
            <View style={styles.tagCloud}>
              {(profile!.dislikes!).map((t) => (
                <View key={t} style={[styles.tag, { borderColor: C.error + '40' }]}>
                  <Text style={[styles.tagText, { color: C.error }]}>{t}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {!!profile?.whatMakesYouHappy && (
          <SectionCard title="WHAT MAKES ME HAPPY">
            <Text style={styles.sectionBody}>{profile.whatMakesYouHappy}</Text>
          </SectionCard>
        )}

        {/* gift guide */}
        {(profile?.preferredGiftTypes?.length || profile?.favoriteBrands?.length || profile?.allergies?.length || profile?.clothingSize || profile?.shoeSize) ? (
          <SectionCard title="GIFT GUIDE">
            {(profile?.favoriteBrands ?? []).length > 0 && (
              <View style={styles.guideRow}>
                <Text style={styles.guideKey}>Brands</Text>
                <Text style={styles.guideVal}>{profile!.favoriteBrands!.join(', ')}</Text>
              </View>
            )}
            {(profile?.allergies ?? []).length > 0 && (
              <View style={styles.guideRow}>
                <Text style={styles.guideKey}>Allergies / dietary</Text>
                <Text style={[styles.guideVal, { color: C.warning }]}>{profile!.allergies!.join(', ')}</Text>
              </View>
            )}
            {!!profile?.clothingSize && (
              <View style={styles.guideRow}>
                <Text style={styles.guideKey}>Clothing size</Text>
                <Text style={styles.guideVal}>{profile.clothingSize}</Text>
              </View>
            )}
            {!!profile?.shoeSize && (
              <View style={styles.guideRow}>
                <Text style={styles.guideKey}>Shoe size</Text>
                <Text style={styles.guideVal}>{profile.shoeSize}</Text>
              </View>
            )}
            {(profile?.preferredGiftTypes ?? []).length > 0 && (
              <View style={[styles.tagCloud, { marginTop: S.sm }]}>
                {profile!.preferredGiftTypes!.map((t) => (
                  <View key={t} style={[styles.tag, { borderColor: C.goldLux + '60' }]}>
                    <Text style={[styles.tagText, { color: C.goldLux }]}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </SectionCard>
        ) : null}

        {/* empty state nudge */}
        {!profile?.displayName && (
          <Animated.View entering={FadeIn.duration(600)} style={styles.nudge}>
            <Text style={styles.nudgeText}>Fill in your profile so friends know what to gift you</Text>
            <Pressable style={styles.nudgeBtn} onPress={openEdit}>
              <Text style={styles.nudgeBtnText}>Set up profile</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════
          EDIT MODAL
      ═══════════════════════════════════════════════════════ */}
      <Modal visible={showEdit} animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <View style={styles.modalRoot}>
          <AmbientBg preset="rose" />

          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={() => setShowEdit(false)} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </Pressable>
            <Text style={styles.modalTitle}>{profile?.onboardingComplete ? 'Edit Profile' : 'Set up your profile'}</Text>
            <Pressable onPress={save} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
              {saving
                ? <ActivityIndicator color={C.white} size="small" />
                : <Text style={styles.saveBtnText}>Save</Text>
              }
            </Pressable>
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── Identity ── */}
              <FormSection label="IDENTITY" />
              <View style={styles.formCard}>
                <Text style={styles.fieldLabel}>Profile picture</Text>
                <View style={styles.avatarRow}>
                  {photoURL ? (
                    <Image source={{ uri: photoURL }} style={styles.editAvatar} />
                  ) : (
                    <View style={styles.editAvatarPlaceholder}>
                      <Text style={{ color: C.t3, fontSize: 22 }}>+</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, gap: S.xs }}>
                    <Pressable style={styles.pickPhotoBtn} onPress={async () => {
                      try {
                        const IP = await import('expo-image-picker');
                        const perm = await IP.requestMediaLibraryPermissionsAsync();
                        if (!perm.granted) return;
                        const res = await IP.launchImageLibraryAsync({ mediaTypes: IP.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
                        if ((res as any).canceled === true || (res as any).cancelled === true) return;
                        const uri = (res as any).uri ?? (res as any).assets?.[0]?.uri;
                        const url = await uploadImageAsync(uri, `users/${uid}/profile-${Date.now()}.jpg`);
                        setPhotoURL(url);
                      } catch { toast.error('Failed to upload image'); }
                    }}>
                      <Text style={styles.pickPhotoBtnText}>Pick from library</Text>
                    </Pressable>
                    <TextInput
                      value={photoURL}
                      onChangeText={setPhotoURL}
                      placeholder="or paste image URL"
                      placeholderTextColor={C.t3}
                      style={styles.fieldInput}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <DarkInput label="Name *" value={displayName} onChangeText={setDisplayName}
                  placeholder="Your full name or nickname" autoCapitalize="words" />
                <DarkInput label="Username (@handle)" value={username}
                  onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. jane_doe" autoCapitalize="none" />
                <DarkInput label="Short bio" value={description} onChangeText={setDescription}
                  multiline placeholder="Tell your friends about yourself…" />

                <FieldLabel label="Gender" top />
                <View style={styles.chipRow}>
                  {(['female', 'male', 'other'] as UserProfile['gender'][]).map((g) => (
                    <Chip key={g!} label={g!} active={gender === g} onPress={() => setGender(g)} />
                  ))}
                </View>
              </View>

              {/* ── Preferences ── */}
              <FormSection label="PREFERENCES" />
              <View style={styles.formCard}>
                <FieldLabel label="Favourite colours" />
                <ChipGroup options={COLOR_OPTIONS} selected={favColors}
                  onToggle={(v) => toggle(favColors, setFavColors, v)} />

                <FieldLabel label="Favourite food" top />
                <ChipGroup options={FOOD_OPTIONS} selected={favFood}
                  onToggle={(v) => toggle(favFood, setFavFood, v)} accent={C.goldLux} />

                <FieldLabel label="Favourite dessert" top />
                <ChipGroup options={DESSERT_OPTIONS} selected={favDessert}
                  onToggle={(v) => toggle(favDessert, setFavDessert, v)} accent={C.teal} />

                <FieldLabel label="Favourite activities" top />
                <ChipGroup options={ACTIVITY_OPTIONS} selected={favActivities}
                  onToggle={(v) => toggle(favActivities, setFavActivities, v)} />

                <FieldLabel label="Favourite sports" top />
                <ChipGroup options={SPORT_OPTIONS} selected={favSports}
                  onToggle={(v) => toggle(favSports, setFavSports, v)} />

                <FieldLabel label="What I do NOT like" top />
                <ChipGroup options={DISLIKE_OPTIONS} selected={dislikes}
                  onToggle={(v) => toggle(dislikes, setDislikes, v)} accent={C.error} />

                <DarkInput label="What makes you happy?" value={whatMakesYouHappy}
                  onChangeText={setHappy} multiline placeholder="Anything goes…" />
              </View>

              {/* ── Gift Guide ── */}
              <FormSection label="GIFT GUIDE" />
              <View style={styles.formCard}>
                <FieldLabel label="Price range" />
                <View style={styles.chipRow}>
                  {['Under $25', '$25–$50', '$50–$100', '$100+'].map((p) => (
                    <Chip key={p} label={p} active={priceRange === p} accent={C.goldLux} onPress={() => setPriceRange(p)} />
                  ))}
                </View>

                <FieldLabel label="Preferred gift types" top />
                <ChipGroup options={GIFT_TYPES} selected={preferredGiftTypes}
                  onToggle={(v) => toggle(preferredGiftTypes, setGiftTypes, v)} accent={C.goldLux} />

                <DarkInput label="Allergies / dietary restrictions" value={allergiesInput}
                  onChangeText={setAllergies} placeholder="peanuts, gluten, lactose…" />
                <DarkInput label="Favourite brands" value={brandsInput}
                  onChangeText={setBrands} placeholder="Nike, Apple, Zara…" />
                <DarkInput label="Clothing size" value={clothingSize}
                  onChangeText={setClothing} placeholder="S, M, L, XL, 10…" />
                <DarkInput label="Shoe size" value={shoeSize}
                  onChangeText={setShoe} placeholder="42, UK 9, US 10…" />
              </View>

              <View style={{ height: S.xxl }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' } as any,

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.md, paddingBottom: S.sm,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { ...T.h2, color: C.t1 },
  topBarRight: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: S.xs },
  signOutBtn: {
    paddingHorizontal: S.sm, paddingVertical: 8,
    borderRadius: R.full,
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.30)',
  },
  signOutBtnText: { ...T.small, color: C.error, fontWeight: '600' as const } as any,
  editBtn: {
    paddingHorizontal: S.md, paddingVertical: 8,
    borderRadius: R.full, borderWidth: 1, borderColor: C.borderMed,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  editBtnText: { ...T.small, color: C.t1, fontWeight: '600' as const },

  scroll: { paddingHorizontal: S.md },

  hero: { alignItems: 'center', paddingTop: S.sm, paddingBottom: S.xl, gap: S.xs },
  heroAvatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: C.rose + '60', ...shadow.md },
  heroAvatarPlaceholder: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: C.borderMed,
    backgroundColor: C.surface3, alignItems: 'center', justifyContent: 'center', ...shadow.md,
  },
  heroInitial: { ...T.h1, color: C.rose },
  heroName: { ...T.h1, color: C.cream, marginTop: S.sm },
  heroUsername: { ...T.body, color: C.teal, fontWeight: '600' as const },
  heroDesc: { ...T.body, color: C.t2, textAlign: 'center', maxWidth: 280, marginTop: S.xs },
  heroPills: { flexDirection: 'row', gap: S.xs, marginTop: S.xs },
  heroPill: {
    paddingHorizontal: S.sm, paddingVertical: 4,
    borderRadius: R.full, borderWidth: 1, borderColor: C.borderMed,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroPillText: { ...T.micro, color: C.t2, textTransform: 'capitalize' as const },

  sectionCard: { ...glass, borderRadius: R.xl, padding: S.md, marginBottom: S.sm, ...shadow.sm } as any,
  sectionEyebrow: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 2, color: C.taupe, marginBottom: S.sm },
  sectionBody: { ...T.body, color: C.t1 },

  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs },
  tag: {
    paddingHorizontal: S.sm, paddingVertical: 5,
    borderRadius: R.full, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tagText: { ...T.small },

  guideRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  guideKey: { ...T.small, color: C.t3 },
  guideVal: { ...T.small, color: C.t1, flex: 1, textAlign: 'right' as const, flexShrink: 1, marginLeft: S.sm },

  nudge: { alignItems: 'center', paddingVertical: S.xl, gap: S.md },
  nudgeText: { ...T.body, color: C.t3, textAlign: 'center' },
  nudgeBtn: { backgroundColor: C.rose, borderRadius: R.lg, paddingHorizontal: S.xl, paddingVertical: 14, ...shadow.glow },
  nudgeBtnText: { ...T.h3, color: C.white },

  modalRoot: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' } as any,
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: S.md, paddingBottom: S.sm,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitle: { ...T.h3, color: C.cream },
  saveBtn: {
    backgroundColor: C.rose, borderRadius: R.full,
    paddingHorizontal: S.md, paddingVertical: 8, minWidth: 60, alignItems: 'center',
    ...shadow.glow,
  },
  saveBtnText: { ...T.small, color: C.white, fontWeight: '700' as const },

  modalScroll: { paddingHorizontal: S.md, paddingTop: S.md },
  formSection: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 2, color: C.taupe, marginBottom: S.sm, marginTop: S.md },
  formCard: { ...glass, borderRadius: R.xl, padding: S.md, marginBottom: S.sm, ...shadow.sm } as any,

  fieldWrap: { marginTop: S.sm },
  fieldLabel: { ...T.micro, color: C.t3, marginBottom: S.xs },
  fieldInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: R.md,
    borderWidth: 1, borderColor: C.border,
    color: C.t1, paddingHorizontal: S.sm, paddingVertical: 10,
    ...T.body,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs, marginTop: S.xs },
  chip: {
    paddingHorizontal: S.sm, paddingVertical: 6, borderRadius: R.full,
    borderWidth: 1, borderColor: C.border, backgroundColor: 'transparent',
  },
  chipText: { ...T.small, color: C.t3 },

  avatarRow: { flexDirection: 'row', gap: S.sm, alignItems: 'flex-start', marginBottom: S.xs },
  editAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderColor: C.borderMed },
  editAvatarPlaceholder: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.surface3, alignItems: 'center', justifyContent: 'center',
  },
  pickPhotoBtn: {
    paddingHorizontal: S.sm, paddingVertical: 8, borderRadius: R.md,
    borderWidth: 1, borderColor: C.borderMed, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  pickPhotoBtnText: { ...T.small, color: C.t1 },
});
