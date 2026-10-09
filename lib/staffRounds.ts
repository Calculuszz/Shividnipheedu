import { errorMessage } from '@/lib/bookingText';
import { formatTime } from '@/lib/bookingTime';
import type { StaffRound } from '@/lib/bookingTypes';

// What staff at the booth need to know about a round, worked out from the server-synced clock.

export type RoundPhase = 'closed' | 'upcoming' | 'checkin' | 'waiting_start' | 'playing' | 'ended';

export function roundPhase(r: StaffRound, now: number): RoundPhase {
  if (r.closed) return 'closed';
  if (now >= Date.parse(r.ends_at)) return 'ended';
  if (now >= Date.parse(r.starts_at)) return 'playing';
  if (now > Date.parse(r.checkin_closes_at)) return 'waiting_start';
  if (now >= Date.parse(r.checkin_opens_at)) return 'checkin';
  return 'upcoming';
}

export const roundName = (r: Pick<StaffRound, 'round_no'>) => `รอบที่ ${r.round_no}`;

/** Short status for a chip: "เช็กอินถึง 17:10", "กำลังเล่น", "ปิดรอบ" … */
export function phaseLabel(r: StaffRound, now: number) {
  switch (roundPhase(r, now)) {
    case 'closed':
      return 'ปิดรอบ';
    case 'ended':
      return 'จบแล้ว';
    case 'playing':
      return 'กำลังเล่น';
    case 'waiting_start':
      return `เริ่มเล่น ${formatTime(r.starts_at)}`;
    case 'checkin':
      return `เช็กอินถึง ${formatTime(r.checkin_closes_at)}`;
    default:
      return `เปิดเช็กอิน ${formatTime(r.checkin_opens_at)}`;
  }
}

/** Tailwind classes for that chip */
export function phaseChip(r: StaffRound, now: number) {
  switch (roundPhase(r, now)) {
    case 'closed':
      return 'bg-halloween-error/15 text-halloween-error';
    case 'ended':
      return 'bg-transparent text-halloween-gray border border-halloween-gray/50';
    case 'playing':
      return 'bg-halloween-orange text-halloween-dark';
    case 'checkin':
      return 'bg-halloween-moon text-halloween-dark';
    default:
      return 'bg-halloween-purple/70 text-halloween-cream';
  }
}

/** Booked online but neither checked in nor released yet */
export const notArrived = (r: StaffRound) => Math.max(r.online_taken - r.checked_in - r.released, 0);

/** The round whose check-in is open now, else the next one to open, else the last one. */
export function focusRound(rounds: StaffRound[], now: number) {
  const open = rounds.filter((r) => !r.closed);
  return (
    open.find((r) => roundPhase(r, now) === 'checkin') ??
    open.find((r) => roundPhase(r, now) === 'upcoming') ??
    open.find((r) => roundPhase(r, now) !== 'ended') ??
    rounds[rounds.length - 1] ??
    null
  );
}

/** Minutes left as "6 นาที" / "1 ชม. 5 นาที" */
export function minutesText(ms: number) {
  const min = Math.max(Math.ceil(ms / 60_000), 0);
  if (min < 60) return `${min} นาที`;
  const h = Math.floor(min / 60);
  return min % 60 ? `${h} ชม. ${min % 60} นาที` : `${h} ชม.`;
}

/** "6631•••221" */
export const maskId = (id: string) => (id.length >= 7 ? `${id.slice(0, 4)}•••${id.slice(-3)}` : id);

/**
 * Scan / check-in results in staff words: what happened, then what to do next.
 * (errorMessage() is written for students.)
 */
export function staffCheckinError(code: string): { title: string; action: string; walkin?: boolean; warn?: boolean } {
  switch (code) {
    case 'ALREADY_CHECKED_IN':
      return { title: 'เช็กอินแล้ว', action: 'คนนี้เช็กอินไปแล้ว ไม่ต้องทำอะไรเพิ่ม ให้รอหน้าห้อง', warn: true };
    case 'CHECKIN_NOT_OPEN':
      return { title: 'ยังไม่ถึงเวลาเช็กอินของรอบนี้', action: 'บอกให้กลับมาตอนเปิดเช็กอินของรอบตัวเอง', warn: true };
    case 'CHECKIN_CLOSED':
      return {
        title: 'เลยเวลาเช็กอินแล้ว',
        action: 'ที่นั่งถูกปล่อยไปแล้ว ถ้ายังอยากเล่น ให้ลง walk-in (ได้ถ้ามีที่ว่าง)',
        walkin: true,
      };
    case 'NOT_FOUND':
      return {
        title: 'ไม่พบการจองจาก QR นี้',
        action: 'อาจยกเลิกไปแล้ว หรือเอา QR ลงทะเบียนงานมาสแกน ให้ค้นหาด้วยชื่อแทน',
      };
    default:
      return { title: 'เช็กอินไม่สำเร็จ', action: errorMessage(code) };
  }
}
