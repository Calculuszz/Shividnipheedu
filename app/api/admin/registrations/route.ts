import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest, unauthorized } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

// GET ?mode=page&page=1&search=663   -> one page + counts for the attendance table
// GET ?mode=all                      -> every row (Excel export)
// GET ?mode=recent                   -> last 20 check-ins (scanner sidebar)
export async function GET(request: Request) {
  if (!isAdminRequest(request, 'registration')) return unauthorized();

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') || 'page';

  try {
    if (mode === 'recent') {
      const { data, error } = await supabaseAdmin
        .from('registrations')
        .select('*')
        .eq('attended', true)
        .order('attended_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return NextResponse.json({ rows: data || [] });
    }

    if (mode === 'all') {
      // Supabase caps each request at 1000 rows, so page through everything
      const pageSize = 1000;
      const rows: Record<string, unknown>[] = [];
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabaseAdmin
          .from('registrations')
          .select('*')
          .order('created_at', { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        rows.push(...(data || []));
        if (!data || data.length < pageSize) break;
      }
      return NextResponse.json({ rows });
    }

    const search = (url.searchParams.get('search') || '').trim();
    const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize')) || 50, 1), 200);
    const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);
    const filtered = (q: any) => (search ? q.ilike('student_id', `%${search}%`) : q);

    const [total, checkedIn, played] = await Promise.all([
      filtered(supabaseAdmin.from('registrations').select('*', { count: 'exact', head: true })),
      filtered(supabaseAdmin.from('registrations').select('*', { count: 'exact', head: true }).eq('attended', true)),
      filtered(supabaseAdmin.from('registrations').select('*', { count: 'exact', head: true }).not('ghost_result', 'is', null)),
    ]);
    if (total.error) throw total.error;

    const from = (page - 1) * pageSize;
    const { data, error } = await filtered(supabaseAdmin.from('registrations').select('*'))
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;

    return NextResponse.json({
      rows: data || [],
      total: total.count || 0,
      checkedIn: checkedIn.count || 0,
      played: played.count || 0,
    });
  } catch (error) {
    console.error('Admin registrations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH { id, attended } -> manual check-in toggle from the table
export async function PATCH(request: Request) {
  if (!isAdminRequest(request, 'registration')) return unauthorized();

  try {
    const { id, attended } = await request.json();
    if (!id || typeof attended !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from('registrations')
      .update({ attended, attended_at: attended ? new Date().toISOString() : null })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, row: data });
  } catch (error) {
    console.error('Admin attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
