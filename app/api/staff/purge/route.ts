import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { badRequest, forbidden, readJson, ruleError, serverError, staffActivity } from '@/lib/booking';

const CONFIRM = 'DELETE ALL BOOKINGS';

// POST { confirm: 'DELETE ALL BOOKINGS' } -> permanently delete every booking and walk-in
// of the staff group's activity (privacy policy: data deleted after the event).
// The database refuses (TOO_EARLY) until the activity's last round has ended.
// Export to Excel first: this cannot be undone.
export async function POST(request: Request) {
  const staff = staffActivity(request);
  if (!staff) return forbidden();

  if ((await readJson(request)).confirm !== CONFIRM) return badRequest('CONFIRM_REQUIRED');

  try {
    const { data, error } = await supabaseAdmin.rpc('booking_purge_activity', { p_activity_id: staff.activity });
    if (error) return ruleError(error, 'Purge');
    console.log(`Booking data purged for ${staff.activity}:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Purge error:', error);
    return serverError();
  }
}
