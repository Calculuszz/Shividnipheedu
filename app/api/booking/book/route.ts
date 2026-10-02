import { NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { badRequest, isUuid, readJson, ruleError, serverError, str } from '@/lib/booking';
import { bookingConfirmed, roundInfo, sendAll } from '@/lib/bookingEmail';
import { clientIp, hit, underLimit } from '@/lib/rateLimit';

// Generous: a whole faculty may book from the same campus IP when booking opens.
const LIMIT = 30;
const WINDOW_MS = 60_000;

type BookedPlayer = { full_name: string; email: string; code: string; is_leader: boolean };

// POST { round_id, players: [{student_id, full_name, phone, email, pdpa, rules}], notes }
// First player is the leader. Seats, team size, duplicates and one-round-per-person
// are all checked inside booking_book_team under a lock on the round.
export async function POST(request: Request) {
  const key = `book:${clientIp(request)}`;
  if (!underLimit(key, LIMIT)) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  hit(key, WINDOW_MS);

  const body = await readJson(request);
  if (!isUuid(body.round_id) || !Array.isArray(body.players) || body.players.length === 0 || body.players.length > 20) {
    return badRequest();
  }

  const players = body.players.map((p) => {
    const x = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
    return {
      student_id: str(x.student_id, 20),
      full_name: str(x.full_name, 120),
      phone: str(x.phone, 30),
      email: str(x.email, 200),
      pdpa: x.pdpa === true,
      rules: x.rules === true,
    };
  });

  try {
    const { data, error } = await supabaseAdmin.rpc('booking_book_team', {
      p_round_id: body.round_id,
      p_players: players,
      p_notes: str(body.notes, 500) || null,
    });
    if (error) return ruleError(error, 'Book');

    const result = data as { booking_id: string; round_id: string; players: BookedPlayer[] };
    const leader = result.players.find((p) => p.is_leader)!;

    after(async () => {
      const r = await roundInfo(result.round_id);
      if (r) await sendAll(result.players.map((p) => bookingConfirmed(p, r, p.is_leader)));
    });

    // Only the leader's own code comes back; members get theirs by email only.
    return NextResponse.json({
      booking_id: result.booking_id,
      round_id: result.round_id,
      code: leader.code,
      players: result.players.map((p) => ({ full_name: p.full_name, is_leader: p.is_leader })),
    });
  } catch (error) {
    console.error('Book error:', error);
    return serverError();
  }
}
