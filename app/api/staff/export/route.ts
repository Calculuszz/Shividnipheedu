import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { forbidden, serverError, staffActivity } from '@/lib/booking';

export const dynamic = 'force-dynamic';

const PAGE = 1000;

// Supabase caps each request at 1000 rows, so page through everything
async function all(table: string, select: string, activity: string, order: string) {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(select)
      .eq('activity_id', activity)
      .order(order)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as unknown as Record<string, unknown>[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

// GET -> every booking row and walk-in of the activity, for the daily Excel backup
// (the admin page builds the .xlsx in the browser, like the registrations export).
export async function GET(request: Request) {
  const staff = staffActivity(request);
  if (!staff) return forbidden();

  try {
    const [players, walkins, bookings] = await Promise.all([
      all(
        'booking_players_live',
        'round_no, starts_at, booking_id, position, is_leader, student_id, full_name, phone, email, live_status, checked_in_at, checked_in_by, cancelled_at, created_at',
        staff.activity,
        'round_no'
      ),
      all('booking_walkins', 'round_id, queue_no, student_id, full_name, phone, status, created_at, checked_in_at', staff.activity, 'queue_no'),
      all('bookings', 'id, status, notes', staff.activity, 'created_at'),
    ]);
    const notes = new Map(bookings.map((b) => [b.id, b.notes]));
    return NextResponse.json({
      players: players.map((p) => ({ ...p, notes: notes.get(p.booking_id) ?? null })),
      walkins,
    });
  } catch (error) {
    console.error('Staff export error:', error);
    return serverError();
  }
}
