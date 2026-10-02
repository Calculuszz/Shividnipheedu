import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getActivity, normalizeCode, readJson, serverError } from '@/lib/booking';
import { codeMissLimited, recordCodeMiss } from '@/lib/bookingCodeLimit';

type LivePlayer = {
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

// POST { code } -> my booking (pages 1c, 5a, 5b, 5b′, 5d, 5g, 5h).
// Teammates come back as name + status only, never their codes, emails or phones.
export async function POST(request: Request) {
  if (codeMissLimited(request)) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

  const code = normalizeCode((await readJson(request)).code);
  try {
    const { data: me, error } = code
      ? await supabaseAdmin
          .from('booking_players_live')
          .select('id, booking_id, activity_id, round_id, is_leader, full_name, code, live_status, checked_in_at, checkin_opens_at, checkin_closes_at')
          .eq('code', code)
          .maybeSingle<LivePlayer>()
      : { data: null, error: null };
    if (error) throw error;
    if (!me) {
      recordCodeMiss(request);
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    const [team, round, booking, activity] = await Promise.all([
      supabaseAdmin
        .from('booking_players_live')
        .select('id, position, full_name, is_leader, live_status')
        .eq('booking_id', me.booking_id)
        .order('position'),
      supabaseAdmin
        .from('booking_round_times')
        .select('round_no, starts_at, ends_at, checkin_opens_at, checkin_closes_at')
        .eq('id', me.round_id)
        .single(),
      supabaseAdmin.from('bookings').select('status, notes').eq('id', me.booking_id).single(),
      getActivity(me.activity_id),
    ]);
    if (team.error) throw team.error;
    if (round.error) throw round.error;
    if (booking.error) throw booking.error;

    const now = Date.now();
    const active = me.live_status === 'booked';
    const leader = me.is_leader && active;
    const beforeBookingClose = !activity?.booking_closes_at || now <= Date.parse(activity.booking_closes_at);
    const beforeCheckinClose = now <= Date.parse(me.checkin_closes_at);

    return NextResponse.json({
      me: {
        id: me.id,
        code: me.code,
        full_name: me.full_name,
        is_leader: me.is_leader,
        status: me.live_status,
        checked_in_at: me.checked_in_at,
      },
      activity: activity && {
        id: activity.id,
        name: activity.name,
        room_name: activity.room_name,
        booking_closes_at: activity.booking_closes_at,
      },
      round: { id: me.round_id, ...round.data },
      booking: { status: booking.data.status, notes: me.is_leader ? booking.data.notes : undefined },
      // Cancelled / removed teammates drop off the list; you always see yourself.
      team: (team.data ?? [])
        .filter((p) => p.id === me.id || ['booked', 'checked_in', 'released'].includes(p.live_status))
        .map((p) => ({
          id: p.id,
          full_name: p.full_name,
          is_leader: p.is_leader,
          status: p.live_status,
          is_me: p.id === me.id,
        })),
      // What the buttons may do right now (pages 5g / 5h lock them). The SQL checks again.
      can: {
        change_round: leader && beforeBookingClose && now < Date.parse(me.checkin_opens_at),
        cancel_seat: active && beforeCheckinClose,
        cancel_team: leader && beforeCheckinClose,
        remove_member: leader && beforeCheckinClose,
      },
    });
  } catch (error) {
    console.error('Find booking error:', error);
    return serverError();
  }
}
