import AmbientBg from '@/components/ambient-bg';
import SkeletonBlock from '@/components/skeleton-block';
import { C, glass, glassStrong, R, S, shadow, T, TAB_BAR_HEIGHT } from '@/constants/design';
import { useAuth } from '@/hooks/useAuth';
import {
  acceptFriendRequest, rejectFriendRequest, removeFriend,
  searchUsers, sendFriendRequest, updateFriendNotes,
  subscribeToEventConnections, subscribeToFriends,
  subscribeToOutgoingRequests, subscribeToPendingRequests,
} from '@/lib/firestore';
import type { EventConnection, UserSearchResult } from '@/lib/firestore';
import PublicProfileModal from '@/components/public-profile-modal';
import { toast } from '@/lib/toast';
import type { Friend, FriendRequest } from '@/types/firebase';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert, FlatList, Image, KeyboardAvoidingView, Linking,
  Modal, Platform, Pressable, ScrollView, Share,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

function Avatar({ name, email, photoURL, size = 44, accent = C.rose }: { name?: string; email?: string; photoURL?: string | null; size?: number; accent?: string }) {
  const initial = (name || email || '?')[0].toUpperCase();
  if (photoURL) return <Image source={{ uri: photoURL }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: accent + '50' } as any} />;
  return (
    <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2, borderColor: accent + '50' }]}>
      <Text style={[styles.avatarInitial, { fontSize: size * 0.38, color: accent }]}>{initial}</Text>
    </View>
  );
}

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsReady, setFriendsReady] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [friendSearch, setFriendSearch] = useState('');
  const [eventConnections, setEventConnections] = useState<EventConnection[]>([]);
  const [profileUid, setProfileUid] = useState<string | null>(null);
  const [notesFriend, setNotesFriend] = useState<Friend | null>(null);
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const { uid, user } = useAuth();

  const filteredFriends = useMemo(() => {
    const q = friendSearch.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) =>
        (f.friendName ?? '').toLowerCase().includes(q) ||
        f.friendEmail.toLowerCase().includes(q),
    );
  }, [friends, friendSearch]);

  useEffect(() => {
    if (!uid) return;
    let ready = false;
    return subscribeToFriends(uid, (f) => {
      setFriends(f);
      if (!ready) { ready = true; setFriendsReady(true); }
    });
  }, [uid]);
  useEffect(() => { if (!uid) return; return subscribeToPendingRequests(uid, setPendingRequests); }, [uid]);
  useEffect(() => { if (!uid) return; return subscribeToOutgoingRequests(uid, setOutgoingRequests); }, [uid]);
  useEffect(() => { if (!uid) return; return subscribeToEventConnections(uid, setEventConnections); }, [uid]);

  const handleSearchUsers = async () => {
    if (!friendEmail.trim()) { setSearchResults([]); setShowResults(false); return; }
    setIsSearching(true);
    try {
      const results = await searchUsers(friendEmail);
      setSearchResults(results.filter((u) => u.uid !== uid));
      setShowResults(true);
    } catch { toast.error('Failed to search users'); }
    finally { setIsSearching(false); }
  };

  const handleAddFriend = async (selectedUser: any) => {
    if (!uid || !user) return;
    setIsSending(true);
    try {
      await sendFriendRequest(uid, selectedUser.uid, selectedUser.email, selectedUser.displayName, selectedUser.email, selectedUser.displayName);
      toast.success(`Friend request sent to ${selectedUser.displayName || selectedUser.email}`, 'Sent');
      setAddModalVisible(false);
      setFriendEmail(''); setSearchResults([]); setShowResults(false);
    } catch (err: any) { toast.error(err.message || 'Failed to send request'); }
    finally { setIsSending(false); }
  };

  const handleInvite = async () => {
    const email = friendEmail.trim();
    const senderName = user?.displayName || user?.email || 'A friend';
    const subject = `${senderName} invited you to Wishlane`;
    const body = `Hey!\n\n${senderName} wants to connect with you on Wishlane — a gift wishlist app where friends share what they actually want.\n\nSign up for free at https://wish-lane.com\n\nSee you there!`;

    if (Platform.OS === 'web') {
      const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      Linking.openURL(mailto);
      return;
    }
    try {
      await Share.share({
        message: `${body}`,
        title: subject,
      });
    } catch { toast.error('Could not open share'); }
  };

  const openNotes = (friend: Friend) => {
    setNotesFriend(friend);
    setNotesText(friend.notes ?? '');
  };

  const handleSaveNotes = async () => {
    if (!uid || !notesFriend) return;
    setSavingNotes(true);
    try {
      await updateFriendNotes(uid, notesFriend.id, notesText);
      toast.success('Notes saved');
      setNotesFriend(null);
    } catch { toast.error('Failed to save notes'); }
    finally { setSavingNotes(false); }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    setProcessingId(request.id);
    try {
      await acceptFriendRequest(request.id);
      toast.success(`You're now friends with ${request.fromUserName || request.fromUserEmail}`, 'Friends!');
    } catch (err: any) { toast.error(err.message || 'Failed to accept'); }
    finally { setProcessingId(null); }
  };

  const handleRejectRequest = async (request: FriendRequest) => {
    setProcessingId(request.id);
    try { await rejectFriendRequest(request.id); }
    catch (err: any) { toast.error(err.message || 'Failed to reject'); }
    finally { setProcessingId(null); }
  };

  const handleRemoveFriend = (friend: Friend) => {
    Alert.alert('Remove Friend', `Remove ${friend.friendName || friend.friendEmail}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        if (!uid) return;
        setRemovingId(friend.id);
        try { await removeFriend(uid, friend.friendId); }
        catch { toast.error('Failed to remove friend'); }
        finally { setRemovingId(null); }
      }},
    ]);
  };

  const requestBadge = pendingRequests.length + outgoingRequests.length;

  return (
    <View style={styles.root}>
      <AmbientBg preset="teal" />

      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>CONNECTIONS</Text>
          <View style={styles.eyebrowRule} />
          <Text style={styles.screenTitle}>{friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </Animated.View>

      {!friendsReady && (
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonBlock width={44} height={44} radius={22} />
              <View style={{ flex: 1, gap: 7 }}>
                <SkeletonBlock width="55%" height={14} />
                <SkeletonBlock width="70%" height={10} />
              </View>
              <SkeletonBlock width={28} height={28} radius={R.full} />
            </View>
          ))}
        </View>
      )}

      {/* Event Connections strip */}
      {eventConnections.length > 0 && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.connectionsSection}>
          <Text style={styles.connectionsEyebrow}>EVENT CONNECTIONS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.connectionsRow}>
            {eventConnections.map(conn => {
              const initial = (conn.name || conn.email || '?')[0].toUpperCase();
              const hue = conn.uid.charCodeAt(0) % 2 === 0 ? C.rose : C.teal;
              return (
                <Pressable key={conn.uid} style={styles.connCircleWrap} onPress={() => setProfileUid(conn.uid)}>
                  <View style={[styles.connCircle, { borderColor: hue + '60', backgroundColor: hue + '18' }]}>
                    <Text style={[styles.connInitial, { color: hue }]}>{initial}</Text>
                  </View>
                  <Text style={styles.connName} numberOfLines={1}>
                    {conn.name?.split('@')[0] || '?'}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['friends', 'requests'] as const).map((tab) => (
          <Pressable key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'friends' ? `Friends (${friends.length})` : `Requests${requestBadge > 0 ? ` (${requestBadge})` : ''}`}
            </Text>
            {tab === 'requests' && requestBadge > 0 && (
              <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{requestBadge}</Text></View>
            )}
          </Pressable>
        ))}
      </View>

      {activeTab === 'friends' ? (
        friends.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No friends yet</Text>
            <Text style={styles.emptySub}>Add friends to share events easily</Text>
          </View>
        ) : (
          <>
            <View style={styles.friendSearchBar}>
              <Text style={styles.friendSearchIcon}>⌕</Text>
              <TextInput
                style={styles.friendSearchInput}
                placeholder="Search friends…"
                placeholderTextColor={C.t3}
                value={friendSearch}
                onChangeText={setFriendSearch}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {!!friendSearch && (
                <Pressable onPress={() => setFriendSearch('')} hitSlop={8}>
                  <Text style={styles.friendSearchClear}>✕</Text>
                </Pressable>
              )}
            </View>
          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>No friends match "{friendSearch}"</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Animated.View entering={FadeInUp.duration(350)} style={styles.friendCard}>
                <Avatar name={item.friendName} email={item.friendEmail} photoURL={item.friendPhotoURL} accent={C.teal} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.friendName}>{item.friendName || item.friendEmail}</Text>
                  {!!item.friendUsername && <Text style={[styles.friendEmail, { color: C.teal }]}>@{item.friendUsername}</Text>}
                  <Text style={styles.friendEmail}>{item.friendEmail}</Text>
                  {!!item.notes && (
                    <Text style={styles.notesPreview} numberOfLines={1}>"{item.notes}"</Text>
                  )}
                </View>
                <View style={styles.friendActions}>
                  <Pressable
                    style={[styles.notesBtn, !!item.notes && styles.notesBtnActive]}
                    onPress={() => openNotes(item)}
                    hitSlop={8}
                  >
                    <Text style={[styles.notesBtnText, !!item.notes && { color: C.goldLux }]}>
                      {item.notes ? '✎' : '+'}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => handleRemoveFriend(item)} disabled={removingId === item.id} hitSlop={8}>
                    <Text style={styles.removeBtn}>{removingId === item.id ? '…' : '✕'}</Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}
          />
          </>
        )
      ) : (
        (pendingRequests.length === 0 && outgoingRequests.length === 0) ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No pending requests</Text>
            <Text style={styles.emptySub}>Friend requests will appear here</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {pendingRequests.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>RECEIVED</Text>
                {pendingRequests.map((item) => (
                  <Animated.View key={item.id} entering={FadeInUp.duration(350)} style={[styles.requestCard, { borderLeftColor: C.teal + '60', borderLeftWidth: 3 }]}>
                    <Avatar name={item.fromUserName} email={item.fromUserEmail} accent={C.teal} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.requestName}>{item.fromUserName || item.fromUserEmail}</Text>
                      <Text style={styles.requestEmail}>{item.fromUserEmail}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: S.xs }}>
                      <Pressable style={[styles.actionBtn, { backgroundColor: C.teal + '20', borderColor: C.teal + '50', borderWidth: 1 }]} onPress={() => handleAcceptRequest(item)} disabled={processingId === item.id}>
                        <Text style={[styles.actionBtnText, { color: C.teal }]}>{processingId === item.id ? '…' : '✓'}</Text>
                      </Pressable>
                      <Pressable style={[styles.actionBtn, { backgroundColor: C.error + '15', borderColor: C.error + '40', borderWidth: 1 }]} onPress={() => handleRejectRequest(item)} disabled={processingId === item.id}>
                        <Text style={[styles.actionBtnText, { color: C.error }]}>✕</Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                ))}
              </>
            )}
            {outgoingRequests.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: S.md }]}>SENT</Text>
                {outgoingRequests.map((item) => (
                  <Animated.View key={item.id} entering={FadeInUp.duration(350)} style={[styles.requestCard, { opacity: 0.75 }]}>
                    <View style={[styles.avatarPlaceholder, { width: 44, height: 44, borderRadius: 22, borderColor: C.t3 + '40' }]}>
                      <Text style={[styles.avatarInitial, { color: C.t3 }]}>?</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.requestName}>{item.toUserName || item.toUserEmail || item.toUserId}</Text>
                      {!!(item.toUserEmail && item.toUserName) && <Text style={styles.requestEmail}>{item.toUserEmail}</Text>}
                      <Text style={styles.pendingBadge}>Pending…</Text>
                    </View>
                    <Pressable style={[styles.actionBtn, { backgroundColor: C.error + '15', borderColor: C.error + '40', borderWidth: 1 }]} onPress={() => handleRejectRequest(item)} disabled={processingId === item.id}>
                      <Text style={[styles.actionBtnText, { color: C.error }]}>{processingId === item.id ? '…' : '✕'}</Text>
                    </Pressable>
                  </Animated.View>
                ))}
              </>
            )}
          </ScrollView>
        )
      )}

      <PublicProfileModal visible={!!profileUid} ownerUid={profileUid} onClose={() => setProfileUid(null)} />

      {/* Notes Modal */}
      <Modal visible={!!notesFriend} transparent animationType="slide" onRequestClose={() => setNotesFriend(null)}>
        <KeyboardAvoidingView style={styles.modalBg} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              Notes about {notesFriend?.friendName || notesFriend?.friendEmail}
            </Text>
            <Text style={styles.notesHint}>Private — only you can see this</Text>
            <TextInput
              style={styles.notesInput}
              placeholder={`Things you've learned, gift ideas, inside jokes…`}
              placeholderTextColor={C.t3}
              value={notesText}
              onChangeText={setNotesText}
              multiline
              autoFocus
              textAlignVertical="top"
            />
            <Pressable
              style={[styles.notesSaveBtn, savingNotes && { opacity: 0.6 }]}
              onPress={handleSaveNotes}
              disabled={savingNotes}
            >
              <Text style={styles.notesSaveBtnText}>{savingNotes ? 'Saving…' : 'Save Notes'}</Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={() => setNotesFriend(null)}>
              <Text style={styles.ghostBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Friend Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalBg} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Find a Friend</Text>
            <View style={styles.searchRow}>
              <TextInput style={styles.searchInput} placeholder="@username or email…" placeholderTextColor={C.t3} value={friendEmail} onChangeText={setFriendEmail} autoCapitalize="none" editable={!isSearching && !isSending} returnKeyType="search" onSubmitEditing={handleSearchUsers} />
              <Pressable onPress={handleSearchUsers} disabled={isSearching} style={styles.searchBtn}>
                <Text style={styles.searchBtnText}>{isSearching ? '…' : 'Go'}</Text>
              </Pressable>
            </View>
            {showResults ? (
              <>
                {searchResults.length === 0 ? (
                  <Animated.View entering={FadeIn.duration(300)} style={styles.notFoundBox}>
                    <Text style={styles.notFoundTitle}>Not on Wishlane yet</Text>
                    <Text style={styles.notFoundSub}>
                      {friendEmail.includes('@')
                        ? `Invite ${friendEmail.trim()} to join`
                        : 'No users found for that search'}
                    </Text>
                    {friendEmail.includes('@') && (
                      <Pressable style={styles.inviteBtn} onPress={handleInvite}>
                        <Text style={styles.inviteBtnText}>Send Invite to {friendEmail.trim()}</Text>
                      </Pressable>
                    )}
                  </Animated.View>
                ) : (
                  <>
                    <Text style={styles.resultLabel}>{searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found</Text>
                    <ScrollView style={{ maxHeight: 250, marginBottom: S.sm }}>
                      {searchResults.map((result) => (
                        <Pressable key={result.uid} style={styles.resultCard} onPress={() => handleAddFriend(result)} disabled={isSending}>
                          <Avatar name={result.displayName} email={result.email} photoURL={result.photoURL} size={40} accent={C.teal} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resultName}>{result.displayName || result.username || 'No name'}</Text>
                            {!!result.username && <Text style={[styles.resultEmail, { color: C.teal }]}>@{result.username}</Text>}
                            <Text style={styles.resultEmail}>{result.email}</Text>
                          </View>
                          <Text style={[styles.addIcon, { color: C.teal }]}>+</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </>
                )}
                <Pressable onPress={() => { setShowResults(false); setFriendEmail(''); }} style={styles.ghostBtn}>
                  <Text style={styles.ghostBtnText}>New Search</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.helpText}>Search by @username or email address</Text>
            )}
            <Pressable style={styles.ghostBtn} onPress={() => { setAddModalVisible(false); setFriendEmail(''); setSearchResults([]); setShowResults(false); }}>
              <Text style={styles.ghostBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' } as any,

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: S.md, paddingTop: 80, marginBottom: S.sm },
  eyebrow: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 2.4, color: C.taupe, marginBottom: 8 },
  eyebrowRule: { height: 1, width: 40, backgroundColor: C.teal, marginBottom: 12, opacity: 0.6, borderRadius: 1 },
  screenTitle: { fontSize: 40, fontWeight: '800' as const, letterSpacing: -1.2, color: C.cream, lineHeight: 42 },
  addBtn: { backgroundColor: C.teal + '20', paddingHorizontal: S.md, paddingVertical: 10, borderRadius: R.full, borderWidth: 1, borderColor: C.teal + '60' },
  addBtnText: { ...T.small, color: C.teal, fontWeight: '700' as const },

  connectionsSection: { paddingHorizontal: S.md, marginBottom: S.sm },
  connectionsEyebrow: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 2.2, color: C.taupe, marginBottom: S.sm },
  connectionsRow: { gap: S.sm, paddingRight: S.sm },
  connCircleWrap: { alignItems: 'center', width: 60 },
  connCircle: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 5,
  },
  connInitial: { fontSize: 20, fontWeight: '700' as const },
  connName: { fontSize: 10, color: C.t2, textAlign: 'center' as const, width: 58 },

  tabs: { flexDirection: 'row', marginHorizontal: S.md, marginBottom: S.sm, borderRadius: R.md, ...glass, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: R.sm, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabActive: { backgroundColor: 'rgba(90,240,208,0.12)', borderWidth: 1, borderColor: C.teal + '40' },
  tabText: { ...T.small, color: C.t3 },
  tabTextActive: { color: C.teal, fontWeight: '700' as const },
  tabBadge: { backgroundColor: C.rose, borderRadius: R.full, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  tabBadgeText: { color: C.white, fontSize: 10, fontWeight: 'bold' as const },

  skeletonList: { position: 'absolute' as const, top: 210, left: S.md, right: S.md, gap: S.xs, zIndex: 1 },
  skeletonCard: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: S.sm,
    borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: S.sm,
  },

  friendSearchBar: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: R.md, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: S.sm, marginHorizontal: S.md, marginBottom: S.xs, height: 40,
  },
  friendSearchIcon: { fontSize: 17, color: C.t3, marginRight: 6 },
  friendSearchInput: { flex: 1, ...T.body, color: C.t1, paddingVertical: 0 } as any,
  friendSearchClear: { fontSize: 12, color: C.t3, paddingHorizontal: 4 },
  emptySearch: { alignItems: 'center' as const, paddingVertical: S.xxl },
  emptySearchText: { ...T.small, color: C.t3 } as any,

  listContent: { paddingHorizontal: S.md, paddingBottom: TAB_BAR_HEIGHT + S.lg },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.sm, paddingBottom: 100 },
  emptyIcon: { fontSize: 52 },
  emptyText: { fontSize: 20, fontWeight: '700' as const, color: C.cream },
  emptySub: { ...T.small, color: C.taupe },

  avatarPlaceholder: { backgroundColor: 'rgba(90,240,208,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  avatarInitial: { fontWeight: '700' as const },

  friendCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: R.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    padding: S.sm, marginBottom: S.xs, gap: S.sm, ...shadow.sm,
  } as any,
  friendName: { ...T.h3, color: C.cream },
  friendEmail: { ...T.small, color: C.taupe, marginTop: 2 },
  notesPreview: { ...T.micro, color: C.goldLux, marginTop: 4, fontStyle: 'italic' as const } as any,
  friendActions: { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  notesBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(200,169,90,0.10)', borderWidth: 1, borderColor: 'rgba(200,169,90,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  notesBtnActive: { backgroundColor: 'rgba(200,169,90,0.20)', borderColor: C.goldLux + '60' },
  notesBtnText: { fontSize: 14, color: C.t3 },
  removeBtn: { ...T.body, color: C.error, paddingHorizontal: S.sm },

  notesHint: { ...T.micro, color: C.t3, marginBottom: S.md } as any,
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: R.lg,
    borderWidth: 1, borderColor: C.border,
    color: C.t1, paddingHorizontal: S.md, paddingVertical: S.sm,
    fontSize: 14, minHeight: 120, marginBottom: S.md,
  },
  notesSaveBtn: {
    backgroundColor: C.goldLux + '20', borderRadius: R.full,
    borderWidth: 1, borderColor: C.goldLux + '60',
    paddingVertical: 12, alignItems: 'center', marginBottom: S.xs,
  },
  notesSaveBtnText: { ...T.body, color: C.goldLux, fontWeight: '700' as const } as any,

  sectionLabel: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 2, color: C.taupe, marginBottom: S.sm },
  requestCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: R.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    padding: S.sm, marginBottom: S.xs, gap: S.sm, ...shadow.sm,
  } as any,
  requestName: { ...T.h3, color: C.cream },
  requestEmail: { ...T.small, color: C.taupe, marginTop: 2 },
  pendingBadge: { ...T.micro, color: C.warning, marginTop: 2 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { ...T.body, fontWeight: '700' as const },

  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' },
  modalSheet: { ...glassStrong, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, padding: S.lg, paddingBottom: S.xxl, borderBottomWidth: 0, ...shadow.lg },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: S.md },
  sheetTitle: { ...T.h2, color: C.cream, marginBottom: S.md },

  searchRow: { flexDirection: 'row', gap: S.xs, marginBottom: S.md },
  searchInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: R.md, borderWidth: 1, borderColor: C.border, color: C.t1, paddingHorizontal: S.md, paddingVertical: 12, ...T.body },
  searchBtn: { width: 48, height: 48, backgroundColor: C.teal + '20', borderRadius: R.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.teal + '50' },
  searchBtnText: { fontSize: 20 },

  resultLabel: { ...T.small, color: C.taupe, marginBottom: S.sm },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: R.md,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.border,
    padding: S.sm, marginBottom: S.xs, gap: S.sm,
  },
  resultName: { ...T.h3, color: C.cream },
  resultEmail: { ...T.small, color: C.taupe, marginTop: 2 },
  addIcon: { ...T.h2 },

  ghostBtn: { paddingVertical: 12, alignItems: 'center' },
  ghostBtnText: { ...T.body, color: C.taupe },
  helpText: { ...T.small, color: C.t3, textAlign: 'center', marginBottom: S.xl, fontStyle: 'italic' },

  notFoundBox: {
    alignItems: 'center', paddingVertical: S.lg, paddingHorizontal: S.md,
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: R.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: S.sm, gap: S.xs,
  },
  notFoundTitle: { ...T.body, color: C.t1, fontWeight: '700' as const },
  notFoundSub: { ...T.small, color: C.t3, textAlign: 'center' as const },
  inviteBtn: {
    marginTop: S.sm, paddingVertical: 12, paddingHorizontal: S.lg,
    backgroundColor: C.teal + '18', borderRadius: R.full,
    borderWidth: 1, borderColor: C.teal + '50',
  },
  inviteBtnText: { ...T.body, color: C.teal, fontWeight: '700' as const },
});
