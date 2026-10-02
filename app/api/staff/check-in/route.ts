import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { badRequest, forbidden, isUuid, normalizeCode, readJson, ruleError, serverError, staffActivity } from '@/lib/booking';

// POST { code } (QR scan) or { player_id } (search result) -> check that one person in.
// Only inside the round's check-in window; 1 QR = 1 person.
export async function POST(request: Request) {
  const staff = staffActivity(request);
  if (!staff) return forbidden();

  const body = await readJson(request);
  let playerId = isUuid(body.player_id) ? body.player_id : null;

  try {
    if (!playerId) {
      const code = normalizeCode(body.code);
      if (!code) return badRequest('NOT_FOUND');
      const { data, error } = await supabaseAdmin
        .from('booking_players')
        .select('id')
        .eq('code', code)
        .eq('activity_id', staff.activity)
        .maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
      playerId = data.id;
    }

    const { data, error } = await supabaseAdmin.rpc('booking_check_in', {
      p_player_id: playerId,
      p_activity_id: staff.activity,
      p_staff: staff.role,
    });
    if (error) return ruleError(error, 'Staff check-in');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Staff check-in error:', error);
    return serverError();
  }
}
