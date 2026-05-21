import type { Timestamp } from 'firebase/firestore';

export interface Gift {
  id: string;
  ownerId: string;
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
  createdAt?: Timestamp | Date | null; // Firestore Timestamp
  eventId?: string | null;
  reservedBy?: string | null; // UID of who reserved this gift
  reservedByName?: string | null; // Display name of who reserved
  reservedAt?: Timestamp | Date | null;
}

export interface EventItem {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  expirationDate?: Timestamp | Date | null; // Firestore Timestamp
  createdAt?: Timestamp | Date | null;
  sharedWith?: string[]; // Array of UIDs this event is shared with
  shareCode?: string; // Unique shareable link code
}

export interface EventShare {
  id: string;
  eventId: string;
  eventOwnerId: string;
  sharedWithUserId: string;
  sharedWithEmail: string;
  sharedByName?: string;
  // Denormalized at write time so the subscriber needs zero extra reads
  ownerName?: string;
  eventName?: string;
  eventDescription?: string;
  eventExpirationDate?: Timestamp | Date | null;
  createdAt?: Timestamp | Date | null;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  friendEmail: string;
  friendName?: string;
  friendUsername?: string;
  friendPhotoURL?: string;
  createdAt?: Timestamp | Date | null;
  status: 'pending' | 'accepted';
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserEmail: string;
  fromUserName?: string;
  toUserId: string;
  toUserEmail?: string;
  toUserName?: string;
  createdAt?: Timestamp | Date | null;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface UserProfile {
  uid: string;
  email?: string;
  username?: string;        // @handle — unique, lowercase alphanumeric + underscore
  displayName?: string;
  photoURL?: string;
  pushToken?: string;       // Expo push token for remote notifications
  description?: string;
  gender?: 'female' | 'male' | 'other' | '';
  interests?: string[];
  dislikes?: string[];      // things they do NOT like
  relax?: string[];
  whatMakesYouHappy?: string;
  priceRange?: string;
  favoriteColors?: string[];
  favoriteFood?: string[];
  favoriteDessert?: string[];
  favoriteActivities?: string[];
  allergies?: string[];
  favoriteBrands?: string[];
  preferredGiftTypes?: string[];
  clothingSize?: string;
  shoeSize?: string;
  preferredStores?: string[];
  onboardingComplete?: boolean;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface EventAnalytic {
  id: string;
  eventId: string;
  eventOwnerId: string;
  viewedBy?: string[]; // Array of UIDs who viewed
  viewCount?: number;
  reservationCount?: number;
  lastViewedAt?: Timestamp | Date | null;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'friend_request' | 'event_shared' | 'gift_reserved' | 'friend_accepted';
  title: string;
  message: string;
  relatedId?: string; // eventId, friendRequestId, etc.
  relatedData?: Record<string, any>;
  read: boolean;
  createdAt?: Timestamp | Date | null;
}
