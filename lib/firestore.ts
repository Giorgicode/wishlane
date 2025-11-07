import { db } from '@/config/firebaseConfig';
import type { EventItem, Gift } from '@/types/firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

// Create a gift under users/{uid}/gifts
export async function createGift(uid: string, payload: { name: string; description?: string; imageUrl?: string }) {
  const col = collection(db, 'users', uid, 'gifts');
  const ref = doc(col);
  const data: Gift = {
    id: ref.id,
    ownerId: uid,
    name: payload.name,
    description: payload.description ?? '',
    imageUrl: payload.imageUrl ?? '',
    createdAt: serverTimestamp() as any,
    eventId: null,
  };
  await setDoc(ref, data);
  return data;
}

export async function createEvent(uid: string, payload: { name: string; description?: string; expirationDate?: Date | null; imageUrl?: string }) {
  const col = collection(db, 'users', uid, 'events');
  const ref = doc(col);
  const data: EventItem = {
    id: ref.id,
    ownerId: uid,
    name: payload.name,
    description: payload.description ?? '',
    imageUrl: payload.imageUrl ?? '',
    expirationDate: payload.expirationDate ? payload.expirationDate : null,
    createdAt: serverTimestamp() as any,
  };
  await setDoc(ref, data);
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
  });
}

export function subscribeToEvents(uid: string, onUpdate: (events: EventItem[]) => void) {
  const q = query(collection(db, 'users', uid, 'events'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => d.data() as EventItem);
    onUpdate(items);
  });
}

export async function getGifts(uid: string) {
  const q = query(collection(db, 'users', uid, 'gifts'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Gift);
}

export async function getEvents(uid: string) {
  const q = query(collection(db, 'users', uid, 'events'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as EventItem);
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

export async function getGift(uid: string, giftId: string) {
  const ref = doc(db, 'users', uid, 'gifts', giftId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Gift) : null;
}

// --- User profile helpers ---
export type UserProfile = {
  displayName?: string;
  photoURL?: string;
  description?: string;
  gender?: 'female' | 'male' | 'other' | '';
  interests?: string[];
  relax?: string[]; // ways to relax
  whatMakesYouHappy?: string;
  // Additional fields for gift suggestions
  priceRange?: string; // e.g. '$', '$$', '$$$'
  favoriteColors?: string[];
  allergies?: string[];
  favoriteBrands?: string[];
  preferredGiftTypes?: string[]; // experiences, physical, consumable, subscription
  clothingSize?: string;
  shoeSize?: string;
  preferredStores?: string[];

  createdAt?: any;
  updatedAt?: any;
};

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function setUserProfile(uid: string, profile: Partial<UserProfile>) {
  const ref = doc(db, 'users', uid);
  const data = {
    ...profile,
    updatedAt: serverTimestamp() as any,
  } as any;
  // If the document doesn't exist, set createdAt as well
  await setDoc(ref, { ...data, createdAt: serverTimestamp() } , { merge: true });
}
