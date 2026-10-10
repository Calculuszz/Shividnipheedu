import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { clientIp, hit, underLimit } from '@/lib/rateLimit';
import { clearStudentSession, sameEmail, sessionStudent, setStudentSession } from '@/lib/studentAuth';

// Only what the student pages use (menu, my ticket, ghost quiz) - never email etc.
const PUBLIC_FIELDS = 'student_id, full_name, qr_code, attended, attended_at, ghost_result';

// Only wrong attempts count, so a whole faculty on the same campus Wi-Fi can still log in
// while someone looping through student IDs gets stopped quickly.
const MISS_LIMIT = 20;
const MISS_WINDOW_MS = 60_000;

// POST { studentId, email } -> log in: both must match the registration.
export async function POST(request: Request) {
  try {
    const missKey = `login-miss:${clientIp(request)}`;
    if (!underLimit(missKey, MISS_LIMIT)) {
      return NextResponse.json({ error: 'ลองหลายครั้งเกินไป รอสักครู่แล้วลองใหม่นะ' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const studentId = String(body?.studentId ?? '').trim();
    const email = String(body?.email ?? '').trim();

    const { data, error } =
      studentId && email
        ? await supabase.from('registrations').select(`${PUBLIC_FIELDS}, email`).eq('student_id', studentId).maybeSingle()
        : { data: null, error: null };
    if (error) throw error;

    // Same answer for an unknown ID and a wrong email: never confirm which part was right
    if (!data || !sameEmail(data.email, email)) {
      hit(missKey, MISS_WINDOW_MS);
      return NextResponse.json({ error: 'NO_MATCH' }, { status: 404 });
    }

    const { email: _email, ...user } = data;
    void _email;
    const res = NextResponse.json({ success: true, user });
    setStudentSession(res, user.student_id);
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET -> the logged-in student's fresh details (menu, my ticket), or 401.
export async function GET(request: Request) {
  const studentId = sessionStudent(request);
  if (!studentId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  try {
    const { data, error } = await supabase.from('registrations').select(PUBLIC_FIELDS).eq('student_id', studentId).maybeSingle();
    if (error) throw error;
    if (!data) {
      const res = NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
      clearStudentSession(res);
      return res;
    }
    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE -> log out
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  clearStudentSession(res);
  return res;
}
