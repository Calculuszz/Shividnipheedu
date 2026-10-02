import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  STAFF_HOME,
  createAdminSession,
  hasConfiguredPasswords,
  roleForPassword,
  staffRole,
} from '@/lib/adminAuth';
import { clientIp, hit, underLimit } from '@/lib/rateLimit';

const MISS_LIMIT = 10;
const MISS_WINDOW_MS = 60_000;

// POST { password } -> { success, role, home }. The password decides the staff group.
export async function POST(request: Request) {
  try {
    if (!hasConfiguredPasswords()) {
      console.error('No ADMIN_PASSWORD* variables are set');
      return NextResponse.json({ success: false, error: 'Admin login is not configured' }, { status: 500 });
    }

    const missKey = `admin-miss:${clientIp(request)}`;
    if (!underLimit(missKey, MISS_LIMIT)) {
      return NextResponse.json({ success: false, error: 'Too many attempts' }, { status: 429 });
    }

    const { password } = await request.json();
    const role = roleForPassword(String(password ?? ''));
    if (!role) {
      hit(missKey, MISS_WINDOW_MS);
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }

    const session = createAdminSession(role);
    const response = NextResponse.json({ success: true, role, home: STAFF_HOME[role] });
    response.cookies.set(ADMIN_COOKIE, session.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: session.maxAge,
    });
    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET -> { role, home } for the current session, so group pages can check who is in.
export async function GET(request: Request) {
  const role = staffRole(request);
  if (!role) return NextResponse.json({ role: null }, { status: 401 });
  return NextResponse.json({ role, home: STAFF_HOME[role] });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
