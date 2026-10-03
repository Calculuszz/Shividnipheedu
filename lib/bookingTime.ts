// Every time from the API is UTC. Show it in Thai time, whatever the phone's timezone is.
const TZ = 'Asia/Bangkok';

// Phones can be minutes off. /api/booking/state sends the server's clock, and
// countdowns use serverNow() so "check-in closes in 3 min" matches the booth.
let clockOffsetMs = 0;

export function syncServerClock(serverIso: string) {
  const server = Date.parse(serverIso);
  if (!Number.isNaN(server)) clockOffsetMs = server - Date.now();
}

export function serverNow() {
  return Date.now() + clockOffsetMs;
}

/** "17:50" */
export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
}

/** "17:50–18:10" */
export function formatTimeRange(startIso: string, endIso: string) {
  return `${formatTime(startIso)}–${formatTime(endIso)}`;
}

/** "Thu 22 Oct 2026" */
export function formatDateEn(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "พฤ. 22 ต.ค. 2569" */
export function formatDateTh(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "20 ต.ค. 23:59" (booking open / close times) */
export function formatDayTimeTh(iso: string) {
  const day = new Date(iso).toLocaleDateString('th-TH', { timeZone: TZ, day: 'numeric', month: 'short' });
  return `${day} ${formatTime(iso)}`;
}

/** Whole minutes from now until `iso` (negative once it has passed). */
export function minutesUntil(iso: string, now = serverNow()) {
  return Math.ceil((Date.parse(iso) - now) / 60_000);
}

/** "in 25 min" / "in 1 hr 5 min" / "in 14 days" / "now" */
export function formatCountdown(iso: string, now = serverNow()) {
  const min = minutesUntil(iso, now);
  if (min <= 0) return 'now';
  if (min < 60) return `in ${min} min`;
  if (min >= 48 * 60) return `in ${Math.floor(min / (24 * 60))} days`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `in ${h} hr ${m} min` : `in ${h} hr`;
}
