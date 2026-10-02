import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { ADMIN_COOKIE, createAdminSession } from '@/lib/adminAuth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    // Server-side password check - password is NOT exposed to client
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD is not set');
      return NextResponse.json({ success: false, error: 'Admin login is not configured' }, { status: 500 });
    }

    const given = Buffer.from(String(password ?? ''));
    const expected = Buffer.from(adminPassword);
    const ok = given.length === expected.length && timingSafeEqual(given, expected);

    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    const session = createAdminSession();
    const response = NextResponse.json({ success: true });
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
