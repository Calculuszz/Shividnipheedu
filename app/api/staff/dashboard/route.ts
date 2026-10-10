import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { forbidden, serverError, staffActivity } from '@/lib/booking';

export const dynamic = 'force-dynamic';

// GET -> every round of the staff group's activity with all seat numbers.
export async function GET(request: Request) {
  const staff = staffActivity(request);
  if (!staff) return forbidden();

  try {
    const { data, error } = await supabaseAdmin
      .from('booking_round_availability')
      .select('*')
      .eq('activity_id', staff.activity)
      .order('round_no');
    if (error) throw error;

    return NextResponse.json({ rounds: data ?? [], now: new Date().toISOString() });
  } catch (error) {
    console.error('Staff dashboard error:', error);
    return serverError();
  }
}
