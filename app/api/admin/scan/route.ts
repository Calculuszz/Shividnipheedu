import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest, unauthorized } from '@/lib/adminAuth';

// POST { qr } -> { status: 'not_found' | 'already' | 'checked_in', row? }
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();

  try {
    const { qr } = await request.json();
    if (!qr || typeof qr !== 'string') {
      return NextResponse.json({ status: 'not_found' });
    }

    // Only flips rows that are not checked in yet, so two scanners can't double check-in
    const { data: updated, error } = await supabaseAdmin
      .from('registrations')
      .update({ attended: true, attended_at: new Date().toISOString() })
      .eq('qr_code', qr)
      .eq('attended', false)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (updated) return NextResponse.json({ status: 'checked_in', row: updated });

    const { data: existing, error: findError } = await supabaseAdmin
      .from('registrations')
      .select('*')
      .eq('qr_code', qr)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return NextResponse.json({ status: 'not_found' });
    return NextResponse.json({ status: 'already', row: existing });
  } catch (error) {
    console.error('Admin scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
