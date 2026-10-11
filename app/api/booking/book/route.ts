import { NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { badRequest, isUuid, readJson, ruleError, serverError, str } from '@/lib/booking';
import { bookingConfirmed, hauntedConfirmed, roundInfo, sendAll } from '@/lib/bookingEmail';
import { isEmail } from '@/lib/bookingRules';
import { FACULTIES, YEARS } from '@/lib/registrationOptions';
import { hit, underLimit } from '@/lib/rateLimit';
import { sessionStudent } from '@/lib/studentAuth';

// Counted per logged-in student, not per IP: the whole campus Wi-Fi shares a few IPs
// and everyone books at once when booking opens.
const LIMIT = 10;
const WINDOW_MS = 60_000;

type BookedPlayer = { full_name: string; email: string; code: string; is_leader: boolean };

// POST { round_id, players: [{student_id, full_name, phone, email, pdpa, rules}], notes }
// First player is the leader and must be the logged-in student; every player must be
// registered for the event. Seats, team size, duplicates and one-round-per-person
// are all checked inside booking_book_team under a lock on the round.
export async function POST(request: Request) {
  const me = sessionStudent(request);
  if (!me) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const key = `book:${me}`;
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
      nickname: str(x.nickname, 60),
      faculty: str(x.faculty, 120),
      year: str(x.year, 60),
    };
  });

  // You book for yourself: the leader (Haunted House: the only player) is whoever logged in
  if (players[0].student_id !== me) return NextResponse.json({ error: 'NOT_YOU' }, { status: 403 });

  try {
    // Chula students who registered for the event only
    const ids = players.map((p) => p.student_id);
    // Both lookups at once: one Supabase round trip instead of two before booking
    const [{ data: registered, error: regError }, { data: roundRow, error: roundError }] = await Promise.all([
      supabaseAdmin.from('registrations').select('student_id, full_name, email, department, year').in('student_id', ids),
      supabaseAdmin.from('booking_rounds').select('activity_id').eq('id', body.round_id as string).maybeSingle(),
    ]);
    if (regError) throw regError;
    if (roundError) throw roundError;
    const known = new Map((registered ?? []).map((r) => [r.student_id, r]));
    const missing = ids.find((id) => !known.has(id));
    if (missing) return NextResponse.json({ error: 'NOT_REGISTERED', detail: missing }, { status: 400 });

    // Staff check names against student cards at the booth, so every player goes in under
    // the real name they registered with, never a name typed on the booking form.
    for (const p of players) {
      const name = known.get(p.student_id)!.full_name?.trim();
      if (name) p.full_name = name.slice(0, 120);
    }

    // The Haunted House also needs nickname, faculty, year and a 10-digit phone.
    // The database checks what both activities share; these are checked here.
    const haunted = roundRow?.activity_id === 'haunted_house';
    if (haunted) {
      // The form only asks for nickname and phone: email, faculty and year are what
      // the student gave when registering for the event.
      for (const p of players) {
        const reg = known.get(p.student_id)!;
        // A broken registration email can't carry the ticket: the form then asks for one
        if (isEmail(reg.email ?? '')) p.email = reg.email!.trim();
        else if (!isEmail(p.email)) return NextResponse.json({ error: 'EMAIL_NEEDED' }, { status: 400 });
        p.faculty = reg.department || p.faculty;
        p.year = reg.year || p.year;
      }
    }
    if (
      haunted &&
      players.some(
        (p) =>
          !p.nickname ||
          !FACULTIES.includes(p.faculty) ||
          !YEARS.includes(p.year) ||
          !/^0[0-9]{9}$/.test(p.phone.replace(/[\s-]/g, ''))
      )
    ) {
      return badRequest('INVALID_PLAYER');
    }

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
      if (!r) return;
      await sendAll(result.players.map((p) => (haunted ? hauntedConfirmed(p, r) : bookingConfirmed(p, r, p.is_leader))));
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
