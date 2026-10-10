import { errorMessage } from '@/lib/bookingText';
import { syncServerClock } from '@/lib/bookingTime';
import type {
  ActivityId,
  AttendanceResponse,
  BookRequest,
  BookResult,
  BookingStateResponse,
  CancelSeatResult,
  MyBooking,
  RoundsResponse,
  StaffPlayer,
  StaffRound,
} from '@/lib/bookingTypes';

// Browser-side calls to the booking API. Pages use these instead of fetch(),
// so every error arrives as a BookingApiError with Thai text ready to show.

export class BookingApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public detail?: string
  ) {
    super(errorMessage(code, detail));
    this.name = 'BookingApiError';
  }
}

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const method = init?.method ?? (init?.body ? 'POST' : 'GET');
  const send = () =>
    fetch(path, {
      method,
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
    });

  let res: Response;
  try {
    res = await send();
    // Supabase occasionally answers one request with a 5xx (e.g. a clock-skew JWT error).
    // Reads are safe to repeat once; writes are never retried so nothing is booked twice.
    if (method === 'GET' && res.status >= 500) {
      await new Promise((r) => setTimeout(r, 400));
      res = await send();
    }
  } catch {
    throw new BookingApiError(0, 'NETWORK');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = res.status === 401 ? 'UNAUTHORIZED' : String(data?.error ?? 'SERVER_ERROR');
    throw new BookingApiError(res.status, code, data?.detail);
  }
  return data as T;
}

const q = encodeURIComponent;

// ---- Student side (no login) ----

export async function getBookingState(activity: ActivityId) {
  const data = await call<BookingStateResponse>(`/api/booking/state?activity=${q(activity)}`);
  syncServerClock(data.now);
  return data;
}

export function getRounds(activity: ActivityId) {
  return call<RoundsResponse>(`/api/booking/rounds?activity=${q(activity)}`);
}

export async function checkStudent(activity: ActivityId, studentId: string) {
  return (await studentStatus(activity, studentId)).taken;
}

/** Booked already, and registered for the event (only registered students can be booked) */
export function studentStatus(activity: ActivityId, studentId: string) {
  return call<{ taken: boolean; registered: boolean }>('/api/booking/check-student', {
    body: { activity, student_id: studentId },
  });
}

export function book(request: BookRequest) {
  return call<BookResult>('/api/booking/book', { body: request });
}

/** `activity`: the page's own activity. Another activity's code answers WRONG_ACTIVITY. */
export function findBooking(code: string, activity?: ActivityId) {
  return call<MyBooking>('/api/booking/find', { body: { code, activity } });
}

export function changeRound(code: string, roundId: string) {
  return call<{ round_id: string }>('/api/booking/change-round', { body: { code, round_id: roundId } });
}

export function cancelSeat(code: string) {
  return call<CancelSeatResult>('/api/booking/cancel-seat', { body: { code } });
}

export function cancelTeam(code: string) {
  return call<{ cancelled: number }>('/api/booking/cancel-team', { body: { code } });
}

export function removeMember(code: string, playerId: string) {
  return call<{ removed_id: string }>('/api/booking/remove-member', { body: { code, player_id: playerId } });
}

// ---- Staff side (needs the activity group's login cookie) ----

/** Faculty and year come back for the Haunted House only */
type CheckInResult = { player_id: string; full_name: string; round_no: number; faculty?: string | null; year?: string | null };

export const staff = {
  dashboard: () => call<{ rounds: StaffRound[]; now: string }>('/api/staff/dashboard'),
  attendance: (roundId: string) => call<AttendanceResponse>(`/api/staff/attendance?round=${q(roundId)}`),
  search: (text: string) => call<{ players: StaffPlayer[] }>(`/api/staff/attendance?q=${q(text)}`),
  checkInByCode: (code: string) => call<CheckInResult>('/api/staff/check-in', { body: { code } }),
  checkInById: (playerId: string) =>
    call<CheckInResult>('/api/staff/check-in', {
      body: { player_id: playerId },
    }),
  addWalkin: (input: { round_id: string; student_id: string; full_name: string; phone: string; nickname?: string }) =>
    call<{ walkin_id: string; status: 'checked_in' | 'queued' }>('/api/staff/walkin', { body: input }),
  callNextWalkin: (roundId: string) =>
    call<{ walkin: { walkin_id: string; full_name: string; phone: string; queue_no: number } | null }>(
      '/api/staff/walkin/next',
      { body: { round_id: roundId } }
    ),
  leaveQueue: (walkinId: string) =>
    call<{ id: string; status: 'left' }>('/api/staff/walkin', { method: 'PATCH', body: { id: walkinId } }),
  updateRound: (input: {
    round_id: string;
    closed?: boolean;
    closed_reason?: string;
    online_seats?: number | null;
    walkin_seats?: number | null;
  }) => call<{ round: unknown }>('/api/staff/rounds', { method: 'PATCH', body: input }),
  exportAll: () =>
    call<{ players: Record<string, unknown>[]; walkins: Record<string, unknown>[] }>('/api/staff/export'),
};
