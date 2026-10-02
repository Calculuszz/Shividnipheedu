import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { badRequest, forbidden, readJson, roundInActivity, ruleError, serverError, staffActivity } from '@/lib/booking';

// POST { round_id } -> call the next person in the walk-in queue into a free seat.
// Returns { walkin: null } when the queue is empty.
export async function POST(request: Request) {
  const staff = staffActivity(request);
  if (!staff) return forbidden();

  const body = await readJson(request);
  try {
    if (!(await roundInActivity(body.round_id, staff.activity))) return badRequest('ROUND_NOT_FOUND');

    const { data, error } = await supabaseAdmin.rpc('booking_call_next_walkin', { p_round_id: body.round_id });
    if (error) return ruleError(error, 'Call next walk-in');
    return NextResponse.json({ walkin: data ?? null });
  } catch (error) {
    console.error('Call next walk-in error:', error);
    return serverError();
  }
}
