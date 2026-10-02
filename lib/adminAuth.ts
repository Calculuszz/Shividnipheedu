import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

// Signed, httpOnly staff session cookie. The browser never talks to the database
// directly; staff API routes check this cookie instead.
export const ADMIN_COOKIE = 'admin_session';
const SESSION_HOURS = 12;

// Each staff group has its own password and only reaches its own pages and routes.
export const STAFF_ROLES = ['registration', 'escape_room', 'haunted_house'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

const PASSWORD_ENV: Record<StaffRole, string> = {
  registration: 'ADMIN_PASSWORD',
  escape_room: 'ADMIN_PASSWORD_ESCAPE_ROOM',
  haunted_house: 'ADMIN_PASSWORD_HAUNTED_HOUSE',
};

export const STAFF_HOME: Record<StaffRole, string> = {
  registration: '/admin',
  escape_room: '/admin/escape-room',
  haunted_house: '/admin/haunted-house',
};

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error('ADMIN_SESSION_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is not set');
  return s;
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function sameString(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function hasConfiguredPasswords() {
  return STAFF_ROLES.some((role) => process.env[PASSWORD_ENV[role]]);
}

// The group whose password this is, or null. Every group is compared so the
// response time doesn't hint at which one matched.
export function roleForPassword(password: string): StaffRole | null {
  let found: StaffRole | null = null;
  for (const role of STAFF_ROLES) {
    const expected = process.env[PASSWORD_ENV[role]];
    if (expected && sameString(password, expected) && !found) found = role;
  }
  return found;
}

export function createAdminSession(role: StaffRole) {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = `${role}:${expires}`;
  return { value: `${payload}.${sign(payload)}`, maxAge: SESSION_HOURS * 60 * 60 };
}

// The logged-in staff group, or null for no / expired / tampered session.
export function staffRole(request: Request): StaffRole | null {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  if (!match) return null;
  const [payload, signature] = decodeURIComponent(match[1]).split('.');
  if (!payload || !signature || !sameString(signature, sign(payload))) return null;
  const [role, expires] = payload.split(':');
  if (!STAFF_ROLES.includes(role as StaffRole) || !(Number(expires) > Date.now())) return null;
  return role as StaffRole;
}

export function isAdminRequest(request: Request, role: StaffRole) {
  return staffRole(request) === role;
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
