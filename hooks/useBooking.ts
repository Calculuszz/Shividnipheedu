'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { BookingApiError, findBooking, getBookingState, getRounds, myBookingCode } from '@/lib/bookingClient';
import { getRememberedCode, rememberCode } from '@/lib/bookingStorage';
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
  const loaded = useLoad(`state:${activity}`, () => getBookingState(activity));
  const { data, refresh } = loaded;

  // Someone waiting on the page when booking opens (or closes) sees the change without
  // reloading: fetch again just after that moment, and whenever the tab comes back.
  useEffect(() => {
    if (!data) return;
    const { booking_opens_at: opens, booking_closes_at: closes } = data.activity;
    const next = data.state === 'not_open' ? opens : data.state === 'open' ? closes : null;
    if (!next) return;
    const due = () => serverNow() >= Date.parse(next);
    const wait = Date.parse(next) - serverNow() + 1000;
    // Long waits are left to the visibility check: timers that far out are unreliable
    const timer = wait < 6 * 60 * 60 * 1000 ? setTimeout(() => void refresh(), Math.max(wait, 0)) : null;
    const onVisible = () => {
      if (!document.hidden && due()) void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [data, refresh]);

  return loaded;
}

/** Every round with seat counts. Call refresh() whenever the numbers must be current. */
export function useRounds(activity: ActivityId): Loaded<RoundsResponse> {
  return useLoad(`rounds:${activity}`, () => getRounds(activity));
}

const noSubscription = () => () => {};

/**
 * This device's remembered booking code, or else the logged-in student's own booking
 * (new phone, or a teammate the leader booked for). `checking` while asking the server.
 */
export function useMyCode(activity: ActivityId) {
  const remembered = useSyncExternalStore(noSubscription, () => getRememberedCode(activity), () => null);
  const [found, setFound] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (remembered) return;
    let alive = true;
    myBookingCode(activity)
      .then((code) => {
        if (!alive) return;
        if (code) rememberCode(activity, code);
        setFound(code);
      })
      .catch(() => alive && setFound(null));
    return () => {
      alive = false;
    };
  }, [remembered, activity]);

  return { code: remembered ?? found ?? null, checking: !remembered && found === undefined };
}

/** A booking by personal code. Pass null to wait (e.g. until the user types a code). */
export function useMyBooking(code: string | null, activity?: ActivityId): Loaded<MyBooking> {
  return useLoad(code ? `find:${activity ?? ''}:${code}` : null, () => findBooking(code!, activity));
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
