import { NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { forbidden, serverError, staffActivity } from '@/lib/booking';
import { roundInfo, sendAll, seatReleased, type RoundInfo } from '@/lib/bookingEmail';

export const dynamic = 'force-dynamic';

// GET -> every round of the staff group's activity with all seat numbers.
// The dashboard polls this every few seconds, so it also sends the "seat released"
// emails for anyone whose check-in just closed (each person is claimed once).
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

    after(sendReleasedEmails);
    return NextResponse.json({ rounds: data ?? [], now: new Date().toISOString() });
  } catch (error) {
    console.error('Staff dashboard error:', error);
    return serverError();
  }
}

async function sendReleasedEmails() {
  const { data, error } = await supabaseAdmin.rpc('booking_claim_released', { p_limit: 50 });
  if (error) {
    console.error('Claim released error:', error);
    return;
  }
  const people = (data ?? []) as { full_name: string; email: string; round_id: string }[];
  if (people.length === 0) return;

  const rounds = new Map<string, RoundInfo | null>();
  for (const p of people) if (!rounds.has(p.round_id)) rounds.set(p.round_id, await roundInfo(p.round_id));
  await sendAll(
    people.flatMap((p) => {
      const r = rounds.get(p.round_id);
      return r ? [seatReleased(p, r)] : [];
    })
  );
}
