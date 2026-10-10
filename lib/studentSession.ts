import { forgetAllBookings } from '@/lib/bookingStorage';

// Browser side of the student login. The server's cookie decides who is logged in;
// localStorage only keeps a copy of their name and ticket for the pages to show.

export type SessionUser = {
  student_id: string;
  full_name: string;
  qr_code: string;
  attended: boolean;
  attended_at: string | null;
  ghost_result: string | null;
};

function clearLocal() {
  try {
    localStorage.removeItem('studentId');
    localStorage.removeItem('userData');
    // The next person ticks the Haunted House rules for themselves
    sessionStorage.removeItem('haunted:rules-accepted');
    sessionStorage.removeItem('escape:rules-accepted');
  } catch {}
  forgetAllBookings();
}

/**
 * The logged-in student, fresh from the server, or null when there's no valid session
 * (also wipes this device's copy). A network error keeps the local copy: 'offline'.
 */
export async function checkSession(): Promise<SessionUser | null | 'offline'> {
  let res: Response;
  try {
    res = await fetch('/api/login', { credentials: 'same-origin', cache: 'no-store' });
  } catch {
    return 'offline';
  }
  if (res.status === 401) {
    clearLocal();
    return null;
  }
  if (!res.ok) return 'offline';
  const { user } = (await res.json()) as { user: SessionUser };
  try {
    localStorage.setItem('studentId', user.student_id);
    localStorage.setItem('userData', JSON.stringify(user));
  } catch {}
  return user;
}

/** Log out: the server cookie, this device's copy, and every booking it remembers. */
export async function logOut() {
  clearLocal();
  await fetch('/api/login', { method: 'DELETE', credentials: 'same-origin' }).catch(() => {});
}
