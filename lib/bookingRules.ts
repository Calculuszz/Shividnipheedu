import type { ActivityId, Round } from '@/lib/bookingTypes';

// Small rules several pages need, kept in one place so the round list, the
// change-round sheet and the booking form agree. The server checks all of
// these again; this is only for what the buttons show.

export const DEFAULT_ACTIVITY: ActivityId = 'escape_room';

// Shown as "Almost full" at or below this many online seats
export const ALMOST_FULL = 3;

/** /escape-room, /haunted-house */
export function activitySlug(activity: ActivityId) {
  return activity.replace(/_/g, '-');
}

/** Every student page of an activity, so links never get typed by hand. */
export function bookingPaths(activity: ActivityId = DEFAULT_ACTIVITY) {
  const base = `/${activitySlug(activity)}`;
  return {
    home: base,
    start: `${base}/start`,
    rounds: `${base}/rounds`,
    book: `${base}/book`,
    confirmed: `${base}/confirmed`,
    myBooking: `${base}/my-booking`,
    rules: `${base}/rules`,
    privacy: `${base}/privacy`,
  };
}

export type RoundPick =
  | { selectable: true; level: 'ok' | 'almost_full' }
  | { selectable: false; reason: 'closed' | 'full' | 'not_enough' | 'not_open_for_booking' };

/** Can a team of `teamSize` pick this round right now? */
export function roundPick(round: Round, teamSize = 1): RoundPick {
  if (round.closed || round.round_status === 'closed') return { selectable: false, reason: 'closed' };
  if (round.round_status !== 'available') {
    return { selectable: false, reason: round.round_status === 'full' ? 'full' : 'not_open_for_booking' };
  }
  if (round.online_left <= 0) return { selectable: false, reason: 'full' };
  if (round.online_left < teamSize) return { selectable: false, reason: 'not_enough' };
  return { selectable: true, level: round.online_left <= ALMOST_FULL ? 'almost_full' : 'ok' };
}

/** "6631•••421" for showing a student ID without the full number. */
export function maskStudentId(id: string) {
  return id.length === 10 ? `${id.slice(0, 4)}•••${id.slice(7)}` : id;
}

export const isStudentId = (v: string) => /^[0-9]{10}$/.test(v);
export const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());
