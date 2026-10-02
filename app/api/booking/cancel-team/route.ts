import { NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { badRequest, normalizeCode, readJson, ruleError, serverError } from '@/lib/booking';
import { newLeader, roundInfo, sendAll, teamCancelled } from '@/lib/bookingEmail';
import { codeMiss, codeMissLimited } from '@/lib/bookingCodeLimit';

type Contact = { id: string; full_name: string; email: string };

// POST { code } -> leader cancels everyone who hasn't checked in (page 5c).
export async function POST(request: Request) {
  if (codeMissLimited(request)) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

  const code = normalizeCode((await readJson(request)).code);
  if (!code) return badRequest();

  try {
    const { data, error } = await supabaseAdmin.rpc('booking_cancel_team', { p_leader_code: code });
    if (error) {
      codeMiss(request, error);
      return ruleError(error, 'Cancel team');
    }

    const result = data as {
      round_id: string;
      cancelled: number;
      players: { full_name: string; email: string }[];
      new_leader: Contact | null;
    };
    after(async () => {
      const r = await roundInfo(result.round_id);
      if (!r) return;
      await sendAll([
        ...result.players.map((p) => teamCancelled(p, r)),
        // Someone already checked in is left holding the team
        ...(result.new_leader ? [newLeader(result.new_leader, r)] : []),
      ]);
    });

    return NextResponse.json({ cancelled: result.cancelled });
  } catch (error) {
    console.error('Cancel team error:', error);
    return serverError();
  }
}
