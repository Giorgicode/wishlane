import { auth } from '@/config/firebaseConfig';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

export function useAuth(): { user: User | null; uid: string | null; authReady: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  return { user, uid: user?.uid ?? null, authReady };
}
