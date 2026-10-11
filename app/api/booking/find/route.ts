import { NextResponse } from 'next/server';
import { normalizeCode, readJson, serverError } from '@/lib/booking';
import { codeMissLimited, recordCodeMiss } from '@/lib/bookingCodeLimit';
import { loadBookingView, toMyBooking } from '@/lib/bookingView';

// POST { code, activity? } -> my booking (pages 1c, 5a, 5b, 5b′, 5d, 5g, 5h), in one Supabase call.
// Teammates come back as name + status only, never their codes, emails or phones.
export async function POST(request: Request) {
  if (codeMissLimited(request)) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

  const body = await readJson(request);
  const code = normalizeCode(body.code);
  try {
    const view = code ? await loadBookingView({ code }) : null;
    if (!view) {
      recordCodeMiss(request);
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    // Each activity's pages only open their own bookings
    if (typeof body.activity === 'string' && body.activity !== view.me.activity_id) {
      return NextResponse.json({ error: 'WRONG_ACTIVITY' }, { status: 404 });
    }
    return NextResponse.json(toMyBooking(view));
  } catch (error) {
    console.error('Find booking error:', error);
    return serverError();
  }
}
