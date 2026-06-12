import { db } from '@/config/firebaseConfig';
import type { EventAnalytic, EventItem, EventShare, Friend, FriendRequest, Gift, Notification, UserProfile } from '@/types/firebase';
export type { UserProfile };
import {
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';

// Create a gift under users/{uid}/gifts
export async function createGift(uid: string, payload: {
  name: string;
  description?: string;
  imageUrl?: string;
  price?: string;
  type?: 'online' | 'brand' | 'location';
  category?: string;
  link?: string;
  brand?: string;
  country?: string;
  city?: string;
  place?: string;
}) {
  const col = collection(db, 'users', uid, 'gifts');
  const ref = doc(col);
  const data: Gift = {
    id: ref.id,
    ownerId: uid,
    name: payload.name,
    description: payload.description ?? '',
    imageUrl: payload.imageUrl ?? '',
    price: payload.price ?? '',
    type: payload.type ?? 'online',
    category: payload.category ?? '',
    link: payload.link ?? '',
    brand: payload.brand ?? '',
    country: payload.country ?? '',
    city: payload.city ?? '',
    place: payload.place ?? '',
    createdAt: serverTimestamp() as any,
    eventId: null,
  };
  await setDoc(ref, data);
  return data;
}

export async function createEvent(uid: string, payload: { name: string; description?: string; expirationDate?: Date | null; imageUrl?: string }) {
  const col = collection(db, 'users', uid, 'events');
  const ref = doc(col);
  const shareCode = generateShareCode();
  const data: EventItem = {
    id: ref.id,
    ownerId: uid,
    name: payload.name,
    description: payload.description ?? '',
    imageUrl: payload.imageUrl ?? '',
    expirationDate: payload.expirationDate ? payload.expirationDate : null,
    createdAt: serverTimestamp() as any,
    shareCode,
    sharedWith: [],
  };
  await setDoc(ref, data);
  
  // Index the share code for quick lookup (includes denormalized event fields)
  await indexShareCode(uid, ref.id, shareCode, payload.name, payload.description ?? '', payload.expirationDate ?? null);
  
  return data;
}

export async function assignGiftToEvent(uid: string, giftId: string, eventId: string | null) {
  const giftRef = doc(db, 'users', uid, 'gifts', giftId);
  await updateDoc(giftRef, { eventId: eventId ?? null });
}

export function subscribeToGifts(uid: string, onUpdate: (gifts: Gift[]) => void) {
  const q = query(collection(db, 'users', uid, 'gifts'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => d.data() as Gift);
    onUpdate(items);
  }, (err) => console.error('[subscribeToGifts]', err));
}

export function subscribeToEvents(uid: string, onUpdate: (events: EventItem[]) => void) {
  const q = query(collection(db, 'users', uid, 'events'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => d.data() as EventItem);
    onUpdate(items);
  }, (err) => console.error('[subscribeToEvents]', err));
}

export async function updateGift(uid: string, giftId: string, patch: Partial<Gift>) {
  const ref = doc(db, 'users', uid, 'gifts', giftId);
  await updateDoc(ref as any, patch as any);
}

export async function deleteGift(uid: string, giftId: string) {
  const ref = doc(db, 'users', uid, 'gifts', giftId);
  await deleteDoc(ref);
}

export async function deleteEvent(uid: string, eventId: string) {
  const ref = doc(db, 'users', uid, 'events', eventId);
  await deleteDoc(ref);
}

export async function updateEvent(uid: string, eventId: string, patch: { name?: string; description?: string; expirationDate?: Date | null }) {
  const ref = doc(db, 'users', uid, 'events', eventId);
  await updateDoc(ref as any, patch as any);

  // Build the denormalized update for share code index + eventShares docs
  const denormUpdate: Record<string, any> = {};
  if (patch.name !== undefined)           denormUpdate.eventName           = patch.name;
  if (patch.description !== undefined)    denormUpdate.eventDescription    = patch.description;
  if (patch.expirationDate !== undefined) denormUpdate.eventExpirationDate = patch.expirationDate;

  if (Object.keys(denormUpdate).length === 0) return;

  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const event = snap.data() as EventItem;

  const batch = writeBatch(db);

  // Sync share code index
  if (event.shareCode) {
    batch.update(doc(db, 'eventShareCodes', event.shareCode), denormUpdate);
  }

  // Sync all eventShares so recipients see fresh name/description/date
  const sharesSnap = await getDocs(query(
    collection(db, 'eventShares'),
    where('eventId', '==', eventId),
    where('eventOwnerId', '==', uid),
  ));
  sharesSnap.forEach((d) => batch.update(d.ref, denormUpdate));

  await batch.commit();
}

export async function getPublicProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// --- User profile helpers ---

function toUsername(email: string): string {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '');
}

export async function createUserProfile(uid: string, data: {
  email: string;
  displayName?: string;
  photoURL?: string;
  username?: string;
}) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const username = data.username ?? (snap.exists() ? undefined : toUsername(data.email));
  await setDoc(ref, {
    uid,
    email: data.email.toLowerCase(),
    displayName: data.displayName ?? '',
    photoURL: data.photoURL ?? '',
    ...(username !== undefined ? { username } : {}),
    ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function setUserProfile(uid: string, profile: Partial<UserProfile>) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, {
    ...profile,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// --- Event Sharing Functions ---

/**
 * Share an event with a user by email (converts email to UID)
 */
export async function shareEventWithUserByEmail(
  eventOwnerId: string,
  eventId: string,
  sharedWithEmail: string,
  sharedByName?: string
) {
  const user = await getUserByEmail(sharedWithEmail);
  if (!user) {
    throw new Error(`User with email ${sharedWithEmail} not found`);
  }

  // Fetch event + owner profile in parallel for denormalization
  const eventRef = doc(db, 'users', eventOwnerId, 'events', eventId);
  const [eventSnap, ownerSnap] = await Promise.all([
    getDoc(eventRef),
    getDoc(doc(db, 'users', eventOwnerId)),
  ]);

  if (!eventSnap.exists()) throw new Error('Event not found');

  const eventData = eventSnap.data() as EventItem;
  const ownerName: string = ownerSnap.data()?.displayName ?? sharedByName ?? 'Unknown';

  // Idempotency: bail out if this person already has access
  const existingSnap = await getDocs(query(
    collection(db, 'eventShares'),
    where('eventId', '==', eventId),
    where('eventOwnerId', '==', eventOwnerId),
    where('sharedWithUserId', '==', user.uid),
  ));
  if (!existingSnap.empty) {
    throw new Error('This person already has access to the event');
  }

  const sharesCollection = collection(db, 'eventShares');
  const ref = doc(sharesCollection);
  const shareData: EventShare = {
    id: ref.id,
    eventId,
    eventOwnerId,
    sharedWithUserId: user.uid,
    sharedWithEmail,
    sharedByName: sharedByName ?? '',
    ownerName,
    eventName: eventData.name,
    eventDescription: eventData.description ?? '',
    eventExpirationDate: eventData.expirationDate ?? null,
    createdAt: serverTimestamp() as any,
  };
  await setDoc(ref, shareData);

  await createNotification(
    user.uid as string,
    'event_shared',
    `${ownerName} shared an event with you`,
    'New Shared Event',
    eventId,
    { eventOwnerId, eventId }
  );

  // Update event's sharedWith array
  const currentSharedWith = eventData.sharedWith ?? [];
  if (!currentSharedWith.includes(user.uid)) {
    await updateDoc(eventRef, {
      sharedWith: [...currentSharedWith, user.uid],
    });
  }

  return shareData;
}

/**
 * Get all events shared with the current user
 */
export function subscribeToSharedEvents(userId: string, onUpdate: (events: Array<EventItem & { ownerName: string; eventOwnerId: string }>) => void) {
  const sharesQuery = query(
    collection(db, 'eventShares'),
    where('sharedWithUserId', '==', userId)
  );

  return onSnapshot(sharesQuery, (shareSnap) => {
    const sharedEvents = shareSnap.docs.map((d) => {
      const share = d.data() as EventShare;
      return {
        id: share.eventId,
        ownerId: share.eventOwnerId,
        name: share.eventName ?? '',
        description: share.eventDescription ?? '',
        expirationDate: share.eventExpirationDate ?? null,
        ownerName: share.ownerName ?? 'Unknown',
        eventOwnerId: share.eventOwnerId,
      } as EventItem & { ownerName: string; eventOwnerId: string };
    });
    onUpdate(sharedEvents);
  });
}

/**
 * Get gifts for a shared event
 */
/**
 * Subscribe to gifts for a shared event (for real-time updates)
 */
export function subscribeToSharedEventGifts(
  eventOwnerId: string,
  eventId: string,
  onUpdate: (gifts: Gift[]) => void,
  onError?: (err: Error) => void
) {
  const giftsQuery = query(
    collection(db, 'users', eventOwnerId, 'gifts'),
    where('eventId', '==', eventId)
  );
  return onSnapshot(giftsQuery, (snap) => {
    const gifts = snap.docs.map((d) => d.data() as Gift);
    onUpdate(gifts);
  }, (err) => { console.error('[subscribeToSharedEventGifts]', err); onError?.(err); });
}

/**
 * Reserve a gift - current user marks they want to give this gift
 */
export async function reserveGift(
  eventOwnerId: string,
  giftId: string,
  currentUserId: string,
  currentUserName: string
) {
  const giftRef = doc(db, 'users', eventOwnerId, 'gifts', giftId);
  await updateDoc(giftRef, {
    reservedBy: currentUserId,
    reservedByName: currentUserName,
    reservedAt: serverTimestamp(),
  });

  // Notify the event owner (skip if owner is reserving their own gift)
  if (eventOwnerId !== currentUserId) {
    await createNotification(
      eventOwnerId,
      'gift_reserved',
      `${currentUserName} reserved a gift from your event`,
      'Gift Reserved',
      giftId,
      { reservedBy: currentUserId, reservedByName: currentUserName }
    );
  }
}

/**
 * Unreserve a gift
 */
export async function unreserveGift(eventOwnerId: string, giftId: string) {
  const giftRef = doc(db, 'users', eventOwnerId, 'gifts', giftId);
  await updateDoc(giftRef, {
    reservedBy: null,
    reservedByName: null,
    reservedAt: null,
  });
}

/**
 * Unshare an event with a user
 */
export async function unshareEventWithUser(eventOwnerId: string, eventId: string, userId: string) {
  // Find and delete the share document
  const sharesQuery = query(
    collection(db, 'eventShares'),
    where('eventId', '==', eventId),
    where('eventOwnerId', '==', eventOwnerId),
    where('sharedWithUserId', '==', userId)
  );
  const shareSnap = await getDocs(sharesQuery);
  
  for (const shareDoc of shareSnap.docs) {
    await deleteDoc(shareDoc.ref);
  }
  
  const eventRef = doc(db, 'users', eventOwnerId, 'events', eventId);
  await updateDoc(eventRef, { sharedWith: arrayRemove(userId) });
}

export type EventConnection = { uid: string; name: string; email?: string };

export function subscribeToEventConnections(
  uid: string,
  onUpdate: (connections: EventConnection[]) => void
) {
  let received: EventConnection[] = [];
  let sent: EventConnection[] = [];

  const merge = () => {
    const map = new Map<string, EventConnection>();
    [...received, ...sent].forEach(c => { if (!map.has(c.uid)) map.set(c.uid, c); });
    onUpdate(Array.from(map.values()));
  };

  const unsubReceived = onSnapshot(
    query(collection(db, 'eventShares'), where('sharedWithUserId', '==', uid)),
    snap => {
      received = snap.docs.map(d => {
        const data = d.data() as EventShare;
        return { uid: data.eventOwnerId, name: data.ownerName || data.sharedByName || 'User' };
      });
      merge();
    },
    (err) => console.error('[subscribeToEventConnections/received]', err)
  );

  const unsubSent = onSnapshot(
    query(collection(db, 'eventShares'), where('eventOwnerId', '==', uid)),
    snap => {
      sent = snap.docs.map(d => {
        const data = d.data() as EventShare;
        return { uid: data.sharedWithUserId, name: data.sharedWithEmail, email: data.sharedWithEmail };
      });
      merge();
    },
    (err) => console.error('[subscribeToEventConnections/sent]', err)
  );

  return () => { unsubReceived(); unsubSent(); };
}

// --- Helper function to generate share code ---
function generateShareCode(): string {
  // Generate a random alphanumeric string (8 characters)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// --- Friend Management Functions ---

export interface UserSearchResult {
  uid: string;
  email: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
}

/**
 * Unified search — '@handle' or plain 'handle' searches username, 'user@domain' searches email.
 */
export async function searchUsers(input: string): Promise<UserSearchResult[]> {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return [];

  const byUsername = trimmed.startsWith('@') || !trimmed.includes('@');
  const term = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  if (!term) return [];

  const field = byUsername ? 'username' : 'email';
  const q = query(
    collection(db, 'users'),
    where(field, '>=', term),
    where(field, '<=', term + '\uf8ff'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    uid: d.id,
    email: d.data().email ?? '',
    username: d.data().username ?? '',
    displayName: d.data().displayName ?? '',
    photoURL: d.data().photoURL ?? '',
  }));
}

/**
 * Get user info by UID
 */
async function getUserByUid(uid: string) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists()
    ? {
        uid: snap.id,
        ...snap.data(),
      }
    : null;
}

/**
 * Get user info by email
 */
async function getUserByEmail(email: string) {
  const usersCollection = collection(db, 'users');
  const q = query(usersCollection, where('email', '==', email.toLowerCase()));
  const snap = await getDocs(q);
  
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return {
    uid: doc.id,
    ...doc.data(),
  };
}

/**
 * Add a friend by UID
 */
/**
 * Get all friends of a user
 */
export function subscribeToFriends(userId: string, onUpdate: (friends: Friend[]) => void) {
  const friendsQuery = query(
    collection(db, 'users', userId, 'friends'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(friendsQuery, (snap) => {
    const friends = snap.docs.map((d) => d.data() as Friend);
    onUpdate(friends);
  }, (err) => console.error('[subscribeToFriends]', err));
}

/**
 * Remove a friend
 */
export async function removeFriend(userId: string, friendId: string) {
  const [snapA, snapB] = await Promise.all([
    getDocs(query(collection(db, 'users', userId,   'friends'), where('friendId', '==', friendId))),
    getDocs(query(collection(db, 'users', friendId, 'friends'), where('friendId', '==', userId))),
  ]);
  const batch = writeBatch(db);
  [...snapA.docs, ...snapB.docs].forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function updateFriendNotes(uid: string, friendDocId: string, notes: string) {
  await updateDoc(doc(db, 'users', uid, 'friends', friendDocId), { notes });
}

// --- Event Share Link Functions ---

/**
 * Get event details by share code.
 * Reads only the eventShareCodes doc — no auth required (publicly readable collection).
 * Event fields are denormalized into the code doc at creation and kept in sync on edit.
 */
export async function getEventByShareCode(shareCode: string) {
  const codeRef = doc(db, 'eventShareCodes', shareCode);
  const snap = await getDoc(codeRef);
  if (!snap.exists()) return null;

  const d = snap.data();
  return {
    event: {
      id: d.eventId,
      ownerId: d.eventOwnerId,
      name: d.eventName ?? '',
      description: d.eventDescription ?? '',
      expirationDate: d.eventExpirationDate ?? null,
      shareCode,
      sharedWith: [],
    } as EventItem,
    ownerUid: d.eventOwnerId,
  };
}

/**
 * Create or update the share code reference (call this when creating/updating an event)
 */
async function indexShareCode(
  eventOwnerId: string,
  eventId: string,
  shareCode: string,
  eventName: string,
  eventDescription: string,
  eventExpirationDate: Date | null,
) {
  const shareCodeRef = doc(db, 'eventShareCodes', shareCode);
  await setDoc(shareCodeRef, {
    shareCode,
    eventId,
    eventOwnerId,
    eventName,
    eventDescription,
    eventExpirationDate,
    createdAt: serverTimestamp() as any,
  });
}

/**
 * Get shared people for an event (everyone who can see it)
 */
export async function getEventSharedWith(eventOwnerId: string, eventId: string) {
  const sharesQuery = query(
    collection(db, 'eventShares'),
    where('eventId', '==', eventId),
    where('eventOwnerId', '==', eventOwnerId)
  );
  const snap = await getDocs(sharesQuery);
  return snap.docs.map((d) => d.data() as EventShare);
}

// --- Friend Request Functions ---

/**
 * Send a friend request
 */
export async function sendFriendRequest(
  fromUserId: string,
  toUserId: string,
  fromUserEmail: string,
  fromUserName?: string,
  toUserEmail?: string,
  toUserName?: string,
) {
  if (fromUserId === toUserId) {
    throw new Error('Cannot send a friend request to yourself');
  }

  // Check if request already exists
  const existingQuery = query(
    collection(db, 'friendRequests'),
    where('fromUserId', '==', fromUserId),
    where('toUserId', '==', toUserId),
    where('status', '==', 'pending')
  );
  const existing = await getDocs(existingQuery);
  if (!existing.empty) {
    throw new Error('Friend request already sent');
  }

  const requestsCollection = collection(db, 'friendRequests');
  const ref = doc(requestsCollection);
  const requestData: FriendRequest = {
    id: ref.id,
    fromUserId,
    toUserId,
    fromUserEmail,
    fromUserName: fromUserName ?? '',
    toUserEmail: toUserEmail ?? '',
    toUserName: toUserName ?? '',
    status: 'pending',
    createdAt: serverTimestamp() as any,
  };
  await setDoc(ref, requestData);

  // Create notification for recipient
  await createNotification(toUserId, 'friend_request', `${fromUserName || fromUserEmail} sent you a friend request`, `New friend request`, ref.id, {
    fromUserId,
    fromUserName,
    fromUserEmail,
  });

  return requestData;
}

/**
 * Accept a friend request — atomically updates status and both friend records.
 */
export async function acceptFriendRequest(requestId: string) {
  const requestRef = doc(db, 'friendRequests', requestId);
  const requestSnap = await getDoc(requestRef);

  if (!requestSnap.exists()) throw new Error('Request not found');
  const request = requestSnap.data() as FriendRequest;

  // Pre-fetch user profiles outside the transaction (queries can't run inside)
  const [toUser, fromUser] = await Promise.all([
    getUserByUid(request.toUserId),
    getUserByUid(request.fromUserId),
  ]);

  // Pre-generate new doc refs for bidirectional friend records
  const fromFriendRef = doc(collection(db, 'users', request.fromUserId, 'friends'));
  const toFriendRef   = doc(collection(db, 'users', request.toUserId,   'friends'));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(requestRef);
    if (!snap.exists()) throw new Error('Friend request not found');
    const currentStatus = snap.data()?.status;
    if (currentStatus === 'accepted') return; // idempotent — already done (tx retry or double-tap)
    if (currentStatus !== 'pending') throw new Error('Friend request is no longer available');
    const ts = serverTimestamp();
    tx.update(requestRef, { status: 'accepted' });
    tx.set(fromFriendRef, {
      id: fromFriendRef.id,
      userId: request.fromUserId,
      friendId: request.toUserId,
      friendEmail: (toUser as any)?.email ?? '',
      friendName: (toUser as any)?.displayName ?? '',
      friendUsername: (toUser as any)?.username ?? '',
      friendPhotoURL: (toUser as any)?.photoURL ?? '',
      status: 'accepted',
      createdAt: ts,
    });
    tx.set(toFriendRef, {
      id: toFriendRef.id,
      userId: request.toUserId,
      friendId: request.fromUserId,
      friendEmail: (fromUser as any)?.email ?? request.fromUserEmail,
      friendName: (fromUser as any)?.displayName ?? '',
      friendUsername: (fromUser as any)?.username ?? '',
      friendPhotoURL: (fromUser as any)?.photoURL ?? '',
      status: 'accepted',
      createdAt: ts,
    });
  });

  // Notify the original sender (fire outside transaction — not critical to atomicity)
  await createNotification(
    request.fromUserId,
    'friend_accepted',
    `${(toUser as any)?.displayName || 'A user'} accepted your friend request`,
    'Friend request accepted',
    request.fromUserId,
    { userId: request.toUserId, displayName: (toUser as any)?.displayName }
  );
}

/**
 * Reject/Cancel a friend request
 */
export async function rejectFriendRequest(requestId: string) {
  const requestRef = doc(db, 'friendRequests', requestId);
  await updateDoc(requestRef, { status: 'rejected' });
}

/**
 * Get pending friend requests for a user
 */
export function subscribeToPendingRequests(userId: string, onUpdate: (requests: FriendRequest[]) => void) {
  const requestsQuery = query(
    collection(db, 'friendRequests'),
    where('toUserId', '==', userId)
  );
  return onSnapshot(requestsQuery, (snap) => {
    const requests = snap.docs
      .map((d) => d.data() as FriendRequest)
      .filter((r) => r.status === 'pending')
      .sort((a, b) => {
        const ta = (a.createdAt as any)?.toMillis?.() ?? 0;
        const tb = (b.createdAt as any)?.toMillis?.() ?? 0;
        return tb - ta;
      });
    onUpdate(requests);
  }, (err) => console.error('[subscribeToPendingRequests]', err));
}

// --- Event Analytics Functions ---

/**
 * Track event view
 */
export async function trackEventView(eventOwnerId: string, eventId: string, viewedByUserId: string) {
  const analyticRef = doc(db, 'eventAnalytics', `${eventOwnerId}_${eventId}`);
  const snap = await getDoc(analyticRef);
  await setDoc(analyticRef, {
    id: `${eventOwnerId}_${eventId}`,
    eventOwnerId,
    eventId,
    viewedBy: arrayUnion(viewedByUserId),
    viewCount: increment(1),
    lastViewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...(!snap.exists() ? { createdAt: serverTimestamp() } : {}),
  }, { merge: true });
}

/**
 * Track gift reservation
 */
export async function trackGiftReservation(eventOwnerId: string, eventId: string) {
  const analyticRef = doc(db, 'eventAnalytics', `${eventOwnerId}_${eventId}`);
  await setDoc(analyticRef, {
    reservationCount: increment(1),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// --- Push Token ---

export async function savePushToken(uid: string, token: string): Promise<void> {
  await setDoc(doc(db, 'users', uid), { pushToken: token, updatedAt: serverTimestamp() }, { merge: true });
}

// --- Notification Functions ---

/**
 * Create a notification
 */
async function createNotification(
  userId: string,
  type: 'friend_request' | 'event_shared' | 'gift_reserved' | 'friend_accepted',
  message: string,
  title: string,
  relatedId?: string,
  relatedData?: Record<string, any>
) {
  const notificationsCollection = collection(db, 'users', userId, 'notifications');
  const ref = doc(notificationsCollection);
  const notification: Notification = {
    id: ref.id,
    userId,
    type,
    title,
    message,
    relatedId: relatedId ?? '',
    relatedData: relatedData ?? {},
    read: false,
    createdAt: serverTimestamp() as any,
  };
  await setDoc(ref, notification);
  return notification;
}

/**
 * Get notifications for a user
 */
export function subscribeToNotifications(userId: string, onUpdate: (notifications: Notification[]) => void) {
  const notificationsQuery = query(
    collection(db, 'users', userId, 'notifications'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(notificationsQuery, (snap) => {
    const notifications = snap.docs.map((d) => d.data() as Notification);
    onUpdate(notifications);
  }, (err) => console.error('[subscribeToNotifications]', err));
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(userId: string, notificationId: string) {
  const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
  await updateDoc(notificationRef, { read: true });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string) {
  const notificationsQuery = query(
    collection(db, 'users', userId, 'notifications'),
    where('read', '==', false)
  );
  const snap = await getDocs(notificationsQuery);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

/**
 * Delete a notification
 */
export async function deleteNotification(userId: string, notificationId: string) {
  const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
  await deleteDoc(notificationRef);
}

// --- User Profile Functions ---

/**
 * Subscribe to user profile updates
 */
export function subscribeToUserProfile(uid: string, onUpdate: (profile: any) => void) {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data());
    }
  }, (err) => console.error('[subscribeToUserProfile]', err));
}

/**
 * Subscribe to real-time event analytics
 */
export function subscribeToEventAnalytics(
  eventOwnerId: string,
  eventId: string,
  onUpdate: (analytic: EventAnalytic | null) => void
) {
  const analyticRef = doc(db, 'eventAnalytics', `${eventOwnerId}_${eventId}`);
  return onSnapshot(analyticRef, (snap) => {
    onUpdate(snap.exists() ? (snap.data() as EventAnalytic) : null);
  }, (err) => console.error('[subscribeToEventAnalytics]', err));
}

/**
 * Subscribe to outgoing (sent) pending friend requests
 */
export function subscribeToOutgoingRequests(
  userId: string,
  onUpdate: (requests: FriendRequest[]) => void
) {
  const q = query(
    collection(db, 'friendRequests'),
    where('fromUserId', '==', userId)
  );
  return onSnapshot(q, (snap) => {
    const requests = snap.docs
      .map((d) => d.data() as FriendRequest)
      .filter((r) => r.status === 'pending')
      .sort((a, b) => {
        const ta = (a.createdAt as any)?.toMillis?.() ?? 0;
        const tb = (b.createdAt as any)?.toMillis?.() ?? 0;
        return tb - ta;
      });
    onUpdate(requests);
  }, (err) => console.error('[subscribeToOutgoingRequests]', err));
}

