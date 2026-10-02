// Small in-memory limiter. Each server instance keeps its own counts, so it slows
// down a script guessing student IDs rather than being a hard guarantee.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function clientIp(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// True while `key` has used fewer than `limit` hits in the current window.
export function underLimit(key: string, limit: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) return true;
  return bucket.count < limit;
}

export function hit(key: string, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    bucket.count += 1;
  }
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
}
