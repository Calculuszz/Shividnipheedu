import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { badRequest, forbidden, roundInActivity, serverError, staffActivity } from '@/lib/booking';

export const dynamic = 'force-dynamic';

// Staff see phone numbers (to call people near check-in close) and team notes,
// but never personal codes.
const PLAYER_FIELDS =
  'id, booking_id, round_id, round_no, position, is_leader, student_id, full_name, phone, live_status, checked_in_at, checkin_opens_at, checkin_closes_at';

// GET ?round=<id>  -> that round's players (waiting / checked in / released), walk-ins and seat numbers
// GET ?q=6631 | ?q=name -> search players of the whole activity for manual check-in
export async function GET(request: Request) {
  const staff = staffActivity(request);
  if (!staff) return forbidden();

  const url = new URL(request.url);
  const roundId = url.searchParams.get('round');
  // Letters, digits, spaces and dots only (no % or _ wildcards from the search box)
  const q = (url.searchParams.get('q') ?? '').replace(/[^\p{L}\p{N}\p{M} .]/gu, '').trim().slice(0, 60);

  try {
    if (q) {
      const base = supabaseAdmin
        .from('booking_players_live')
        .select(PLAYER_FIELDS)
        .eq('activity_id', staff.activity)
        .in('status', ['booked', 'checked_in']);
      const { data, error } = await (/^[0-9]+$/.test(q) ? base.like('student_id', `${q}%`) : base.ilike('full_name', `%${q}%`))
        .order('round_no')
        .limit(30);
      if (error) throw error;
      return NextResponse.json({ players: data ?? [] });
    }

    if (!(await roundInActivity(roundId, staff.activity))) return badRequest();

    const [round, players, walkins] = await Promise.all([
      supabaseAdmin.from('booking_round_availability').select('*').eq('id', roundId!).single(),
      supabaseAdmin
        .from('booking_players_live')
        .select(PLAYER_FIELDS)
        .eq('round_id', roundId!)
        .in('status', ['booked', 'checked_in'])
        .order('booking_id')
        .order('position'),
      supabaseAdmin
        .from('booking_walkins')
        .select('id, queue_no, student_id, full_name, phone, status, created_at, checked_in_at')
        .eq('round_id', roundId!)
        .neq('status', 'left')
        .order('queue_no'),
    ]);
    if (round.error) throw round.error;
    if (players.error) throw players.error;
    if (walkins.error) throw walkins.error;

    const bookingIds = [...new Set((players.data ?? []).map((p) => p.booking_id))];
    const { data: notes, error: notesError } = bookingIds.length
      ? await supabaseAdmin.from('bookings').select('id, notes').in('id', bookingIds).not('notes', 'is', null)
      : { data: [], error: null };
    if (notesError) throw notesError;

    return NextResponse.json({
      round: round.data,
      players: players.data ?? [],
      notes: Object.fromEntries((notes ?? []).map((n) => [n.id, n.notes])),
      walkins: walkins.data ?? [],
      now: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Staff attendance error:', error);
    return serverError();
  }
}
