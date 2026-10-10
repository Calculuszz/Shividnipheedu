import { NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { badRequest, isUuid, normalizeCode, readJson, refuseFinalBooking, ruleError, serverError } from '@/lib/booking';
import { removedFromTeam, roundInfo, sendAll } from '@/lib/bookingEmail';
import { codeMiss, codeMissLimited } from '@/lib/bookingCodeLimit';

// POST { code, player_id } -> leader removes one member (page 5f). player_id comes from /find's team list.
export async function POST(request: Request) {
  if (codeMissLimited(request)) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

  const body = await readJson(request);
  const code = normalizeCode(body.code);
  if (!code || !isUuid(body.player_id)) return badRequest();

  try {
    const final = await refuseFinalBooking(code);
    if (final) return final;
    const { data, error } = await supabaseAdmin.rpc('booking_remove_member', {
      p_leader_code: code,
      p_player_id: body.player_id,
    });
    if (error) {
      codeMiss(request, error);
      return ruleError(error, 'Remove member');
    }

    const result = data as { round_id: string; removed_id: string; removed: { full_name: string; email: string } };
    after(async () => {
      const r = await roundInfo(result.round_id);
      if (r) await sendAll([removedFromTeam(result.removed, r)]);
    });

    return NextResponse.json({ removed_id: result.removed_id });
  } catch (error) {
    console.error('Remove member error:', error);
    return serverError();
  }
}
