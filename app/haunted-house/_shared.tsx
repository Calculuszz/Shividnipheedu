/* eslint-disable @next/next/no-img-element */
'use client';

import { useSyncExternalStore } from 'react';
import Doodle, { type DoodleName } from '@/components/Doodle';
import type { RoundLabels } from '@/components/booking/RoundList';
import { bookingPaths } from '@/lib/bookingRules';
import type { ActivityInfo, Round } from '@/lib/bookingTypes';

// Haunted House pages: the Escape Room booking kit in the .theme-haunted colours
// (see layout.tsx). Copy below is the brief's own wording ("Event Brief Pre-event").

export const ACTIVITY = 'haunted_house';
export const paths = bookingPaths(ACTIVITY);

export const VENUE_BUILDING = 'อาคารวิศวฯ 100 ปี';
export const VENUE_FACULTY = 'คณะวิศวกรรมศาสตร์';
/** Where players register before their round */
export const REGISTER_POINT = 'ใต้อาคารวิศวฯ 100 ปี ฝั่งลิฟต์ปกติ';

export const ROUND_LABELS: RoundLabels = {
  round: (n) => `รอบที่ ${n}`,
  checkin: (range) => `ลงทะเบียนหน้างาน ${range}`,
};

export const BOOKING_RIGHTS = [
  'จองได้เฉพาะนิสิตจุฬาลงกรณ์มหาวิทยาลัยเท่านั้น',
  '1 คน จองได้ 1 สิทธิ์เท่านั้น',
  'จองแล้วเปลี่ยนรอบไม่ได้',
];

export const PLAY_RULES = ['ห้ามวิ่ง', 'ห้ามทำร้ายนักแสดง / Staff', 'ห้ามจับหรือทำลายพร็อพ', 'ห้ามเข้าเขต Staff Only'];

/** "ไม่แนะนำให้ผู้ที่มีอาการต่อไปนี้เล่น" */
export const HEALTH_WARNINGS: { icon: DoodleName; text: string }[] = [
  { icon: 'ghost', text: 'มีโรคหัวใจ หรือความดันผิดปกติ' },
  { icon: 'skull', text: 'มีอาการชัก หรือลมชัก' },
  { icon: 'bat', text: 'แพ้แสงกะพริบ หรือเสียงดัง' },
  { icon: 'potion', text: 'มีอาการเวียนหัว หน้ามืด หรือไม่สบาย' },
  { icon: 'moon', text: 'มีภาวะวิตกกังวล หรือกลัวที่มืดและแคบ' },
];

/** Minutes before play that registration opens and closes (15 and 10 in the brief) */
export function registerWindow(activity: Pick<ActivityInfo, 'checkin_opens_before_min' | 'checkin_duration_min'>) {
  const opens = activity.checkin_opens_before_min;
  return { opens, closes: opens - activity.checkin_duration_min };
}

export const playMinutes = (round?: Round) =>
  round ? Math.round((Date.parse(round.ends_at) - Date.parse(round.starts_at)) / 60_000) : null;

/** Big "HAUNTED HOUSE" with the site's bats and graveyard art */
export function Hero({ small = false }: { small?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <img src="/pick-a-boo/bats.webp" alt="" className={`${small ? 'w-24' : 'w-28'} h-auto opacity-90 doodle-shadow`} />
      <h1 className={`display-font ${small ? 'text-[46px]' : 'text-[56px]'} leading-[0.95] -rotate-3`}>
        <span className="block text-halloween-moon">HAUNTED</span>
        <span className="block text-halloween-orange [text-shadow:0_0_22px_rgba(229,56,59,0.45)]">HOUSE</span>
      </h1>
      <p className="text-[22px] font-bold text-halloween-moon -rotate-2">บ้านผีสิง</p>
      <img
        src="/pick-a-boo/graveyard.webp"
        alt=""
        className="mt-1 w-full max-w-[358px] h-auto [filter:drop-shadow(0_-6px_16px_rgba(229,56,59,0.35))]"
      />
    </div>
  );
}

export function HealthRows() {
  return (
    <>
      <span className="text-base">ไม่แนะนำให้ผู้ที่มีอาการต่อไปนี้เล่น</span>
      {HEALTH_WARNINGS.map(({ icon, text }) => (
        <div key={text} className="flex items-start gap-3.5">
          <Doodle name={icon} className="w-8 h-auto shrink-0" />
          <span className="text-base leading-relaxed">{text}</span>
        </div>
      ))}
    </>
  );
}

// ---- The logged-in student (the menu's login keeps them in localStorage) ----

export type Student = { student_id: string; full_name: string };

const noSubscription = () => () => {};
function readStudentRaw() {
  try {
    return localStorage.getItem('userData');
  } catch {
    return null;
  }
}

/** The student who logged in on this device, or null. undefined while rendering on the server. */
export function useStudent(): Student | null | undefined {
  const raw = useSyncExternalStore(noSubscription, readStudentRaw, () => undefined);
  if (raw === undefined) return undefined;
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<Student>;
    return data.student_id && data.full_name ? { student_id: String(data.student_id), full_name: String(data.full_name) } : null;
  } catch {
    return null;
  }
}

// The rules page has to be ticked before the form may send rules: true
const RULES_KEY = 'haunted:rules-accepted';
export function acceptRules() {
  try {
    sessionStorage.setItem(RULES_KEY, '1');
  } catch {
    // Private mode: the form asks again
  }
}
export function rulesAccepted() {
  try {
    return sessionStorage.getItem(RULES_KEY) === '1';
  } catch {
    return false;
  }
}
