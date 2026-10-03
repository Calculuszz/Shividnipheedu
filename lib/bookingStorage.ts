import type { ActivityId, BookResult } from '@/lib/bookingTypes';

// What the browser remembers. Storage can be blocked (private mode, in-app
// browsers), so every call is wrapped and the pages must work without it.

const codeKey = (activity: ActivityId) => `booking:${activity}`;
const LAST_BOOKING_KEY = 'booking:last';

/** Remember this device's booking code (after booking or a successful search). */
export function rememberCode(activity: ActivityId, code: string) {
  try {
    localStorage.setItem(codeKey(activity), code);
  } catch {}
}

export function getRememberedCode(activity: ActivityId): string | null {
  try {
    return localStorage.getItem(codeKey(activity));
  } catch {
    return null;
  }
}

/** Forget it once the code no longer works (cancelled, removed, not found). */
export function forgetCode(activity: ActivityId) {
  try {
    localStorage.removeItem(codeKey(activity));
  } catch {}
}

/** Booking form → confirmation page hand-off. */
export function saveLastBooking(result: BookResult) {
  try {
    sessionStorage.setItem(LAST_BOOKING_KEY, JSON.stringify(result));
  } catch {}
}

export function readLastBooking(): BookResult | null {
  try {
    const raw = sessionStorage.getItem(LAST_BOOKING_KEY);
    return raw ? (JSON.parse(raw) as BookResult) : null;
  } catch {
    return null;
  }
}
