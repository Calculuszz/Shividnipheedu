import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { badRequest, readJson, serverError, str } from '@/lib/booking';
import { hit, underLimit } from '@/lib/rateLimit';
import { sessionStudent } from '@/lib/studentAuth';

// Per logged-in student, not per IP (campus Wi-Fi shares IPs). A team form checks up to
// 5 IDs and may re-check after edits; this still stops anyone sweeping through IDs.
const LIMIT = 60;
const WINDOW_MS = 60_000;

// POST { activity, student_id } -> { taken, registered } only. Never says which round.
// Logged-in students only: the rounds page and the booking form are behind login.
export async function POST(request: Request) {
  const me = sessionStudent(request);
  if (!me) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const key = `check-student:${me}`;
  if (!underLimit(key, LIMIT)) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  hit(key, WINDOW_MS);

  const body = await readJson(request);
  const activity = str(body.activity, 40);
  const studentId = str(body.student_id, 20);
  if (!/^[a-z_]{1,40}$/.test(activity)) return badRequest();
  if (!/^[0-9]{10}$/.test(studentId)) return badRequest('INVALID_STUDENT_ID');

  try {
    const [taken, reg] = await Promise.all([
      supabaseAdmin.rpc('booking_student_taken', { p_activity_id: activity, p_student_id: studentId }),
      supabaseAdmin.from('registrations').select('student_id').eq('student_id', studentId).maybeSingle(),
    ]);
    if (taken.error) throw taken.error;
    if (reg.error) throw reg.error;
    return NextResponse.json({ taken: taken.data === true, registered: !!reg.data });
  } catch (error) {
    console.error('Check student error:', error);
    return serverError();
  }
}
