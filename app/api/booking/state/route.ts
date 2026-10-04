import { NextResponse } from 'next/server';
import { bookingState, getActivity, intervalMinutes, serverError } from '@/lib/booking';

export const dynamic = 'force-dynamic';

// GET ?activity=escape_room -> which landing to show (1d / 1 / 1b) plus the activity's
// rules and text. Pages read numbers from here, never hardcode them.
export async function GET(request: Request) {
  try {
    const a = await getActivity(new URL(request.url).searchParams.get('activity'));
    if (!a) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    return NextResponse.json({
      state: bookingState(a),
      now: new Date().toISOString(),
      activity: {
        id: a.id,
        name: a.name,
        room_name: a.room_name,
        details_md: a.details_md,
        rules_md: a.rules_md,
        health_notice: a.health_notice,
        team_min: a.team_min,
        team_max: a.team_max,
        // Default seats per round (a round can override them; /api/booking/rounds has the real cap).
        // Landing shows online + walk-in, e.g. 12 + 3 = 15 players / round.
        online_seats: a.online_seats,
        walkin_seats: a.walkin_seats,
        checkin_opens_before_min: intervalMinutes(a.checkin_opens_before),
        checkin_duration_min: intervalMinutes(a.checkin_duration),
        booking_opens_at: a.booking_opens_at,
        booking_closes_at: a.booking_closes_at,
      },
    });
  } catch (error) {
    console.error('Booking state error:', error);
    return serverError();
  }
}
