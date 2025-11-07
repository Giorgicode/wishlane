import type { Timestamp } from 'firebase/firestore';

export interface Gift {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt?: Timestamp | Date | null; // Firestore Timestamp
  eventId?: string | null;
}

export interface EventItem {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  expirationDate?: Timestamp | Date | null; // Firestore Timestamp
  createdAt?: Timestamp | Date | null;
}
