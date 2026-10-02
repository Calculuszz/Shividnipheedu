import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { badRequest, forbidden, readJson, roundInActivity, serverError, staffActivity, str } from '@/lib/booking';

const seatValue = (v: unknown) =>
  v === null ? null : Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 500 ? (v as number) : undefined;

// PATCH { round_id, closed?, closed_reason?, online_seats?, walkin_seats? }
// Close a round (e.g. staff break) or override its seats; null seats = back to the activity default.
// Booked players are never touched here: closing a round only stops new bookings.
export async function PATCH(request: Request) {
  const staff = staffActivity(request);
  if (!staff) return forbidden();

  const body = await readJson(request);
  const update: Record<string, unknown> = {};
  if (typeof body.closed === 'boolean') {
    update.closed = body.closed;
    update.closed_reason = body.closed ? str(body.closed_reason, 100) || null : null;
  }
  for (const field of ['online_seats', 'walkin_seats'] as const) {
    if (!(field in body)) continue;
    const v = seatValue(body[field]);
    if (v === undefined) return badRequest();
    update[field] = v;
  }
  if (Object.keys(update).length === 0) return badRequest();

  try {
    if (!(await roundInActivity(body.round_id, staff.activity))) return badRequest('ROUND_NOT_FOUND');
    const { data, error } = await supabaseAdmin
      .from('booking_rounds')
      .update(update)
      .eq('id', body.round_id as string)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ round: data });
  } catch (error) {
    console.error('Staff rounds error:', error);
    return serverError();
  }
}
