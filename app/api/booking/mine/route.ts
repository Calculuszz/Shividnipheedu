import { NextResponse } from 'next/server';
import { readJson, serverError, str } from '@/lib/booking';
import { sessionStudent } from '@/lib/studentAuth';
import { loadBookingView, toMyBooking } from '@/lib/bookingView';

// POST { activity } -> { code, booking } for the logged-in student's own booking, or 404.
// Opens My booking on a new phone, or for a teammate the leader booked for, in one call.
export async function POST(request: Request) {
  const me = sessionStudent(request);
  if (!me) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await readJson(request);
  const activity = str(body.activity, 40);
  if (!/^[a-z_]{1,40}$/.test(activity)) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });

  try {
    const view = await loadBookingView({ studentId: me, activity });
    if (!view) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ code: view.me.code, booking: toMyBooking(view) });
  } catch (error) {
    console.error('My booking error:', error);
    return serverError();
  }
}
