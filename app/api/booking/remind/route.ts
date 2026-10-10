import { timingSafeEqual } from 'node:crypto';
import { NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkinReminder, roundInfo, sendAll, type RoundInfo } from '@/lib/bookingEmail';

export const dynamic = 'force-dynamic';

// How long before a round's check-in (registration) opens its players get the reminder
const LEAD = '10 minutes';

function fromCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get('authorization') ?? '';
  if (!secret) return false;
  const want = Buffer.from(`Bearer ${secret}`);
  const got = Buffer.from(given);
  return got.length === want.length && timingSafeEqual(got, want);
}

// POST (from the database's pg_cron, every minute on event day; see supabase/reminders.sql)
// -> claims everyone whose check-in opens within LEAD and emails them, each person once.
// Answers straight away and sends after: the cron call doesn't wait on Gmail.
export async function POST(request: Request) {
  if (!fromCron(request)) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { data, error } = await supabaseAdmin.rpc('booking_claim_reminders', { p_lead: LEAD, p_limit: 100 });
  if (error) {
    console.error('Claim reminders error:', error);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
  const people = (data ?? []) as { full_name: string; email: string; code: string; round_id: string }[];

  after(async () => {
    const rounds = new Map<string, RoundInfo | null>();
    for (const p of people) if (!rounds.has(p.round_id)) rounds.set(p.round_id, await roundInfo(p.round_id));
    await sendAll(
      people.flatMap((p) => {
        const r = rounds.get(p.round_id);
        return r ? [checkinReminder(p, r)] : [];
      })
    );
  });

  return NextResponse.json({ claimed: people.length });
}
