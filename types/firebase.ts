export interface Gift {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt?: any; // Firestore Timestamp
  eventId?: string | null;
}

export interface EventItem {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  expirationDate?: any; // Firestore Timestamp
  createdAt?: any;
}
