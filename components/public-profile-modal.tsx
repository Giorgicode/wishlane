import { C, R, S, T, glassStrong, shadow } from '@/constants/design';
import { getPublicProfile } from '@/lib/firestore';
import { isPreset, presetColor } from '@/lib/avatarPresets';
import type { UserProfile } from '@/types/firebase';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

interface Props {
  visible: boolean;
  ownerUid: string | null;
  onClose: () => void;
}

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
    <View style={s.sectionCard}>
      <View style={s.sectionHead}>
        <View style={[s.sectionDot, { backgroundColor: accent }]} />
        <Text style={[s.sectionTitle, { color: accent }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function PublicProfileModal({ visible, ownerUid, onClose }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !ownerUid) return;
    setLoading(true);
    setProfile(null);
    getPublicProfile(ownerUid)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [visible, ownerUid]);

  const photoURL = profile?.photoURL;
  const avatarColor = presetColor(photoURL);
  const initial = (profile?.displayName || '?')[0].toUpperCase();
  const useCircle = isPreset(photoURL) || !photoURL;

  const hasGiftPrefs = !!(
    profile?.priceRange ||
    profile?.clothingSize ||
    profile?.shoeSize ||
    profile?.preferredGiftTypes?.length ||
    profile?.favoriteBrands?.length ||
    profile?.preferredStores?.length
  );
  const hasTastes = !!(
    profile?.favoriteColors?.length ||
    profile?.favoriteFood?.length ||
    profile?.favoriteDessert?.length
  );
  const hasLifestyle = !!(
    profile?.whatMakesYouHappy ||
    profile?.interests?.length ||
    profile?.favoriteActivities?.length ||
    profile?.relax?.length
  );
  const hasGoodToKnow = !!(profile?.allergies?.length || profile?.dislikes?.length);
  const hasAnyContent = !!(profile?.description || hasGiftPrefs || hasTastes || hasLifestyle || hasGoodToKnow);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.bg}>
        <View style={s.sheet}>
          <View style={s.dragHandle} />

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
              <Animated.View entering={FadeIn.duration(400)} style={s.hero}>
                {useCircle ? (
                  <View style={[s.avatar, { backgroundColor: avatarColor + '22', borderColor: avatarColor + '70', borderWidth: 2.5 }]}>
                    <Text style={[s.avatarInitial, { color: avatarColor }]}>{initial}</Text>
                  </View>
                ) : (
                  <Image source={{ uri: photoURL! }} style={s.avatar} />
                )}
                <Text style={s.name}>{profile.displayName || 'Unknown'}</Text>
                {!!profile.username && <Text style={s.usernameText}>@{profile.username}</Text>}
                {!!profile.gender && <Text style={s.gender}>{profile.gender}</Text>}
              </Animated.View>

              {/* Bio */}
              {!!profile.description && (
                <Animated.View entering={FadeInUp.duration(350).delay(80)} style={s.bioCard}>
                  <Text style={s.bioText}>{profile.description}</Text>
                </Animated.View>
              )}

              {/* Gift preferences */}
              {hasGiftPrefs && (
                <Animated.View entering={FadeInUp.duration(350).delay(120)}>
                  <SectionCard title="GIFT PREFERENCES" accent={C.rose}>
                    {!!profile.priceRange && (
                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Budget</Text>
                        <Text style={s.infoValue}>{profile.priceRange}</Text>
                      </View>
                    )}
                    {!!profile.clothingSize && (
                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Clothing size</Text>
                        <Text style={s.infoValue}>{profile.clothingSize}</Text>
                      </View>
                    )}
                    {!!profile.shoeSize && (
                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Shoe size</Text>
                        <Text style={s.infoValue}>{profile.shoeSize}</Text>
                      </View>
                    )}
                    <ChipRow label="Gift types" items={profile.preferredGiftTypes} color={C.rose} />
                    <ChipRow label="Favourite brands" items={profile.favoriteBrands} color={C.rose} />
                    <ChipRow label="Preferred stores" items={profile.preferredStores} color={C.rose} />
                  </SectionCard>
                </Animated.View>
              )}

              {/* Tastes */}
              {hasTastes && (
                <Animated.View entering={FadeInUp.duration(350).delay(160)}>
                  <SectionCard title="TASTES" accent={C.teal}>
                    <ChipRow label="Favourite colours" items={profile.favoriteColors} color={C.teal} />
                    <ChipRow label="Favourite food" items={profile.favoriteFood} color={C.teal} />
                    <ChipRow label="Favourite dessert" items={profile.favoriteDessert} color={C.teal} />
                  </SectionCard>
                </Animated.View>
              )}

              {/* Lifestyle */}
              {hasLifestyle && (
                <Animated.View entering={FadeInUp.duration(350).delay(200)}>
                  <SectionCard title="LIFESTYLE" accent={C.goldLux}>
                    {!!profile.whatMakesYouHappy && (
                      <View style={s.happyBox}>
                        <Text style={s.happyLabel}>What makes them happy</Text>
                        <Text style={s.happyText}>{profile.whatMakesYouHappy}</Text>
                      </View>
                    )}
                    <ChipRow label="Interests" items={profile.interests} color={C.goldLux} />
                    <ChipRow label="Activities" items={profile.favoriteActivities} color={C.goldLux} />
                    <ChipRow label="Relaxes with" items={profile.relax} color={C.goldLux} />
                  </SectionCard>
                </Animated.View>
              )}

              {/* Good to know */}
              {hasGoodToKnow && (
                <Animated.View entering={FadeInUp.duration(350).delay(240)}>
                  <SectionCard title="GOOD TO KNOW" accent={C.t3}>
                    <ChipRow label="Allergies" items={profile.allergies} color={C.error} />
                    <ChipRow label="Dislikes" items={profile.dislikes} color={C.t3} />
                  </SectionCard>
                </Animated.View>
              )}

              {!hasAnyContent && (
                <View style={[s.center, { paddingVertical: S.xl }]}>
                  <Text style={s.emptyText}>No profile info yet</Text>
                </View>
              )}

              <View style={{ height: 32 }} />
            </ScrollView>
          )}

          <Pressable style={s.closeRow} onPress={onClose}>
            <Text style={s.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' },
  sheet: {
    ...glassStrong,
    borderTopLeftRadius: R.xxl,
    borderTopRightRadius: R.xxl,
    maxHeight: '92%',
    borderBottomWidth: 0,
    ...shadow.lg,
  } as any,
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginTop: S.sm, marginBottom: S.xs },
  scroll: { paddingHorizontal: S.md, paddingTop: S.sm },

  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { ...T.body, color: C.t3 } as any,

  hero: { alignItems: 'center', paddingVertical: S.lg, gap: S.xs },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: S.sm, overflow: 'hidden',
  },
  avatarInitial: { fontSize: 36, fontWeight: '700' as const },
  name: { fontSize: 24, fontWeight: '800' as const, color: C.cream, letterSpacing: -0.5 },
  usernameText: { ...T.small, color: C.t3, marginTop: 2 } as any,
  gender: { ...T.micro, color: C.taupe, textTransform: 'capitalize' as const } as any,

  bioCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: S.md,
    marginBottom: S.sm,
  },
  bioText: { ...T.body, color: C.t2, lineHeight: 22 } as any,

  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: S.md,
    marginBottom: S.sm,
    gap: S.xs,
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

  closeRow: { paddingVertical: S.md, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
  closeText: { ...T.body, color: C.t3 } as any,
});
