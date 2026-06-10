import { useAuth } from '@/hooks/useAuth';
import { subscribeToEvents, subscribeToGifts } from '@/lib/firestore';
import type { EventItem, Gift } from '@/types/firebase';
import { createContext, useContext, useEffect, useState } from 'react';

interface AppDataContextValue {
  events: EventItem[];
  eventsReady: boolean;
  gifts: Gift[];
  giftsReady: boolean;
}

const AppDataContext = createContext<AppDataContextValue>({
  events: [],
  eventsReady: false,
  gifts: [],
  giftsReady: false,
});

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { uid, authReady } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsReady, setEventsReady] = useState(false);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [giftsReady, setGiftsReady] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    if (!uid) {
      setEvents([]);
      setEventsReady(true);
      setGifts([]);
      setGiftsReady(true);
      return;
    }
    const unsubEvents = subscribeToEvents(uid, (e) => { setEvents(e); setEventsReady(true); });
    const unsubGifts  = subscribeToGifts(uid,  (g) => { setGifts(g);  setGiftsReady(true); });
    return () => { unsubEvents(); unsubGifts(); };
  }, [uid, authReady]);

  return (
    <AppDataContext.Provider value={{ events, eventsReady, gifts, giftsReady }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}
