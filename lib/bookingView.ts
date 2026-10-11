import { supabaseAdmin } from '@/lib/supabase';
import { changesAllowed } from '@/lib/booking';

// One student's booking as the My booking pages show it, from the booking_view SQL
// function in a single Supabase call (supabase/booking-view.sql).

type ViewRow = {
  me: {
    id: string;
    booking_id: string;
    activity_id: string;
    round_id: string;
    is_leader: boolean;
    full_name: string;
    code: string;
    live_status: string;
    checked_in_at: string | null;
    checkin_opens_at: string;
    checkin_closes_at: string;
  };
  round: { round_no: number; starts_at: string; ends_at: string; checkin_opens_at: string; checkin_closes_at: string };
  booking: { status: string; notes: string | null };
  activity: { id: string; name: string; room_name: string | null; booking_closes_at: string | null } | null;
  team: { id: string; full_name: string; is_leader: boolean; live_status: string }[];
};

/** By personal code, or the logged-in student's own booking in an activity. Null when there is none. */
export async function loadBookingView(by: { code: string } | { studentId: string; activity: string }) {
  const { data, error } = await supabaseAdmin.rpc(
    'booking_view',
    'code' in by ? { p_code: by.code } : { p_student_id: by.studentId, p_activity_id: by.activity }
  );
  if (error) throw error;
  return (data as ViewRow | null) ?? null;
}

/** The JSON the pages read (MyBooking in lib/bookingTypes.ts). */
export function toMyBooking(v: ViewRow) {
  const { me, activity } = v;
  const now = Date.now();
  // Haunted House bookings can't be changed or cancelled (the routes refuse too)
  const active = me.live_status === 'booked' && changesAllowed(me.activity_id);
  const leader = me.is_leader && active;
  const beforeBookingClose = !activity?.booking_closes_at || now <= Date.parse(activity.booking_closes_at);
  const beforeCheckinClose = now <= Date.parse(me.checkin_closes_at);

  return {
    me: {
      id: me.id,
      code: me.code,
      full_name: me.full_name,
      is_leader: me.is_leader,
      status: me.live_status,
      checked_in_at: me.checked_in_at,
    },
    activity,
    round: { id: me.round_id, ...v.round },
    booking: { status: v.booking.status, notes: me.is_leader ? v.booking.notes : undefined },
    // Cancelled / removed teammates drop off the list; you always see yourself.
    // Teammates come back as name + status only, never their codes, emails or phones.
    team: v.team
      .filter((p) => p.id === me.id || ['booked', 'checked_in', 'released'].includes(p.live_status))
      .map((p) => ({ id: p.id, full_name: p.full_name, is_leader: p.is_leader, status: p.live_status, is_me: p.id === me.id })),
    // What the buttons may do right now. The SQL checks again.
    can: {
      change_round: leader && beforeBookingClose && now < Date.parse(me.checkin_opens_at),
      cancel_seat: active && beforeCheckinClose,
      cancel_team: leader && beforeCheckinClose,
      remove_member: leader && beforeCheckinClose,
    },
  };
}
