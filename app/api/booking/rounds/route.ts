import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { PUBLIC_ROUND_FIELDS, serverError } from '@/lib/booking';

export const dynamic = 'force-dynamic';

// GET ?activity=escape_room -> every round with seat counts and status (pages 2, 2b, 2c, 3c).
// Fetched when a page opens, on every + Add player and before Confirm. No names here.
export async function GET(request: Request) {
  const activity = new URL(request.url).searchParams.get('activity') ?? '';
  if (!/^[a-z_]{1,40}$/.test(activity)) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  try {
    const { data, error } = await supabaseAdmin
      .from('booking_round_availability')
      .select(PUBLIC_ROUND_FIELDS)
      .eq('activity_id', activity)
      .order('round_no');
    if (error) throw error;

    const rounds = ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
      ...r,
      // Staff can lower a round's seats below what is already booked
      online_left: Math.max(Number(r.online_left), 0),
      walkin_left: Math.max(Number(r.walkin_left), 0),
    }));
    return NextResponse.json({ rounds, updated_at: new Date().toISOString() });
  } catch (error) {
    console.error('Booking rounds error:', error);
    return serverError();
  }
}
