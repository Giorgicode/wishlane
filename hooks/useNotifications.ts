import { subscribeToNotifications } from '@/lib/firestore';
import type { Notification } from '@/types/firebase';
import { useEffect, useState } from 'react';

export function useNotifications(uid: string | null): {
  notifications: Notification[];
  unreadCount: number;
} {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      return;
    }
    return subscribeToNotifications(uid, setNotifications);
  }, [uid]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  return { notifications, unreadCount };
}
