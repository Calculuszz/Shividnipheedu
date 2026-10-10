import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { staffRole, type StaffRole } from '@/lib/adminAuth';

// Shared helpers for /api/booking/* (students) and /api/staff/* (activity staff).
// Every rule lives in the booking_* SQL functions (supabase/booking-schema.sql);
// these routes only validate shapes, call them, and turn their errors into JSON.

export type BookingState = 'not_open' | 'open' | 'closed';

export type Activity = {
  id: string;
  name: string;
  room_name: string | null;
  details_md: string | null;
  rules_md: string | null;
  health_notice: string | null;
  team_min: number;
  team_max: number;
  online_seats: number;
  walkin_seats: number;
  checkin_opens_before: string;
  checkin_duration: string;
  booking_opens_at: string | null;
  booking_closes_at: string | null;
};

const ACTIVITY_FIELDS =
  'id, name, room_name, details_md, rules_md, health_notice, team_min, team_max, online_seats, walkin_seats, ' +
  'checkin_opens_before, checkin_duration, booking_opens_at, booking_closes_at';

// What students may see about a round: seat counts, never names.
export const PUBLIC_ROUND_FIELDS =
  'id, round_no, starts_at, ends_at, closed, closed_reason, checkin_opens_at, checkin_closes_at, ' +
  'online_cap, online_left, walkin_left, round_status';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);

export async function getActivity(id: unknown): Promise<Activity | null> {
  if (typeof id !== 'string' || !/^[a-z_]{1,40}$/.test(id)) return null;
  const { data, error } = await supabaseAdmin
    .from('booking_activities')
    .select(ACTIVITY_FIELDS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Activity | null;
}

export function bookingState(a: Pick<Activity, 'booking_opens_at' | 'booking_closes_at'>, now = Date.now()): BookingState {
  if (!a.booking_opens_at || now < Date.parse(a.booking_opens_at)) return 'not_open';
  if (a.booking_closes_at && now > Date.parse(a.booking_closes_at)) return 'closed';
  return 'open';
}

// Postgres intervals come back as 'HH:MM:SS'.
export function intervalMinutes(interval: string) {
  const [h = '0', m = '0'] = interval.split(':');
  return Number(h) * 60 + Number(m);
}

// Accepts 'svp-7k3qx9', ' SVP 7K3QX9 ' or just '7K3QX9'. Returns null if it can't be a code.
export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.toUpperCase().replace(/[\s-]/g, '');
  const body = s.startsWith('SVP') ? s.slice(3) : s;
  return /^[A-Z0-9]{6}$/.test(body) ? `SVP-${body}` : null;
}

// Activities whose bookings can't be changed, moved or cancelled once made (brief).
const NO_CHANGES = new Set(['haunted_house']);
export const changesAllowed = (activityId: string) => !NO_CHANGES.has(activityId);

/**
 * For the change / cancel routes: a 403 when this code belongs to an activity whose
 * bookings are final, else null. Checked on the server, whatever page sent the request.
 */
export async function refuseFinalBooking(code: string) {
  const { data, error } = await supabaseAdmin.from('booking_players').select('activity_id').eq('code', code).maybeSingle();
  if (error) throw error;
  return data && !changesAllowed(data.activity_id) ? NextResponse.json({ error: 'NOT_ALLOWED' }, { status: 403 }) : null;
}

export const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null);
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
}

export function badRequest(error = 'BAD_REQUEST') {
  return NextResponse.json({ error }, { status: 400 });
}

// The SQL functions raise 'CODE' or 'CODE:detail'. Anything else is a real failure.
const RULE_STATUS: Record<string, number> = {
  INVALID_PLAYER: 400,
  TEAM_SIZE: 400,
  DUPLICATE_IN_TEAM: 400,
  NOT_FOUND: 404,
  ROUND_NOT_FOUND: 404,
  NOT_LEADER: 403,
  NOT_ALLOWED: 403,
  NOT_REGISTERED: 400,
  ROUND_CLOSED: 409,
  BOOKING_NOT_OPEN: 409,
  BOOKING_CLOSED: 409,
  ALREADY_BOOKED: 409,
  NOT_ENOUGH_SEATS: 409,
  SAME_ROUND: 409,
  TOO_LATE: 409,
  TOO_EARLY: 409,
  NOT_CANCELLABLE: 409,
  CANNOT_REMOVE_LEADER: 409,
  CHECKIN_NOT_OPEN: 409,
  CHECKIN_CLOSED: 409,
  ALREADY_CHECKED_IN: 409,
  TRY_AGAIN: 409,
};

export function ruleError(error: { message?: string } | null, context: string) {
  const [code, ...rest] = String(error?.message ?? '').split(':');
  const status = RULE_STATUS[code];
  if (status) {
    const detail = rest.join(':') || undefined;
    return NextResponse.json({ error: code, detail }, { status });
  }
  console.error(`${context} error:`, error);
  return serverError();
}

export function serverError() {
  return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
}

// Staff groups that run a bookable activity. Registration staff have no booking access.
const STAFF_ACTIVITY: Partial<Record<StaffRole, string>> = {
  escape_room: 'escape_room',
  haunted_house: 'haunted_house',
};

export function staffActivity(request: Request) {
  const role = staffRole(request);
  const activity = role ? STAFF_ACTIVITY[role] : undefined;
  return role && activity ? { role, activity } : null;
}

export function forbidden() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// A round id from the client only counts if it belongs to the staff member's activity.
export async function roundInActivity(roundId: unknown, activity: string) {
  if (!isUuid(roundId)) return false;
  const { data, error } = await supabaseAdmin
    .from('booking_rounds')
    .select('id')
    .eq('id', roundId)
    .eq('activity_id', activity)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}
