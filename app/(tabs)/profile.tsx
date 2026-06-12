import AmbientBg from '@/components/ambient-bg';
import SkeletonBlock from '@/components/skeleton-block';
import { C, glass, R, S, shadow, T, TAB_BAR_HEIGHT } from '@/constants/design';
import { auth } from '@/config/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import { setUserProfile, subscribeToUserProfile, UserProfile } from '@/lib/firestore';
import { AVATAR_PRESETS, isPreset, presetColor } from '@/lib/avatarPresets';
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
  Share,
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
  'Soccer', 'Basketball', 'Tennis', 'Padel', 'Running',
  'Swimming', 'Cycling', 'Golf', 'Volleyball', 'Yoga',
  'CrossFit', 'Boxing', 'Skiing', 'Snowboarding', 'Surfing',
  'Climbing', 'Hiking', 'Gym', 'Pilates', 'Martial arts',
  'Rugby', 'Baseball', 'Cricket', 'Badminton', 'Table tennis',
  'Triathlon', 'Rowing', 'Ice skating', 'Horse riding', 'Gymnastics',
  'Formula 1', 'Archery', 'Athletics',
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
    setAllergies((p.allergies ?? []).join(', '));
    setBrands((p.favoriteBrands ?? []).join(', '));
    setGiftTypes(p.preferredGiftTypes ?? []);
    setClothing(p.clothingSize ?? '');
    setShoe(p.shoeSize ?? '');
  }

  const toggle = (arr: string[], set: (v: string[]) => void, item: string) =>
    arr.includes(item) ? set(arr.filter((x) => x !== item)) : set([...arr, item]);

  const [showFullBio, setShowFullBio] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const openEdit = () => { if (profile) populateForm(profile); setShowEdit(true); };

  const handleSignOut = () => {
    if (Platform.OS === 'web') { setConfirmingSignOut(true); return; }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const handleShareLink = async () => {
    if (!profile || !uid) return;
    const name = profile.displayName || 'My';
    const profileUrl = `https://wish-lane.com/profile/${uid}`;
    const title = `${name}'s Wishlist Profile`;
    const message = `See what ${name} wants as a gift — view their full wishlist profile on Wishlane`;
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        try { await (navigator as any).share({ title, text: message, url: profileUrl }); return; } catch { /* fallthrough */ }
      }
      try { await (navigator as any).clipboard.writeText(profileUrl); toast.success('Profile link copied'); }
      catch { toast.error('Could not copy link'); }
      return;
    }
    try { await Share.share({ message: `${message}\n${profileUrl}`, url: profileUrl, title }); }
    catch { toast.error('Could not share'); }
  };

  const buildProfileHtml = (p: UserProfile): string => {
    const initial = (p.displayName || p.email || '?')[0].toUpperCase();
    const avatarInner = p.photoURL && !p.photoURL.startsWith('preset:')
      ? `<img src="${p.photoURL}" alt="">`
      : `<span>${initial}</span>`;
    const tags = (items: string[], cls = '') =>
      `<div class="tags">${items.map(t => `<span class="tag ${cls}">${t}</span>`).join('')}</div>`;
    const sec = (title: string, content: string) =>
      `<div class="section"><div class="sec-title">${title}</div>${content}</div>`;
    const grow = (key: string, val: string, cls = '') =>
      `<div class="grow-row"><span class="grow-key">${key}</span><span class="grow-val ${cls}">${val}</span></div>`;
    let body = '';
    if (p.description) body += sec('ABOUT ME', `<p class="body-text">${p.description}</p>`);
    if (p.favoriteColors?.length)    body += sec('FAVOURITE COLOURS',    tags(p.favoriteColors));
    if (p.favoriteFood?.length)      body += sec('FAVOURITE FOOD',       tags(p.favoriteFood, 'gold'));
    if (p.favoriteDessert?.length)   body += sec('FAVOURITE DESSERT',    tags(p.favoriteDessert, 'teal'));
    if (p.favoriteActivities?.length)body += sec('FAVOURITE ACTIVITIES', tags(p.favoriteActivities));
    if (p.interests?.length)         body += sec('FAVOURITE SPORTS',     tags(p.interests));
    if (p.dislikes?.length)          body += sec('NOT A FAN OF',         tags(p.dislikes, 'red'));
    if (p.whatMakesYouHappy)         body += sec('WHAT MAKES ME HAPPY',  `<p class="body-text">${p.whatMakesYouHappy}</p>`);
    const hasGuide = p.favoriteBrands?.length || p.allergies?.length || p.clothingSize || p.shoeSize || p.preferredGiftTypes?.length;
    if (hasGuide) {
      let g = '';
      if (p.favoriteBrands?.length)     g += grow('Brands', p.favoriteBrands.join(', '));
      if (p.allergies?.length)          g += grow('Allergies / dietary', p.allergies.join(', '), 'warn');
      if (p.clothingSize)               g += grow('Clothing size', p.clothingSize);
      if (p.shoeSize)                   g += grow('Shoe size', p.shoeSize);
      if (p.preferredGiftTypes?.length) g += `<div style="margin-top:12px">${tags(p.preferredGiftTypes, 'gold')}</div>`;
      body += sec('GIFT GUIDE', g);
    }
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${p.displayName || 'Profile'} — Wishlane</title><style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
@page{margin:12mm;background:#07070F}
html,body{background:#07070F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#EDEDED}
.page{padding:24px;max-width:700px;margin:0 auto}
.header{display:flex;align-items:center;gap:16px;margin-bottom:18px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.08)}
.avatar{width:64px;height:64px;border-radius:50%;background:rgba(255,107,129,.15);border:2px solid rgba(255,107,129,.5);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#FF6B81;overflow:hidden;flex-shrink:0}
.avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.name{font-size:22px;font-weight:700;color:#F2E8DA;letter-spacing:-.5px}
.uname{font-size:12px;color:#5AF0D0;margin-top:3px}
.email{font-size:11px;color:rgba(255,255,255,.45);margin-top:2px}
.pill{display:inline-block;margin-top:4px;padding:2px 8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:9999px;font-size:10px;color:rgba(255,255,255,.55)}
.section{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:12px 14px;margin-bottom:8px;page-break-inside:avoid}
.sec-title{font-size:8px;letter-spacing:1.6px;color:rgba(255,255,255,.28);text-transform:uppercase;margin-bottom:8px;font-weight:600}
.body-text{font-size:13px;color:rgba(255,255,255,.93);line-height:1.55}
.tags{display:flex;flex-wrap:wrap;gap:5px}
.tag{padding:3px 10px;border-radius:9999px;border:1px solid rgba(255,107,129,.45);font-size:11px;color:#FF8F9C}
.tag.gold{border-color:rgba(200,169,90,.45);color:#C8A95A}
.tag.teal{border-color:rgba(90,240,208,.4);color:#5AF0D0}
.tag.red{border-color:rgba(255,95,95,.4);color:#FF7070}
.grow-row{display:flex;justify-content:space-between;align-items:flex-start;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06);gap:16px}
.grow-row:last-of-type{border-bottom:none}
.grow-key{font-size:11px;color:rgba(255,255,255,.55);white-space:nowrap}
.grow-val{font-size:11px;color:rgba(255,255,255,.93);text-align:right}
.grow-val.warn{color:#FFAA55}
.footer{text-align:center;margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,.06);font-size:10px;color:rgba(255,255,255,.25);letter-spacing:.5px;page-break-before:avoid}
.footer strong{color:#FF6B81;font-weight:600}
</style></head><body><div class="page">
<div class="header"><div class="avatar">${avatarInner}</div><div>
<div class="name">${p.displayName || ''}</div>
${p.username ? `<div class="uname">@${p.username}</div>` : ''}
${p.email ? `<div class="email">${p.email}</div>` : ''}
${p.gender ? `<span class="pill">${p.gender}</span>` : ''}
</div></div>
${body}
<div class="footer">Shared via <strong>Wishlane</strong> — wish-lane.com</div>
</div></body></html>`;
  };

  const handleSharePDF = async () => {
    if (!profile) return;
    setGeneratingPDF(true);
    try {
      const html = buildProfileHtml(profile);
      if (Platform.OS === 'web') {
        const win = (window as any).open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 400); }
        return;
      }
      const Print = await import('expo-print');
      const Sharing = await import('expo-sharing');
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: '.pdf', dialogTitle: `${profile.displayName || 'Profile'}.pdf` });
    } catch { toast.error('Failed to generate PDF'); }
    finally { setGeneratingPDF(false); }
  };

  const handleDownloadPDF = async () => {
    if (!profile) return;
    setGeneratingPDF(true);
    try {
      const html = buildProfileHtml(profile);
      if (Platform.OS === 'web') {
        const win = (window as any).open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 400); }
        return;
      }
      const Print = await import('expo-print');
      const Sharing = await import('expo-sharing');
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: '.pdf', dialogTitle: 'Save PDF' });
    } catch { toast.error('Failed to download PDF'); }
    finally { setGeneratingPDF(false); }
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
    } catch (e: any) {
      console.error('Profile save error:', e);
      toast.error(e?.message ?? 'Failed to save profile');
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
          {confirmingSignOut ? (
            <View style={styles.signOutConfirm}>
              <Pressable onPress={() => setConfirmingSignOut(false)} style={styles.signOutCancelBtn}>
                <Text style={styles.signOutCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => signOut(auth)} style={styles.signOutConfirmBtn}>
                <Text style={styles.signOutConfirmText}>Yes, sign out</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </Pressable>
          )}
          <Pressable onPress={() => setShowShareModal(true)} style={styles.shareBtn}>
            <Text style={styles.shareBtnText}>↑ Share</Text>
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
          {profile?.photoURL && !isPreset(profile.photoURL) ? (
            <Image source={{ uri: profile.photoURL }} style={styles.heroAvatar} />
          ) : (
            <View style={[
              styles.heroAvatarPlaceholder,
              isPreset(profile?.photoURL) && {
                backgroundColor: presetColor(profile?.photoURL) + '28',
                borderColor: presetColor(profile?.photoURL) + '80',
              },
            ]}>
              <Text style={[styles.heroInitial, isPreset(profile?.photoURL) && { color: presetColor(profile?.photoURL) }]}>
                {(profile?.displayName || profile?.email || '?')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.heroName}>{profile?.displayName || 'Your Name'}</Text>
          {!!profile?.email && <Text style={styles.heroEmail}>{profile.email}</Text>}
          <View style={styles.heroPills}>
            {!!profile?.username && (
              <View style={[styles.heroPill, { borderColor: C.teal + '50', backgroundColor: C.teal + '12' }]}>
                <Text style={[styles.heroPillText, { color: C.teal }]}>@{profile.username}</Text>
              </View>
            )}
            {!!profile?.gender && (
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>{profile.gender}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── about me ── */}
        {!!profile?.description && (() => {
          const LIMIT = 160;
          const isLong = profile.description.length > LIMIT;
          const shown = isLong && !showFullBio
            ? profile.description.slice(0, LIMIT) + '…'
            : profile.description;
          return (
            <SectionCard title="ABOUT ME">
              <Text style={styles.sectionBody}>{shown}</Text>
              {isLong && (
                <Pressable onPress={() => setShowFullBio((v) => !v)} style={{ marginTop: S.xs }}>
                  <Text style={{ ...T.small, color: C.rose }}>{showFullBio ? 'Show less' : 'Read more'}</Text>
                </Pressable>
              )}
            </SectionCard>
          );
        })()}

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

        {/* empty state nudge — shown when no preference sections are filled */}
        {!(profile?.favoriteColors?.length) &&
         !(profile?.favoriteFood?.length) &&
         !(profile?.favoriteDessert?.length) &&
         !(profile?.favoriteActivities?.length) &&
         !(profile?.interests?.length) &&
         !(profile?.dislikes?.length) &&
         !profile?.whatMakesYouHappy &&
         !(profile?.preferredGiftTypes?.length) && (
          <Animated.View entering={FadeIn.duration(600)} style={styles.nudge}>
            <Text style={styles.nudgeTitle}>Your profile is almost done</Text>
            <Text style={styles.nudgeText}>Add your preferences so friends know exactly what to gift you</Text>
            <Pressable style={styles.nudgeBtn} onPress={openEdit}>
              <Text style={styles.nudgeBtnText}>Add preferences</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════
          SHARE MODAL
      ═══════════════════════════════════════════════════════ */}
      <Modal visible={showShareModal} transparent animationType="fade" onRequestClose={() => setShowShareModal(false)}>
        <Pressable style={styles.shareOverlay} onPress={() => setShowShareModal(false)}>
          <Pressable style={[styles.shareSheet, { paddingBottom: insets.bottom + S.lg }]} onPress={(e) => e.stopPropagation() as any}>
            <View style={styles.shareHandle} />
            <Text style={styles.shareTitle}>Share Profile</Text>

            <Pressable style={styles.shareOption} onPress={() => { setShowShareModal(false); handleShareLink(); }}>
              <Text style={styles.shareOptionIcon}>🔗</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.shareOptionLabel}>Share Link</Text>
                <Text style={styles.shareOptionSub}>Copy or send your profile URL</Text>
              </View>
              <Text style={styles.shareOptionChevron}>›</Text>
            </Pressable>

            <Pressable style={styles.shareOption} onPress={() => { setShowShareModal(false); handleSharePDF(); }} disabled={generatingPDF}>
              <Text style={styles.shareOptionIcon}>📄</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.shareOptionLabel}>Share as PDF</Text>
                <Text style={styles.shareOptionSub}>Formatted profile card · send to apps</Text>
              </View>
              {generatingPDF ? <ActivityIndicator size="small" color={C.rose} /> : <Text style={styles.shareOptionChevron}>›</Text>}
            </Pressable>

            <Pressable style={styles.shareOption} onPress={() => { setShowShareModal(false); handleDownloadPDF(); }} disabled={generatingPDF}>
              <Text style={styles.shareOptionIcon}>⬇</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.shareOptionLabel}>Download PDF</Text>
                <Text style={styles.shareOptionSub}>{Platform.OS === 'web' ? 'Opens print dialog — save as PDF' : 'Save to your device'}</Text>
              </View>
              <Text style={styles.shareOptionChevron}>›</Text>
            </Pressable>

            <Pressable style={styles.shareCancelBtn} onPress={() => setShowShareModal(false)}>
              <Text style={styles.shareCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

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
                {/* Avatar preview */}
                <View style={styles.avatarRow}>
                  {photoURL && !isPreset(photoURL) ? (
                    <Image source={{ uri: photoURL }} style={styles.editAvatar} />
                  ) : (
                    <View style={[
                      styles.editAvatarPlaceholder,
                      isPreset(photoURL) && {
                        backgroundColor: presetColor(photoURL) + '28',
                        borderColor: presetColor(photoURL) + '70',
                      },
                    ]}>
                      <Text style={{ color: isPreset(photoURL) ? presetColor(photoURL) : C.t3, fontSize: isPreset(photoURL) ? 22 : 28, fontWeight: '700' }}>
                        {isPreset(photoURL) ? (displayName?.[0]?.toUpperCase() ?? '?') : '+'}
                      </Text>
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
                      } catch (e: any) { toast.error(e?.message ?? 'Failed to upload image'); }
                    }}>
                      <Text style={styles.pickPhotoBtnText}>Upload photo</Text>
                    </Pressable>
                    {!isPreset(photoURL) && (
                      <TextInput
                        value={photoURL}
                        onChangeText={setPhotoURL}
                        placeholder="or paste image URL"
                        placeholderTextColor={C.t3}
                        style={styles.fieldInput}
                        autoCapitalize="none"
                      />
                    )}
                  </View>
                </View>

                {/* Preset avatar grid */}
                <FieldLabel label="Or pick an avatar colour" top />
                <View style={styles.presetGrid}>
                  {AVATAR_PRESETS.map((p) => {
                    const active = photoURL === `preset:${p.key}`;
                    return (
                      <Pressable
                        key={p.key}
                        onPress={() => setPhotoURL(`preset:${p.key}`)}
                        style={[styles.presetBtn, active && { borderColor: p.color, borderWidth: 2 }]}
                      >
                        <View style={[styles.presetCircle, { backgroundColor: p.color + '28' }]}>
                          <Text style={{ color: p.color, fontWeight: '700' as const, fontSize: 15 }}>
                            {displayName?.[0]?.toUpperCase() ?? '?'}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <View style={[styles.fieldInput, { justifyContent: 'center', opacity: 0.6 }]}>
                    <Text style={{ color: C.t2, fontSize: 14 }}>{profile?.email ?? auth.currentUser?.email ?? ''}</Text>
                  </View>
                </View>

                <DarkInput label="Your name *" value={displayName} onChangeText={setDisplayName}
                  placeholder="e.g. Jane Smith" autoCapitalize="words" />
                <DarkInput label="Short bio (optional)" value={description} onChangeText={setDescription}
                  multiline placeholder="Tell your friends about yourself…" />
                <DarkInput label="Username / @handle (optional)" value={username}
                  onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. jane_doe" autoCapitalize="none" />

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
                <FieldLabel label="Preferred gift types" />
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
  signOutConfirm: { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  signOutCancelBtn: { paddingHorizontal: S.sm, paddingVertical: 8, borderRadius: R.full, borderWidth: 1, borderColor: C.border },
  signOutCancelText: { ...T.small, color: C.t2, fontWeight: '600' as const } as any,
  signOutConfirmBtn: { paddingHorizontal: S.sm, paddingVertical: 8, borderRadius: R.full, backgroundColor: 'rgba(239,68,68,0.20)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.50)' },
  signOutConfirmText: { ...T.small, color: C.error, fontWeight: '700' as const } as any,
  shareBtn: {
    paddingHorizontal: S.md, paddingVertical: 8,
    borderRadius: R.full, borderWidth: 1, borderColor: C.teal + '60',
    backgroundColor: C.teal + '18',
  },
  shareBtnText: { ...T.small, color: C.teal, fontWeight: '600' as const },
  editBtn: {
    paddingHorizontal: S.md, paddingVertical: 8,
    borderRadius: R.full, borderWidth: 1, borderColor: C.rose + '60',
    backgroundColor: C.rose + '18',
  },
  editBtnText: { ...T.small, color: C.rose, fontWeight: '600' as const },

  scroll: { paddingHorizontal: S.md },

  hero: { alignItems: 'center', paddingTop: S.sm, paddingBottom: S.xl, gap: S.xs },
  heroAvatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: C.rose + '60', ...shadow.md },
  heroAvatarPlaceholder: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: C.borderMed,
    backgroundColor: C.surface3, alignItems: 'center', justifyContent: 'center', ...shadow.md,
  },
  heroInitial: { ...T.h1, color: C.rose },
  heroName: { ...T.h1, color: C.cream, marginTop: S.sm },
  heroEmail: { ...T.small, color: C.t3, marginTop: 2 },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: S.xs, marginTop: S.sm, justifyContent: 'center' as const },
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

  nudge: { alignItems: 'center', paddingVertical: S.xl, paddingHorizontal: S.xl, gap: S.sm },
  nudgeTitle: { ...T.h3, color: C.t1, textAlign: 'center' },
  nudgeText: { ...T.body, color: C.t3, textAlign: 'center', marginBottom: S.sm },
  nudgeBtn: { backgroundColor: C.rose, borderRadius: R.lg, paddingHorizontal: S.xl, paddingVertical: 14, ...shadow.glow },
  nudgeBtnText: { ...T.h3, color: C.white },

  shareOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  shareSheet: {
    backgroundColor: C.surface, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl,
    borderTopWidth: 1, borderColor: C.borderMed,
    paddingTop: S.sm, paddingHorizontal: S.md,
  },
  shareHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.borderMed, alignSelf: 'center', marginBottom: S.md,
  },
  shareTitle: { ...T.h3, color: C.cream, textAlign: 'center', marginBottom: S.md },
  shareOption: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingVertical: S.md, paddingHorizontal: S.sm,
    borderRadius: R.lg, marginBottom: S.xs,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border,
  },
  shareOptionIcon: { fontSize: 24, width: 36, textAlign: 'center' },
  shareOptionLabel: { ...T.body, color: C.t1, fontWeight: '600' as const },
  shareOptionSub: { ...T.micro, color: C.t3, marginTop: 2 },
  shareOptionChevron: { ...T.h2, color: C.t3 },
  shareCancelBtn: {
    marginTop: S.sm, paddingVertical: 14, borderRadius: R.full,
    backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  shareCancelText: { ...T.body, color: C.t2, fontWeight: '600' as const },

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
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.xs },
  presetBtn: {
    borderRadius: R.full, borderWidth: 1.5, borderColor: 'transparent', padding: 2,
  },
  presetCircle: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
});
