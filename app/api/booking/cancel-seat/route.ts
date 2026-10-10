import { NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { badRequest, normalizeCode, readJson, refuseFinalBooking, ruleError, serverError } from '@/lib/booking';
import { memberCancelled, newLeader, roundInfo, seatCancelled, sendAll } from '@/lib/bookingEmail';
import { codeMiss, codeMissLimited } from '@/lib/bookingCodeLimit';

type Contact = { id: string; full_name: string; email: string };

// POST { code } -> anyone cancels their own seat (pages 5e, 5b′).
// If the leader leaves, the next player becomes leader and the team stays.
export async function POST(request: Request) {
  if (codeMissLimited(request)) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

  const code = normalizeCode((await readJson(request)).code);
  if (!code) return badRequest();

  try {
    const final = await refuseFinalBooking(code);
    if (final) return final;
    const { data, error } = await supabaseAdmin.rpc('booking_cancel_seat', { p_code: code });
    if (error) {
      codeMiss(request, error);
      return ruleError(error, 'Cancel seat');
    }

    const result = data as {
      round_id: string;
      was_leader: boolean;
      cancelled: { full_name: string; email: string };
      new_leader: Contact | null;
      leader: Contact | null;
    };
    after(async () => {
      const r = await roundInfo(result.round_id);
      if (!r) return;
      await sendAll([
        seatCancelled(result.cancelled, r),
        ...(result.new_leader ? [newLeader(result.new_leader, r)] : []),
        ...(result.leader ? [memberCancelled(result.leader, result.cancelled.full_name, r)] : []),
      ]);
    });

    return NextResponse.json({
      cancelled: true,
      new_leader: result.new_leader ? { id: result.new_leader.id, full_name: result.new_leader.full_name } : null,
    });
  } catch (error) {
    console.error('Cancel seat error:', error);
    return serverError();
  }
}
