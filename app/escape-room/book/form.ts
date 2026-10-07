import { isEmail, isStudentId } from '@/lib/bookingRules';
import { errorMessage } from '@/lib/bookingText';
import type { PlayerInput } from '@/lib/bookingTypes';

export type Player = PlayerInput & { key: number };
export type Field = 'full_name' | 'student_id' | 'phone' | 'email' | 'pdpa' | 'rules';
export type SidStatus = 'checking' | 'free' | 'taken' | 'failed';
/** message = under the field, reason = in the summary box */
export type Issue = { message: string; reason?: string };
export type Issues = Partial<Record<Field, Issue>>;

const EMPTY = 'ว่าง';

export const FIELDS: Field[] = ['full_name', 'student_id', 'phone', 'email', 'pdpa', 'rules'];

export const isComplete = (issues: Issues) => Object.keys(issues).length === 0;

const SUMMARY_LABEL: Record<Field, string> = {
  full_name: 'ชื่อ',
  student_id: 'รหัสนิสิต',
  phone: 'เบอร์โทร',
  email: 'อีเมล',
  pdpa: 'PDPA ',
  rules: 'การรับทราบกฎ',
};

export const emptyPlayer = (key: number, student_id = ''): Player => ({
  key,
  student_id,
  full_name: '',
  phone: '',
  email: '',
  pdpa: false,
  rules: false,
});

const isPhone = (v: string) => /^(\+66|0)\d{8,9}$/.test(v.replace(/[\s-]/g, ''));

export function duplicateOf(players: Player[], index: number) {
  const sid = players[index].student_id;
  return sid ? players.findIndex((p, i) => i < index && p.student_id === sid) : -1;
}

export function playerIssues(players: Player[], index: number, sidStatus: Record<string, SidStatus>): Issues {
  const p = players[index];
  const issues: Issues = {};

  if (!p.full_name.trim()) issues.full_name = { message: 'กรุณากรอกชื่อ-นามสกุล', reason: EMPTY };

  const dup = duplicateOf(players, index);
  if (!p.student_id) issues.student_id = { message: 'กรุณากรอกรหัสนิสิต', reason: EMPTY };
  else if (!isStudentId(p.student_id)) issues.student_id = { message: errorMessage('INVALID_STUDENT_ID'), reason: 'ไม่ครบ 10 หลัก' };
  else if (dup >= 0) issues.student_id = { message: `รหัสนิสิตซ้ำกับผู้เล่นคนที่ ${dup + 1}`, reason: `ซ้ำกับคนที่ ${dup + 1}` };
  else if (sidStatus[p.student_id] === 'taken') issues.student_id = { message: errorMessage('ALREADY_BOOKED'), reason: 'มีการจองอยู่แล้ว' };

  if (!p.phone.trim()) issues.phone = { message: 'กรุณากรอกเบอร์โทร', reason: EMPTY };
  else if (!isPhone(p.phone)) issues.phone = { message: 'เบอร์โทรไม่ถูกต้อง', reason: 'ไม่ถูกต้อง' };

  if (!p.email.trim()) issues.email = { message: 'กรุณากรอกอีเมล', reason: EMPTY };
  else if (!isEmail(p.email)) issues.email = { message: 'อีเมลไม่ถูกต้อง', reason: 'ไม่ถูกต้อง' };

  if (!p.pdpa) issues.pdpa = { message: 'กรุณายอมรับเงื่อนไข PDPA ของผู้เล่นคนนี้' };
  if (!p.rules) issues.rules = { message: 'กรุณารับทราบกฎของห้องและคำเตือนด้านสุขภาพ' };
  return issues;
}

export function summarize(all: Issues[]) {
  const items = all.flatMap((issues, i) =>
    // Untouched card = one item, not six
    FIELDS.every((f) => issues[f] && (issues[f].reason ?? EMPTY) === EMPTY)
      ? [`ข้อมูลของผู้เล่นคนที่ ${i + 1} (ยังไม่ได้กรอก)`]
      : FIELDS.filter((f) => issues[f]).map((f) => {
          const reason = issues[f]!.reason;
          return `${SUMMARY_LABEL[f]}ของผู้เล่นคนที่ ${i + 1}${reason ? ` (${reason})` : ''}`;
        })
  );
  const text = items.length > 1 ? `${items.slice(0, -1).join(', ')} และ${items.at(-1)}` : items[0];
  return { count: items.length, text };
}

export const toInput = (p: Player): PlayerInput => ({
  student_id: p.student_id,
  full_name: p.full_name.trim(),
  phone: p.phone.trim(),
  email: p.email.trim(),
  pdpa: true,
  rules: true,
});
