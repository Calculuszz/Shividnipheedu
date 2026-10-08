'use client';

import Link from 'next/link';
import { CheckField, LeaderBadge, TextField } from '@/components/booking';
import { bookingPaths, maskStudentId } from '@/lib/bookingRules';
import type { PlayerInput } from '@/lib/bookingTypes';
import { studentChecked, type PlayerDraft, type PlayerErrors } from './bookingFormModel';

type Props = {
  player: PlayerDraft; number: number; errors: PlayerErrors; disabled: boolean; canRemove: boolean;
  onChange: <K extends keyof PlayerInput>(field: K, value: PlayerInput[K]) => void;
  onBlur: (field: keyof PlayerInput) => void;
  onToggle: () => void; onRemove: () => void; onRetry: () => void;
};

export default function PlayerFields({ player, number, errors, disabled, canRemove, onChange, onBlur, onToggle, onRemove, onRetry }: Props) {
  const leader = number === 1;
  const complete = Object.keys(errors).length === 0 && studentChecked(player);
  const shown = (field: keyof PlayerInput) => player.touched[field] ? errors[field] : undefined;
  const hasError = Object.entries(errors).some(([field]) => player.touched[field as keyof PlayerInput]);
  const prefix = `player-${player.key}`;
  const paths = bookingPaths();

  return (
    <section id={prefix} aria-label={`Player ${number}`} className={`scroll-mt-4 hand-cut border-2 bg-halloween-charcoal p-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.45)] ${hasError ? 'border-halloween-error' : 'border-halloween-orange'}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${complete ? 'bg-halloween-moon text-halloween-dark' : 'bg-halloween-purple text-halloween-cream'}`}>{number}</span>
        <button type="button" onClick={onToggle} aria-expanded={player.expanded} aria-controls={`${prefix}-fields`}
          className="flex min-h-11 min-w-0 flex-1 flex-col items-start gap-1 text-left">
          <span className="flex flex-wrap items-center gap-1.5 text-[17px] font-bold">
            Player {number} {leader && <LeaderBadge />}
            {complete && <span className="rounded-[4px_9px_5px_8px] bg-halloween-moon px-2 py-0.5 text-[12px] text-halloween-dark">Complete</span>}
          </span>
          {!player.expanded && <span className="max-w-full break-words text-sm text-halloween-gray">{player.full_name || 'ยังไม่ได้กรอกชื่อ'}{player.student_id && ` · ${maskStudentId(player.student_id)}`}</span>}
        </button>
        {!leader && <button type="button" disabled={!canRemove || disabled} onClick={onRemove} aria-label={`Remove player ${number}`}
          className="min-h-11 px-1 text-sm font-bold text-halloween-error disabled:opacity-40">Remove</button>}
        <button type="button" onClick={onToggle} aria-label={`${player.expanded ? 'Collapse' : 'Expand'} player ${number}`}
          aria-expanded={player.expanded} aria-controls={`${prefix}-fields`} className="flex h-11 w-9 shrink-0 items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={player.expanded ? 'rotate-180' : ''}><path d="m5 9 7 7 7-7" /></svg>
        </button>
      </div>
      <div id={`${prefix}-fields`} hidden={!player.expanded}>
        <fieldset disabled={disabled} className="mt-3 flex min-w-0 flex-col gap-3 border-0 p-0">
          {leader && <p className="text-sm text-halloween-gray">คุณคือผู้จองและหัวหน้าทีม — ลบตัวเองออกจากฟอร์มไม่ได้</p>}
          <TextField id={`${prefix}-name`} label="Full name" required maxLength={120} autoComplete="name" value={player.full_name}
            onChange={e => onChange('full_name', e.target.value)} onBlur={() => onBlur('full_name')} error={shown('full_name')} />
          <TextField id={`${prefix}-sid`} label="Student ID" required inputMode="numeric" maxLength={10} mono readOnly={leader}
            value={player.student_id} onChange={e => onChange('student_id', e.target.value)} onBlur={() => onBlur('student_id')}
            error={shown('student_id')} hint={leader ? 'รหัสนิสิตหัวหน้าทีมจากขั้นตอนก่อนหน้า' : 'รหัสนิสิต 10 หลัก'} />
          <div aria-live="polite" className="text-sm text-halloween-gray">
            {player.check.status === 'checking' && 'กำลังตรวจสอบรหัสนิสิต…'}
            {player.check.warning && <p className="rounded-lg border border-halloween-orange bg-halloween-orange/10 p-3 text-halloween-cream">
              ตรวจสอบรหัสนิสิตไม่สำเร็จ: {player.check.warning}{' '}
              {player.check.error ? 'ยังต้องแก้ไขรหัสนิสิตที่มีปัญหาก่อนยืนยัน' : 'สามารถกดยืนยันได้ ระบบจะตรวจรหัสซ้ำอีกครั้งตอนจอง'}
            </p>}
            {(player.check.status === 'warning' || player.check.status === 'blocked') && <button type="button" disabled={disabled} onClick={onRetry} className="min-h-11 text-halloween-orange underline">ตรวจสอบรหัสนิสิตอีกครั้ง</button>}
          </div>
          <TextField id={`${prefix}-phone`} label="Phone" required type="tel" maxLength={30} autoComplete="tel" value={player.phone}
            onChange={e => onChange('phone', e.target.value)} onBlur={() => onBlur('phone')} error={shown('phone')} />
          <TextField id={`${prefix}-email`} label="Email" required type="email" maxLength={200} autoComplete="email" value={player.email}
            onChange={e => onChange('email', e.target.value)} onBlur={() => onBlur('email')} error={shown('email')} />
          <div className="flex flex-col gap-2 border-t border-dashed border-halloween-purple pt-3">
            <CheckField id={`${prefix}-pdpa`} checked={player.pdpa} onChange={v => onChange('pdpa', v)} error={shown('pdpa')}>
              ยินยอมให้เก็บและใช้ข้อมูลส่วนบุคคล (ชื่อ รหัสนิสิต เบอร์โทร อีเมล) เพื่อการจองและเช็กอินกิจกรรมนี้เท่านั้น ตาม{' '}
              <Link href={paths.privacy} target="_blank" rel="noopener noreferrer" className="font-bold text-halloween-orange underline">นโยบายความเป็นส่วนตัว</Link>
            </CheckField>
            <CheckField id={`${prefix}-rules`} checked={player.rules} onChange={v => onChange('rules', v)} error={shown('rules')}>
              รับทราบ<Link href={paths.rules} target="_blank" rel="noopener noreferrer" className="font-bold text-halloween-orange underline">กฎของห้อง</Link>และคำเตือนด้านสุขภาพแล้ว
            </CheckField>
          </div>
        </fieldset>
      </div>
    </section>
  );
}
