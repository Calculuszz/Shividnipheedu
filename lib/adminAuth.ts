import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

// Signed, httpOnly admin session cookie. The browser never talks to the
// registrations table directly; admin API routes check this cookie instead.
export const ADMIN_COOKIE = 'admin_session';
const SESSION_HOURS = 12;

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error('ADMIN_SESSION_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is not set');
  return s;
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function createAdminSession() {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = String(expires);
  return { value: `${payload}.${sign(payload)}`, maxAge: SESSION_HOURS * 60 * 60 };
}

export function isAdminRequest(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  if (!match) return false;
  const [payload, signature] = decodeURIComponent(match[1]).split('.');
  if (!payload || !signature) return false;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  return Number(payload) > Date.now();
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
