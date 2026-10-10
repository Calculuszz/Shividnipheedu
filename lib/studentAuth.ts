import { createHmac, timingSafeEqual } from 'crypto';
import type { NextResponse } from 'next/server';

// Who is logged in on the student side. Login (student ID + the email they registered
// with) sets a signed, httpOnly cookie; routes that act for a student read it here
// instead of trusting a student ID sent by the page.
export const STUDENT_COOKIE = 'student_session';
const SESSION_DAYS = 14;

function secret() {
  const s = process.env.STUDENT_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error('STUDENT_SESSION_SECRET (or ADMIN_SESSION_SECRET / SUPABASE_SERVICE_ROLE_KEY) is not set');
  return s;
}

// A different prefix from the staff cookie, so one can never be passed off as the other
const sign = (payload: string) => createHmac('sha256', secret()).update(`student:${payload}`).digest('base64url');

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Emails are compared the way people type them: case and spaces don't matter */
export const sameEmail = (a: string | null | undefined, b: string | null | undefined) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

export function setStudentSession(res: NextResponse, studentId: string) {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${studentId}:${expires}`;
  res.cookies.set(STUDENT_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearStudentSession(res: NextResponse) {
  res.cookies.set(STUDENT_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
}

/** The logged-in student's ID, or null for no / expired / tampered session. */
export function sessionStudent(request: Request): string | null {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${STUDENT_COOKIE}=([^;]+)`));
  if (!match) return null;
  const [payload, signature] = decodeURIComponent(match[1]).split('.');
  if (!payload || !signature || !same(signature, sign(payload))) return null;
  const [studentId, expires] = payload.split(':');
  if (!/^[0-9A-Za-z]{1,20}$/.test(studentId) || !(Number(expires) > Date.now())) return null;
  return studentId;
}
