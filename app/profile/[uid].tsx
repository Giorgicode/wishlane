import { C, R, S, T, shadow } from '@/constants/design';
import { getPublicProfile } from '@/lib/firestore';
import { isPreset, presetColor } from '@/lib/avatarPresets';
import type { UserProfile } from '@/types/firebase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

function ChipRow({ label, items, color = C.rose }: { label: string; items?: string[]; color?: string }) {
  if (!items?.length) return null;
  return (
    <View style={s.chipSection}>
      <Text style={s.chipLabel}>{label}</Text>
      <View style={s.chipWrap}>
        {items.map((item, i) => (
          <View key={i} style={[s.chip, { borderColor: color + '50', backgroundColor: color + '14' }]}>
            <Text style={[s.chipText, { color }]}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SectionCard({ title, accent = C.rose, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeInUp.duration(350)} style={s.sectionCard}>
      <View style={s.sectionHead}>
        <View style={[s.sectionDot, { backgroundColor: accent }]} />
        <Text style={[s.sectionTitle, { color: accent }]}>{title}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

export default function PublicProfileScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    getPublicProfile(uid)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [uid]);

  const photoURL = profile?.photoURL;
  const avatarColor = presetColor(photoURL);
  const initial = (profile?.displayName || '?')[0].toUpperCase();
  const useCircle = isPreset(photoURL) || !photoURL;

  const hasGiftPrefs = !!(
    profile?.priceRange || profile?.clothingSize || profile?.shoeSize ||
    profile?.preferredGiftTypes?.length || profile?.favoriteBrands?.length || profile?.preferredStores?.length
  );
  const hasTastes = !!(profile?.favoriteColors?.length || profile?.favoriteFood?.length || profile?.favoriteDessert?.length);
  const hasLifestyle = !!(profile?.whatMakesYouHappy || profile?.interests?.length || profile?.favoriteActivities?.length || profile?.relax?.length);
  const hasGoodToKnow = !!(profile?.allergies?.length || profile?.dislikes?.length);

  return (
    <View style={s.root}>
      {/* Ambient blobs */}
      <View style={s.blobRose} />
      <View style={s.blobTeal} />

      {/* Back button */}
      <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
        <Text style={s.backText}>←</Text>
      </Pressable>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.rose} size="large" />
        </View>
      ) : !profile ? (
        <View style={s.center}>
          <Text style={s.emptyText}>Profile not found</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          {/* Hero */}
          <Animated.View entering={FadeIn.duration(500)} style={s.hero}>
            {useCircle ? (
              <View style={[s.avatar, { backgroundColor: avatarColor + '22', borderColor: avatarColor + '70', borderWidth: 2.5 }]}>
                <Text style={[s.avatarInitial, { color: avatarColor }]}>{initial}</Text>
              </View>
            ) : (
              <Image source={{ uri: photoURL! }} style={s.avatar} />
            )}
            <Text style={s.name}>{profile.displayName}</Text>
            {!!profile.username && <Text style={s.handle}>@{profile.username}</Text>}
            <View style={s.pillRow}>
              {!!profile.gender && (
                <View style={s.pill}>
                  <Text style={s.pillText}>{profile.gender}</Text>
                </View>
              )}
              <View style={[s.pill, { borderColor: C.rose + '50', backgroundColor: C.rose + '12' }]}>
                <Text style={[s.pillText, { color: C.rose }]}>Wishlane</Text>
              </View>
            </View>
          </Animated.View>

          {/* Bio */}
          {!!profile.description && (
            <Animated.View entering={FadeInUp.duration(350).delay(80)} style={s.bioCard}>
              <Text style={s.bioText}>{profile.description}</Text>
            </Animated.View>
          )}

          {/* Gift preferences */}
          {hasGiftPrefs && (
            <SectionCard title="GIFT PREFERENCES" accent={C.rose}>
              {!!profile.priceRange && <View style={s.infoRow}><Text style={s.infoLabel}>Budget</Text><Text style={s.infoValue}>{profile.priceRange}</Text></View>}
              {!!profile.clothingSize && <View style={s.infoRow}><Text style={s.infoLabel}>Clothing size</Text><Text style={s.infoValue}>{profile.clothingSize}</Text></View>}
              {!!profile.shoeSize && <View style={s.infoRow}><Text style={s.infoLabel}>Shoe size</Text><Text style={s.infoValue}>{profile.shoeSize}</Text></View>}
              <ChipRow label="Gift types" items={profile.preferredGiftTypes} color={C.rose} />
              <ChipRow label="Favourite brands" items={profile.favoriteBrands} color={C.rose} />
              <ChipRow label="Preferred stores" items={profile.preferredStores} color={C.rose} />
            </SectionCard>
          )}

          {/* Tastes */}
          {hasTastes && (
            <SectionCard title="TASTES" accent={C.teal}>
              <ChipRow label="Favourite colours" items={profile.favoriteColors} color={C.teal} />
              <ChipRow label="Favourite food" items={profile.favoriteFood} color={C.teal} />
              <ChipRow label="Favourite dessert" items={profile.favoriteDessert} color={C.teal} />
            </SectionCard>
          )}

          {/* Lifestyle */}
          {hasLifestyle && (
            <SectionCard title="LIFESTYLE" accent={C.goldLux}>
              {!!profile.whatMakesYouHappy && (
                <View style={s.happyBox}>
                  <Text style={s.happyLabel}>What makes them happy</Text>
                  <Text style={s.happyText}>{profile.whatMakesYouHappy}</Text>
                </View>
              )}
              <ChipRow label="Sports & interests" items={profile.interests} color={C.goldLux} />
              <ChipRow label="Activities" items={profile.favoriteActivities} color={C.goldLux} />
              <ChipRow label="Relaxes with" items={profile.relax} color={C.goldLux} />
            </SectionCard>
          )}

          {/* Good to know */}
          {hasGoodToKnow && (
            <SectionCard title="GOOD TO KNOW" accent={C.t3}>
              <ChipRow label="Allergies" items={profile.allergies} color={C.error} />
              <ChipRow label="Dislikes" items={profile.dislikes} color={C.t3} />
            </SectionCard>
          )}

          {/* CTA */}
          <Animated.View entering={FadeInUp.duration(350).delay(300)} style={s.cta}>
            <Text style={s.ctaLabel}>POWERED BY</Text>
            <Text style={s.ctaBrand}>Wishlane</Text>
            <Text style={s.ctaSub}>wish-lane.com</Text>
          </Animated.View>

          <View style={{ height: 48 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' } as any,
  blobRose: {
    position: 'absolute', width: 340, height: 340, borderRadius: 170,
    backgroundColor: 'rgba(255,107,129,0.10)', top: -100, right: -80,
    filter: 'blur(90px)',
  } as any,
  blobTeal: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(90,240,208,0.07)', bottom: 100, left: -60,
    filter: 'blur(80px)',
  } as any,

  backBtn: {
    position: 'absolute', top: 52, left: S.md, zIndex: 10,
    width: 40, height: 40, justifyContent: 'center',
  },
  backText: { ...T.h2, color: C.t1 } as any,

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...T.body, color: C.t3 } as any,

  scroll: { paddingHorizontal: S.md, paddingTop: 100 },

  hero: { alignItems: 'center', paddingBottom: S.lg, gap: S.xs },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: S.sm, ...shadow.md,
  } as any,
  avatarInitial: { fontSize: 40, fontWeight: '700' as const },
  name: { fontSize: 28, fontWeight: '800' as const, color: C.cream, letterSpacing: -0.6 },
  handle: { ...T.body, color: C.t3, marginTop: 2 } as any,
  pillRow: { flexDirection: 'row', gap: S.xs, marginTop: S.sm },
  pill: { paddingHorizontal: S.sm, paddingVertical: 4, borderRadius: R.full, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.05)' },
  pillText: { ...T.micro, color: C.t2, textTransform: 'capitalize' as const } as any,

  bioCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: R.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: S.md, marginBottom: S.sm,
  },
  bioText: { ...T.body, color: C.t2, lineHeight: 22 } as any,

  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: R.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    padding: S.md, marginBottom: S.sm, gap: S.xs,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: S.xs },
  sectionDot: { width: 5, height: 5, borderRadius: 3 },
  sectionTitle: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 2 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  infoLabel: { ...T.small, color: C.t3 } as any,
  infoValue: { ...T.small, color: C.t1, fontWeight: '600' as const } as any,

  chipSection: { marginTop: S.xs },
  chipLabel: { ...T.micro, color: C.t3, marginBottom: S.xs } as any,
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs },
  chip: { borderRadius: R.full, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 11, fontWeight: '600' as const },

  happyBox: { backgroundColor: 'rgba(200,169,90,0.08)', borderRadius: R.md, padding: S.sm, borderWidth: 1, borderColor: 'rgba(200,169,90,0.20)', marginBottom: S.xs },
  happyLabel: { ...T.micro, color: C.goldLux, marginBottom: 4 } as any,
  happyText: { ...T.small, color: C.t2, fontStyle: 'italic' as const } as any,

  cta: { alignItems: 'center', paddingVertical: S.xl, gap: 4 },
  ctaLabel: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 2, color: C.t3 },
  ctaBrand: { fontSize: 22, fontWeight: '800' as const, color: C.cream, letterSpacing: -0.4 },
  ctaSub: { ...T.small, color: C.t3 } as any,
});
