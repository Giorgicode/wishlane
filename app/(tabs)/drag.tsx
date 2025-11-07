// Clean single implementation for drag screen with native Drax + web fallback
import { auth } from '@/config/firebaseConfig';
import { assignGiftToEvent, createEvent, createGift, subscribeToEvents, subscribeToGifts } from '@/lib/firestore';
import type { EventItem, Gift } from '@/types/firebase';
import { useEffect, useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DragScreen() {
  const uid = auth.currentUser?.uid ?? 'demo-user';
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [drax, setDrax] = useState<any | null>(null);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);

  useEffect(() => {
    const unsubGifts = subscribeToGifts(uid, setGifts);
    const unsubEvents = subscribeToEvents(uid, setEvents);
    return () => {
      unsubGifts();
      unsubEvents();
    };
  }, [uid]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Prefer dynamic import over require to satisfy ESLint and TS
      (async () => {
        try {
          const lib = await import('react-native-drax');
          // default export shape may differ; keep as-is
          setDrax(lib as any);
        } catch (err) {
          console.warn('react-native-drax not available', err);
          setDrax(null);
        }
      })();
    }
  }, []);

  async function addSample() {
    try {
      await createGift(uid, { name: `Gift ${Math.floor(Math.random() * 1000)}` });
      await createEvent(uid, { name: `Event ${Math.floor(Math.random() * 1000)}` });
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  }

  if (Platform.OS === 'web' || !drax) {
    return (
      <View style={styles.container}>
        <View style={styles.column}>
          <Text style={styles.heading}>Gifts</Text>
          <View style={styles.list}>
            {gifts.map((gift) => (
              <TouchableOpacity
                key={gift.id}
                style={[styles.gift, selectedGift === gift.id ? { borderColor: '#007aff', borderWidth: 2 } : null]}
                onPress={() => setSelectedGift(selectedGift === gift.id ? null : gift.id)}
              >
                <Text>{gift.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.column}>
          <Text style={styles.heading}>Events</Text>
          <View style={styles.list}>
            {events.map((ev) => (
              <TouchableOpacity
                key={ev.id}
                style={styles.event}
                onPress={async () => {
                  if (!selectedGift) {
                    Alert.alert('Select a gift first', 'Tap a gift to select it, then tap an event to assign it.');
                    return;
                  }
                  await assignGiftToEvent(uid, selectedGift, ev.id);
                  setSelectedGift(null);
                }}
              >
                <Text style={{ fontWeight: '600' }}>{ev.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.fab} onPress={addSample}>
          <Text style={{ color: 'white' }}>Add Sample</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { DraxProvider, DraxView, DraxScrollView } = drax;

  return (
    <DraxProvider>
      <View style={styles.container}>
        <View style={styles.column}>
          <Text style={styles.heading}>Gifts</Text>
          <DraxScrollView style={styles.list} contentContainerStyle={{ padding: 8 }}>
            {gifts.map((gift) => (
              <DraxView
                key={gift.id}
                style={styles.gift}
                draggingStyle={styles.dragging}
                dragPayload={gift.id}
                longPressDelay={150}
              >
                <Text>{gift.name}</Text>
                {gift.imageUrl ? <Image source={{ uri: gift.imageUrl }} style={styles.thumb} /> : null}
              </DraxView>
            ))}
          </DraxScrollView>
        </View>

        <View style={styles.column}>
          <Text style={styles.heading}>Events</Text>
          <View style={styles.list}>
            {events.map((ev) => (
              <DraxView
                key={ev.id}
                style={styles.event}
                receivingStyle={styles.receiving}
                onReceiveDragDrop={async (e: any) => {
                  const giftId = e.dragged.payload as string;
                  await assignGiftToEvent(uid, giftId, ev.id);
                }}
              >
                <Text style={{ fontWeight: '600' }}>{ev.name}</Text>
                {ev.imageUrl ? <Image source={{ uri: ev.imageUrl }} style={styles.thumb} /> : null}
              </DraxView>
            ))}
          </View>
        </View>

      </View>
      <TouchableOpacity style={styles.fab} onPress={addSample}>
        <Text style={{ color: 'white' }}>Add Sample</Text>
      </TouchableOpacity>
    </DraxProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  column: { flex: 1, padding: 8 },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  list: { flex: 1 },
  gift: { padding: 12, marginBottom: 8, backgroundColor: '#fff', borderRadius: 8, elevation: 2 },
  event: { padding: 16, marginBottom: 8, backgroundColor: '#f3f3f3', borderRadius: 8 },
  receiving: { borderColor: '#007aff', borderWidth: 2 },
  dragging: { opacity: 0.6 },
  thumb: { width: 48, height: 48, borderRadius: 6, marginTop: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    backgroundColor: '#007aff',
    padding: 12,
    borderRadius: 24,
    elevation: 4,
  },
});

