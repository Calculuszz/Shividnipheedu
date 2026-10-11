import type { ActivityId, BookResult, MyBooking } from '@/lib/bookingTypes';

// What the browser remembers. Storage can be blocked (private mode, in-app
// browsers), so every call is wrapped and the pages must work without it.
//
// Everything is kept per activity AND per logged-in student: on a shared phone the
// next person never sees (or gets to change) the last person's booking.

const codeKey = (activity: ActivityId) => `booking:${activity}`;
const lastKey = (activity: ActivityId) => `booking:last:${activity}`;

type Owned = { owner: string; value: string };

/** The student logged in on this device (set by the login page), or '' */
function currentStudent() {
  try {
    return localStorage.getItem('studentId') ?? '';
  } catch {
    return '';
  }
}

function readOwned(storage: Storage, key: string): string | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<Owned>;
    const me = currentStudent();
    if (me && data.owner === me && typeof data.value === 'string') return data.value;
  } catch {}
  // Someone else's, or saved by an older version that didn't record the owner
  storage.removeItem(key);
  return null;
}

function writeOwned(storage: Storage, key: string, value: string) {
  const owner = currentStudent();
  if (owner) storage.setItem(key, JSON.stringify({ owner, value } satisfies Owned));
}

/** Remember the logged-in student's booking code (after booking or a successful search). */
export function rememberCode(activity: ActivityId, code: string) {
  try {
    writeOwned(localStorage, codeKey(activity), code);
  } catch {}
}

export function getRememberedCode(activity: ActivityId): string | null {
  try {
    return readOwned(localStorage, codeKey(activity));
  } catch {
    return null;
  }
}

/** Forget it once the code no longer works (cancelled, removed, not found, another activity). */
export function forgetCode(activity: ActivityId) {
  try {
    localStorage.removeItem(codeKey(activity));
    localStorage.removeItem(viewKey(activity));
  } catch {}
}

/** Log out / someone else logs in: drop every booking this device remembers. */
export function forgetAllBookings() {
  for (const storage of [() => localStorage, () => sessionStorage]) {
    try {
      const s = storage();
      for (const key of Object.keys(s)) if (key.startsWith('booking:')) s.removeItem(key);
    } catch {}
  }
}

/** Booking form → confirmation page hand-off, for this activity only. */
export function saveLastBooking(activity: ActivityId, result: BookResult) {
  try {
    writeOwned(sessionStorage, lastKey(activity), JSON.stringify(result));
  } catch {}
}

/** Raw string, a stable snapshot for useSyncExternalStore. */
export function readLastBookingRaw(activity: ActivityId): string | null {
  try {
    return readOwned(sessionStorage, lastKey(activity));
  } catch {
    return null;
  }
}

export function parseLastBooking(raw: string | null): BookResult | null {
  try {
    const data = raw ? (JSON.parse(raw) as BookResult) : null;
    return data && typeof data.code === 'string' && Array.isArray(data.players) ? data : null;
  } catch {
    return null;
  }
}

// ---- Last seen booking (My booking opens instantly, even with no signal at the booth) ----

const viewKey = (activity: ActivityId) => `booking:view:${activity}`;
type SavedView = { at: number; booking: MyBooking };

/** Keep the booking the server just sent, for the next time the page opens. */
export function saveBookingView(activity: ActivityId, booking: MyBooking) {
  try {
    writeOwned(localStorage, viewKey(activity), JSON.stringify({ at: Date.now(), booking } satisfies SavedView));
  } catch {}
}

/** Raw saved booking, a stable snapshot for useSyncExternalStore (parse with parseBookingView). */
export function readBookingViewRaw(activity: ActivityId): string | null {
  try {
    return readOwned(localStorage, viewKey(activity));
  } catch {
    return null;
  }
}

export function parseBookingView(raw: string | null): SavedView | null {
  try {
    const data = raw ? (JSON.parse(raw) as SavedView) : null;
    return data && typeof data.at === 'number' && typeof data.booking?.me?.code === 'string' ? data : null;
  } catch {
    return null;
  }
}

/** The last booking this device saw for the logged-in student, and when it was fetched. */
export function readBookingView(activity: ActivityId): SavedView | null {
  return parseBookingView(readBookingViewRaw(activity));
}

export function forgetBookingView(activity: ActivityId) {
  try {
    localStorage.removeItem(viewKey(activity));
  } catch {}
}
