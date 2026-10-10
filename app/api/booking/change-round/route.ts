import { NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { badRequest, isUuid, normalizeCode, readJson, refuseFinalBooking, ruleError, serverError } from '@/lib/booking';
import { roundChanged, roundInfo, sendAll } from '@/lib/bookingEmail';
import { codeMiss, codeMissLimited } from '@/lib/bookingCodeLimit';

// POST { code, round_id } -> leader moves the whole team (page 5b, and 3c is client-only).
export async function POST(request: Request) {
  if (codeMissLimited(request)) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

  const body = await readJson(request);
  const code = normalizeCode(body.code);
  if (!code || !isUuid(body.round_id)) return badRequest();

  try {
    const final = await refuseFinalBooking(code);
    if (final) return final;
    const { data, error } = await supabaseAdmin.rpc('booking_change_round', {
      p_leader_code: code,
      p_new_round_id: body.round_id,
    });
    if (error) {
      codeMiss(request, error);
      return ruleError(error, 'Change round');
    }

    const result = data as { round_id: string; players: { full_name: string; email: string; code: string }[] };
    after(async () => {
      const r = await roundInfo(result.round_id);
      if (r) await sendAll(result.players.map((p) => roundChanged(p, r)));
    });
    return NextResponse.json({ round_id: result.round_id });
  } catch (error) {
    console.error('Change round error:', error);
    return serverError();
  }
}
