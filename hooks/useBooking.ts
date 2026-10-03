'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookingApiError, findBooking, getBookingState, getRounds } from '@/lib/bookingClient';
import { serverNow } from '@/lib/bookingTime';
import type { ActivityId, BookingStateResponse, MyBooking, RoundsResponse } from '@/lib/bookingTypes';

type Loaded<T> = {
  data: T | null;
  error: BookingApiError | null;
  loading: boolean;
  /** Fetch again (after + Add player, before Confirm, after a cancel…) */
  refresh: () => Promise<T | null>;
};

// Loads once on mount (and when `key` changes). No polling: students fetch on
// page open and on actions only, to stay inside Supabase's free limits.
function useLoad<T>(key: string | null, load: () => Promise<T>): Loaded<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<BookingApiError | null>(null);
  const [loading, setLoading] = useState(key !== null);
  const loadRef = useRef(load);
  loadRef.current = load;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadRef.current();
      setData(result);
      setError(null);
      return result;
    } catch (e) {
      setError(e instanceof BookingApiError ? e : new BookingApiError(0, 'SERVER_ERROR'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (key === null) return;
    let alive = true;
    loadRef
      .current()
      .then((result) => {
        if (!alive) return;
        setData(result);
        setError(null);
      })
      .catch((e) => {
        if (alive) setError(e instanceof BookingApiError ? e : new BookingApiError(0, 'SERVER_ERROR'));
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [key]);

  return { data, error, loading, refresh };
}

/** Booking phase (not_open / open / closed) + activity rules and text. */
export function useBookingState(activity: ActivityId): Loaded<BookingStateResponse> {
  return useLoad(`state:${activity}`, () => getBookingState(activity));
}

/** Every round with seat counts. Call refresh() whenever the numbers must be current. */
export function useRounds(activity: ActivityId): Loaded<RoundsResponse> {
  return useLoad(`rounds:${activity}`, () => getRounds(activity));
}

/** A booking by personal code. Pass null to wait (e.g. until the user types a code). */
export function useMyBooking(code: string | null): Loaded<MyBooking> {
  return useLoad(code ? `find:${code}` : null, () => findBooking(code!));
}

/** Server-synced clock that ticks, for countdowns ("check-in closes in 3 min"). */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const id = setInterval(() => setNow(serverNow()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
