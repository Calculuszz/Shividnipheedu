import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { readJson, serverError, str } from '@/lib/booking';
import { sessionStudent } from '@/lib/studentAuth';

// POST { activity } -> { code } of the logged-in student's own booking, or 404.
// Lets My booking open on a new phone, or for a teammate the leader booked, without
// digging the code out of the confirmation email.
export async function POST(request: Request) {
  const me = sessionStudent(request);
  if (!me) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await readJson(request);
  const activity = str(body.activity, 40);
  if (!/^[a-z_]{1,40}$/.test(activity)) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });

  try {
    const { data, error } = await supabaseAdmin
      .from('booking_players')
      .select('code')
      .eq('student_id', me)
      .eq('activity_id', activity)
      .in('status', ['booked', 'checked_in'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ code: data.code });
  } catch (error) {
    console.error('My booking code error:', error);
    return serverError();
  }
}
