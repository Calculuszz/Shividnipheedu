import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { clientIp, hit, underLimit } from '@/lib/rateLimit';

// Only what the student pages use (menu, my ticket, ghost quiz) - never email etc.
const PUBLIC_FIELDS = 'student_id, full_name, qr_code, attended, attended_at, ghost_result';

// Only wrong IDs count, so a whole faculty on the same campus Wi-Fi can still log in
// while someone looping through student IDs gets stopped quickly.
const MISS_LIMIT = 20;
const MISS_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  try {
    const missKey = `login-miss:${clientIp(request)}`;
    if (!underLimit(missKey, MISS_LIMIT)) {
      return NextResponse.json(
        { error: 'ลองหลายครั้งเกินไป รอสักครู่แล้วลองใหม่นะ' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const studentId = String(body?.studentId ?? '').trim();

    // Find user by student ID
    const { data, error } = studentId
      ? await supabase
          .from('registrations')
          .select(PUBLIC_FIELDS)
          .eq('student_id', studentId)
          .maybeSingle()
      : { data: null, error: null };

    if (error) throw error;

    if (!data) {
      hit(missKey, MISS_WINDOW_MS);
      return NextResponse.json(
        { error: 'ไม่พบรหัสนิสิตนี้ในระบบ' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
