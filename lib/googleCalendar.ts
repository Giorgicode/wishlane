import { auth } from '@/config/firebaseConfig';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const API = 'https://www.googleapis.com/calendar/v3';

export interface GCalEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

/** Opens Google OAuth popup requesting calendar.events scope. Returns access token. */
export async function requestCalendarToken(): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.addScope(CALENDAR_SCOPE);
  // Force consent screen so Google returns a fresh token with calendar scope
  provider.setCustomParameters({ prompt: 'consent' });
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) throw new Error('No access token returned');
  return credential.accessToken;
}

/** Create a Google Calendar event. Returns the new Google Calendar event ID. */
export async function pushToGoogleCalendar(
  accessToken: string,
  event: { name: string; description?: string; expirationDate?: Date | null },
): Promise<string> {
  const start = event.expirationDate ?? new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const body = {
    summary: event.name,
    description: event.description ?? '',
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  };

  const res = await fetch(`${API}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? 'Failed to add to Google Calendar');
  }
  const data = await res.json();
  return data.id as string;
}

/** Fetch the next 50 upcoming events from the user's primary calendar. */
export async function fetchGoogleCalendarEvents(accessToken: string): Promise<GCalEvent[]> {
  const timeMin = new Date().toISOString();
  const url =
    `${API}/calendars/primary/events` +
    `?timeMin=${encodeURIComponent(timeMin)}&maxResults=50&singleEvents=true&orderBy=startTime`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? 'Failed to fetch Google Calendar');
  }
  const data = await res.json();
  return (data.items ?? []) as GCalEvent[];
}

/** Parse a GCalEvent start into a JS Date (or null if all-day). */
export function gCalEventDate(ev: GCalEvent): Date | null {
  const raw = ev.start.dateTime ?? ev.start.date;
  if (!raw) return null;
  return new Date(raw);
}
