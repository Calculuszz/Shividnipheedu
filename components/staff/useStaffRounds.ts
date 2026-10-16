'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookingApiError, staff } from '@/lib/bookingClient';
import { syncServerClock } from '@/lib/bookingTime';
import type { StaffRound } from '@/lib/bookingTypes';

export const POLL_MS = 5000;

/** Session gone (or never there): back to the /admin password screen */
export function toLogin() {
  window.location.replace('/admin');
}

/** Thai message for a failed staff call; an expired session goes back to /admin instead. */
export function staffFail(e: unknown) {
  if (e instanceof BookingApiError) {
    if (e.code === 'UNAUTHORIZED') toLogin();
    return e.message;
  }
  return 'ระบบขัดข้อง ลองใหม่อีกครั้ง';
}

/** Every round with its seat numbers, fetched again every 5 s while the tab is visible. */
export function useStaffRounds(enabled: boolean) {
  const [rounds, setRounds] = useState<StaffRound[] | null>(null);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const data = await staff.dashboard();
      syncServerClock(data.now);
      setRounds(data.rounds);
      setUpdatedAt(data.now);
      setError('');
    } catch (e) {
      setError(staffFail(e));
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      void refresh();
      timer ??= setInterval(() => void refresh(), POLL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, refresh]);

  return { rounds, error, updatedAt, refresh };
}
