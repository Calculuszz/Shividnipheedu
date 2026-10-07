import Link from 'next/link';
import FieldError from '@/components/FieldError';
import Card from '@/components/booking/Card';
import { CheckField, TextField } from '@/components/booking/Fields';
import { LeaderBadge } from '@/components/booking/Status';
import { maskStudentId } from '@/lib/bookingRules';
import type { Field, Issues, Player } from './form';
import Icon from './Icon';

type Props = {
  player: Player;
  index: number;
  open: boolean;
  issues: Issues;
  /** Touched fields */
  shown: (field: Field) => boolean;
  checking: boolean;
  rulesHref: string;
  privacyHref: string;
  onChange: (patch: Partial<Player>) => void;
  onBlur: (field: Field) => void;
  onToggle: () => void;
  onRemove: () => void;
};

function Complete() {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-[4px_9px_5px_8px] border-[1.5px] border-halloween-moon bg-halloween-moon px-[9px] py-[3px] text-[13px] font-bold text-halloween-dark">
      Complete
    </span>
  );
}

function PlayerNo({ n, complete }: { n: number; complete: boolean }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${complete ? 'bg-halloween-moon text-halloween-dark' : 'bg-halloween-purple text-halloween-cream'}`}
    >
      {n}
    </span>
  );
}

const LINK = 'font-bold text-halloween-orange underline';

const hasShownError = (issues: Issues, shown: (field: Field) => boolean) => (Object.keys(issues) as Field[]).some(shown);

export default function PlayerCard({ player, index, open, issues, shown, checking, rulesHref, privacyHref, onChange, onBlur, onToggle, onRemove }: Props) {
  const n = index + 1;
  const leader = index === 0;
  const complete = Object.keys(issues).length === 0 && !checking;
  const error = (field: Field) => (shown(field) ? issues[field]?.message : undefined);
  const name = player.full_name.trim() || `Player ${n}`;
  const id = (field: string) => `p${player.key}-${field}`;
  const redBorder = hasShownError(issues, shown);

  const remove = !leader && (
    <button type="button" aria-label={`Remove player ${n}`} onClick={onRemove} className="flex min-h-11 items-center rounded-xl px-2.5 text-[15px] font-bold text-halloween-error">
      Remove
    </button>
  );
  const toggle = (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={open ? id('body') : undefined}
      aria-label={`${open ? 'Collapse' : 'Expand'} ${name}`}
      onClick={onToggle}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-halloween-cream"
    >
      <Icon name="chevron-down" className={open ? 'rotate-180' : ''} />
    </button>
  );

  if (!open) {
    const filled = [player.full_name.trim(), player.student_id && maskStudentId(player.student_id)].filter(Boolean).join(' · ');
    return (
      <section aria-label={`Player ${n}`}>
        <Card as="div" className={`flex items-center gap-2.5 py-3.5 pl-4 pr-3 ${redBorder ? '!border-halloween-error' : ''}`}>
          <PlayerNo n={n} complete={complete} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="flex flex-wrap items-center gap-2 text-[17px] font-bold">
              <span className="whitespace-nowrap">Player {n}</span> {leader && <LeaderBadge />} {complete && <Complete />}
            </span>
            <span className="truncate text-[15px] text-halloween-gray">{filled || 'ยังไม่ได้กรอกข้อมูล'}</span>
          </div>
          {remove}
          {toggle}
        </Card>
      </section>
    );
  }

  return (
    <section aria-label={`Player ${n}`}>
      <Card
        as="div"
        className={`flex flex-col gap-3.5 p-[18px] !border-[2.5px] ${redBorder ? '!border-halloween-error' : '!border-transparent'}`}
      >
        <div className="flex items-center gap-2.5">
          <PlayerNo n={n} complete={complete} />
          <h3 className="flex flex-1 flex-wrap items-center gap-2 text-[19px] font-bold">
            <span className="whitespace-nowrap">Player {n}</span> {leader && <LeaderBadge />} {complete && <Complete />}
          </h3>
          {remove}
          {toggle}
        </div>
        <div id={id('body')} className="flex flex-col gap-3.5">
          {leader && <span className="text-sm text-halloween-gray">คุณคือผู้จองและหัวหน้าทีม — ลบตัวเองออกจากฟอร์มไม่ได้</span>}
          <TextField
            id={id('name')}
            label="Full name"
            required
            autoComplete={leader ? 'name' : 'off'}
            value={player.full_name}
            onChange={(e) => onChange({ full_name: e.target.value })}
            onBlur={() => onBlur('full_name')}
            error={error('full_name')}
          />
          <TextField
            id={id('sid')}
            label="Student ID"
            required
            mono
            inputMode="numeric"
            readOnly={leader}
            placeholder="เช่น 6630123421"
            value={player.student_id}
            // No maxLength: it would cut a pasted "663-012-3421" early
            onChange={(e) => onChange({ student_id: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            onBlur={() => onBlur('student_id')}
            hint={checking ? 'กำลังตรวจสอบรหัสนิสิต…' : 'รหัสนิสิต 10 หลัก'}
            error={error('student_id')}
          />
          <TextField
            id={id('phone')}
            label="Phone"
            required
            type="tel"
            inputMode="tel"
            autoComplete={leader ? 'tel' : 'off'}
            placeholder="เช่น 081-234-5678"
            value={player.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            onBlur={() => onBlur('phone')}
            error={error('phone')}
          />
          <TextField
            id={id('email')}
            label="Email"
            required
            type="email"
            inputMode="email"
            autoComplete={leader ? 'email' : 'off'}
            placeholder={`เช่น ${player.student_id || 'รหัสนิสิต'}@student.chula.ac.th`}
            value={player.email}
            onChange={(e) => onChange({ email: e.target.value })}
            onBlur={() => onBlur('email')}
            error={error('email')}
          />
          <div className="flex flex-col gap-1.5 border-t-[1.5px] border-dashed border-halloween-purple pt-3">
            <CheckField id={id('pdpa')} checked={player.pdpa} onChange={(pdpa) => onChange({ pdpa })} invalid={!!error('pdpa')}>
              ยินยอมให้เก็บและใช้ข้อมูลส่วนบุคคล (ชื่อ รหัสนิสิต เบอร์โทร อีเมล) เพื่อการจองและเช็กอินกิจกรรมนี้เท่านั้น ตาม
              {/* New tab so the form is not lost */}
              <Link href={privacyHref} target="_blank" className={LINK}>
                นโยบายความเป็นส่วนตัว
              </Link>
            </CheckField>
            <CheckField id={id('rules')} checked={player.rules} onChange={(rules) => onChange({ rules })} invalid={!!error('rules')}>
              รับทราบ
              <Link href={rulesHref} target="_blank" className={LINK}>
                กฎของห้อง
              </Link>
              และคำเตือนด้านสุขภาพแล้ว
            </CheckField>
            {/* Under both boxes, per design */}
            {(['pdpa', 'rules'] as const).map((field) => {
              const message = error(field);
              return (
                message && (
                  <div key={field} id={`${id(field)}-err`} className="-mt-1.5">
                    <FieldError message={message} />
                  </div>
                )
              );
            })}
          </div>
        </div>
      </Card>
    </section>
  );
}
