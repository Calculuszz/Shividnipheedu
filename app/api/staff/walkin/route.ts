import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { badRequest, forbidden, isUuid, readJson, roundInActivity, ruleError, serverError, staffActivity, str } from '@/lib/booking';

// POST { round_id, student_id, full_name, phone, nickname? } -> add a walk-in (nickname: Haunted House, required there).
// Seat free now = checked in straight away, otherwise queued. Someone who already
// booked, played or is queued is refused (a released booking doesn't count).
export async function POST(request: Request) {
  const staff = staffActivity(request);
  if (!staff) return forbidden();

  const body = await readJson(request);
  try {
    if (!(await roundInActivity(body.round_id, staff.activity))) return badRequest('ROUND_NOT_FOUND');
    const nickname = str(body.nickname, 40);
    if (staff.activity === 'haunted_house' && !nickname) return badRequest('INVALID_PLAYER');

    const { data, error } = await supabaseAdmin.rpc('booking_add_walkin', {
      p_round_id: body.round_id,
      p_student_id: str(body.student_id, 20),
      p_full_name: str(body.full_name, 120),
      p_phone: str(body.phone, 30),
      p_staff: staff.role,
    });
    if (error) return ruleError(error, 'Add walk-in');
    if (nickname && data?.walkin_id) {
      const { error: nickError } = await supabaseAdmin.from('booking_walkins').update({ nickname }).eq('id', data.walkin_id);
      if (nickError) console.error('Walk-in nickname error:', nickError);
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Add walk-in error:', error);
    return serverError();
  }
}

// PATCH { id } -> someone in the queue gave up (status 'left'), freeing their place in line.
export async function PATCH(request: Request) {
  const staff = staffActivity(request);
  if (!staff) return forbidden();

  const body = await readJson(request);
  if (!isUuid(body.id)) return badRequest();

  try {
    const { data, error } = await supabaseAdmin
      .from('booking_walkins')
      .update({ status: 'left' })
      .eq('id', body.id)
      .eq('activity_id', staff.activity)
      .eq('status', 'queued')
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ id: data.id, status: 'left' });
  } catch (error) {
    console.error('Walk-in leave error:', error);
    return serverError();
  }
}
