import { isEmail, isPhone, isStudentId, normalizePhone } from '@/lib/bookingRules';
import { errorMessage } from '@/lib/bookingText';
import type { PlayerInput } from '@/lib/bookingTypes';

export type PlayerDraft = PlayerInput & {
  key: string;
  expanded: boolean;
  touched: Partial<Record<keyof PlayerInput, boolean>>;
  check: { sid: string; status: 'idle' | 'checking' | 'available' | 'blocked' | 'warning'; error?: string; warning?: string };
};
export type PlayerErrors = Partial<Record<keyof PlayerInput, string>>;

/** Fields in the order they sit on screen: the first one with a problem gets the focus */
export const FIELD_ORDER = [
  ['student_id', 'sid'], ['phone', 'phone'], ['email', 'email'],
] as const;

export function newPlayer(key: string, studentId = ''): PlayerDraft {
  return { key, student_id: studentId, full_name: '', phone: '', email: '', pdpa: false, rules: false,
    expanded: true, touched: {}, check: { sid: studentId, status: 'idle' } };
}

export function playerErrors(player: PlayerDraft, players: PlayerDraft[]): PlayerErrors {
  const errors: PlayerErrors = {};
  if (!player.student_id) errors.student_id = 'กรุณากรอกรหัสนิสิต';
  else if (!isStudentId(player.student_id)) errors.student_id = errorMessage('INVALID_STUDENT_ID');
  else {
    const index = players.findIndex(p => p.key === player.key);
    const duplicate = players.findIndex((p, i) => i < index && p.student_id === player.student_id);
    if (duplicate >= 0) errors.student_id = `รหัสนิสิตซ้ำกับผู้เล่นคนที่ ${duplicate + 1}`;
    else if (player.check.sid === player.student_id && player.check.error) errors.student_id = player.check.error;
  }
  if (!player.phone.trim()) errors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
  else if (!isPhone(player.phone)) errors.phone = 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง เช่น 0812345678 หรือ +66812345678';
  if (!isEmail(player.email.trim())) errors.email = 'กรุณากรอกอีเมลให้ถูกต้อง';
  return errors;
}

export function studentChecked(player: PlayerDraft) {
  return player.check.sid === player.student_id && player.check.status === 'available';
}

/** A failed advisory lookup may defer to /book, but never override a known blocker. */
export function studentCanSubmit(player: PlayerDraft) {
  return player.check.sid === player.student_id && !player.check.error &&
    (player.check.status === 'available' || player.check.status === 'warning');
}

export function playerComplete(player: PlayerDraft, players: PlayerDraft[]) {
  return Object.keys(playerErrors(player, players)).length === 0 && studentChecked(player);
}

export function toPlayerInput(player: PlayerDraft, consent: { pdpa: boolean; rules: boolean }): PlayerInput {
  // full_name: the server fills in each player's registered name
  return { student_id: player.student_id, full_name: '', phone: normalizePhone(player.phone),
    email: player.email.trim(), pdpa: consent.pdpa, rules: consent.rules };
}
