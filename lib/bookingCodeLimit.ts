import { clientIp, hit, underLimit } from '@/lib/rateLimit';

// Personal codes are the only key to a booking, so every route that takes one
// shares a budget of wrong guesses per IP (with /api/booking/find).
const MISS_LIMIT = 20;
const MISS_WINDOW_MS = 60_000;

const key = (request: Request) => `find-miss:${clientIp(request)}`;

export function codeMissLimited(request: Request) {
  return !underLimit(key(request), MISS_LIMIT);
}

// Count the request as a miss when the code didn't match anything usable.
export function codeMiss(request: Request, error: { message?: string } | null) {
  const code = String(error?.message ?? '').split(':')[0];
  if (code === 'NOT_FOUND' || code === 'NOT_LEADER') hit(key(request), MISS_WINDOW_MS);
}

export function recordCodeMiss(request: Request) {
  hit(key(request), MISS_WINDOW_MS);
}
