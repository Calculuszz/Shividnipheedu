import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { booByName } from '@/app/what-ghost/quiz';
import { sessionStudent } from '@/lib/studentAuth';

export async function POST(request: Request) {
  try {
    // Only your own result: the student comes from the login session, not the request
    const studentId = sessionStudent(request);
    if (!studentId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const body = await request.json();
    const { ghostResult } = body;

    if (!ghostResult) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Only the four Pick a boo results can be saved
    if (!booByName(ghostResult)) {
      return NextResponse.json({ error: 'Unknown result' }, { status: 400 });
    }

    // Update the user's ghost result
    const { error } = await supabase
      .from('registrations')
      .update({ ghost_result: ghostResult })
      .eq('student_id', studentId)
      .select('student_id')
      .single();

    if (error) {
      console.error('Error saving ghost result:', error);
      return NextResponse.json(
        { error: 'Failed to save ghost result' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save ghost result error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
