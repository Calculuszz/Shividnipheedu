'use client';

import { useEffect, useRef, useState } from 'react';
import { getBookingState, staff } from '@/lib/bookingClient';
import { formatTime, formatTimeRange } from '@/lib/bookingTime';
import type { StaffRound } from '@/lib/bookingTypes';
import { phaseChip, phaseLabel, roundName, roundPhase } from '@/lib/staffRounds';
import type { StaffCtx } from './EscapeRoomStaff';
import { Chip, Notice, btn, card } from './ui';
import { staffFail } from './useStaffRounds';

type Defaults = { online: number; walkin: number };

const REASONS = ['พักสตาฟ', 'ห้องมีปัญหา'];

export default function RoundsTab({ ctx }: { ctx: StaffCtx }) {
  const { rounds, now } = ctx;
  const [defaults, setDefaults] = useState<Defaults | null>(null);
  const [editing, setEditing] = useState<StaffRound | null>(null);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    getBookingState('escape_room')
      .then((s) => setDefaults({ online: s.activity.online_seats, walkin: s.activity.walkin_seats }))
      .catch(() => setDefaults(null));
  }, []);

  // Rounds whose check-in has opened are left alone: people are already on their way
  const editable = (r: StaffRound) => now < Date.parse(r.checkin_opens_at);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">จัดการรอบ</h1>
        <span className="text-sm leading-relaxed text-halloween-gray">
          {defaults && (
            <>
              ปกติรอบละ {defaults.online + defaults.walkin} ที่: จองออนไลน์ {defaults.online} + walk-in {defaults.walkin}
              <br />
            </>
          )}
          แก้ที่นี่ไม่กระทบคนที่จองไว้แล้ว
        </span>
      </div>

      {saved && <Notice tone="ok">{saved}</Notice>}

      <div className="grid gap-x-3 md:grid-cols-2">
        {rounds.map((r) => {
          const custom = defaults && (r.online_cap !== defaults.online || r.walkin_cap !== defaults.walkin);
          const phase = roundPhase(r, now);
          return (
            <div
              key={r.id}
              className={`${card} mb-2.5 flex items-center gap-3 ${r.closed ? 'bg-halloween-error/5' : ''} ${phase === 'ended' ? 'opacity-70' : ''}`}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <b className="text-lg">{roundName(r)}</b>
                  <span className="text-sm text-halloween-gray">เล่น {formatTime(r.starts_at)}</span>
                  <Chip className={phaseChip(r, now)}>{r.closed && r.closed_reason ? `ปิด (${r.closed_reason})` : phaseLabel(r, now)}</Chip>
                </div>
                <span className={`text-sm leading-normal ${custom ? 'text-halloween-orange' : 'text-halloween-gray'}`}>
                  {r.closed ? (
                    'ไม่รับจอง และไม่รับ walk-in'
                  ) : (
                    <>
                      จองแล้ว {r.online_taken} จาก {r.online_cap} ที่
                      <br />
                      walk-in {r.walkin_cap} ที่{defaults && r.walkin_cap !== defaults.walkin && ` (แก้จาก ${defaults.walkin})`}
                    </>
                  )}
                </span>
              </div>
              {editable(r) && (
                <button
                  type="button"
                  onClick={() => {
                    setSaved('');
                    setEditing(r);
                  }}
                  className={`${btn('ghost')} min-h-11 min-w-16 shrink-0 border-halloween-orange text-[15px] text-halloween-orange`}
                >
                  {r.closed ? 'เปิด' : 'แก้'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[13px] leading-relaxed text-halloween-gray">
        ปิดรอบ = หยุดรับจองและหยุดรับ walk-in ทันที คนที่จองไว้แล้วยังมาเล่นได้ตามปกติ
        <br />
        รอบที่เปิดเช็กอินแล้วแก้ไม่ได้
      </p>

      {editing && (
        <RoundSheet
          round={rounds.find((r) => r.id === editing.id) ?? editing}
          defaults={defaults}
          onClose={() => setEditing(null)}
          onSaved={(text) => {
            setEditing(null);
            setSaved(text);
            void ctx.refresh();
          }}
        />
      )}
    </div>
  );
}

function Stepper({
  label,
  note,
  noteTone,
  value,
  min,
  onChange,
}: {
  label: string;
  note: string;
  noteTone?: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  const box = 'h-12 w-12 rounded-xl border-2 border-halloween-purple bg-halloween-purple/30 text-2xl font-bold disabled:opacity-40';
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex flex-1 flex-col">
        <b className="text-base">{label}</b>
        <span className={`text-[13px] ${noteTone ?? 'text-halloween-gray'}`}>{note}</span>
      </div>
      <button type="button" aria-label={`ลด${label}`} className={box} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <b className="w-8 text-center text-[22px]" aria-live="polite">
        {value}
      </b>
      <button type="button" aria-label={`เพิ่ม${label}`} className={box} disabled={value >= 99} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

function RoundSheet({
  round,
  defaults,
  onClose,
  onSaved,
}: {
  round: StaffRound;
  defaults: Defaults | null;
  onClose: () => void;
  onSaved: (text: string) => void;
}) {
  const [closed, setClosed] = useState(round.closed);
  const preset = round.closed_reason && !REASONS.includes(round.closed_reason) ? 'other' : round.closed_reason ?? REASONS[0];
  const [reason, setReason] = useState<string>(preset);
  const [otherReason, setOtherReason] = useState(preset === 'other' ? round.closed_reason ?? '' : '');
  const [online, setOnline] = useState(round.online_cap);
  const [walkin, setWalkin] = useState(round.walkin_cap);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, []);

  const save = async () => {
    const closedReason = reason === 'other' ? otherReason.trim() : reason;
    if (closed && !closedReason) {
      setError('ใส่เหตุผลที่ปิดรอบ');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // Back to the activity default = null, so a later change of the default still applies
      const seat = (v: number, d: number | undefined) => (d !== undefined && v === d ? null : v);
      await staff.updateRound({
        round_id: round.id,
        closed,
        closed_reason: closed ? closedReason : undefined,
        ...(closed
          ? {}
          : { online_seats: seat(online, defaults?.online), walkin_seats: seat(walkin, defaults?.walkin) }),
      });
      onSaved(
        closed
          ? `ปิด${roundName(round)} แล้ว (${closedReason})`
          : `บันทึก${roundName(round)} แล้ว: จองออนไลน์ ${online} ที่, walk-in ${walkin} ที่`
      );
    } catch (e) {
      setError(staffFail(e));
      setSaving(false);
    }
  };

  const pill = (on: boolean) =>
    `min-h-10 rounded-full border-2 px-3.5 text-sm font-bold ${
      on ? 'border-halloween-orange bg-halloween-orange/15 text-halloween-orange' : 'border-halloween-purple'
    }`;
  const seg = (on: boolean, red = false) =>
    `min-h-12 flex-1 rounded-[10px] border-2 text-base font-bold ${
      on
        ? red
          ? 'border-halloween-error bg-halloween-error/15 text-halloween-error'
          : 'border-halloween-moon bg-halloween-moon/15 text-halloween-moon'
        : 'border-halloween-purple'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 md:items-center md:p-6" onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={`แก้${roundName(round)}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-md flex-col gap-3.5 overflow-y-auto rounded-t-[26px] border-t-2 border-halloween-orange bg-halloween-charcoal px-4 pt-[18px] pb-[max(24px,env(safe-area-inset-bottom))] outline-none md:rounded-[20px] md:border-2"
      >
        <div aria-hidden="true" className="mx-auto h-1 w-11 rounded-full bg-halloween-gray/40 md:hidden" />
        <div className="flex flex-col gap-0.5">
          <b className="text-[22px]">แก้{roundName(round)}</b>
          <span className="text-sm leading-relaxed text-halloween-gray">
            เล่น {formatTimeRange(round.starts_at, round.ends_at)}
            <br />
            จองไว้แล้ว {round.online_taken} คน
          </span>
        </div>

        <div className="flex gap-2">
          <button type="button" className={seg(!closed)} onClick={() => setClosed(false)}>
            เปิดรับ
          </button>
          <button type="button" className={seg(closed, true)} onClick={() => setClosed(true)}>
            ปิดรอบ
          </button>
        </div>

        {closed ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold">เหตุผล (นิสิตจะเห็นข้อความนี้)</span>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button key={r} type="button" className={pill(reason === r)} onClick={() => setReason(r)}>
                  {r}
                </button>
              ))}
              <button type="button" className={pill(reason === 'other')} onClick={() => setReason('other')}>
                อื่นๆ
              </button>
            </div>
            {reason === 'other' && (
              <input
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value.slice(0, 100))}
                placeholder="พิมพ์เหตุผลสั้นๆ"
                aria-label="เหตุผลอื่น"
                className="h-12 rounded-[10px] border-2 border-halloween-purple bg-halloween-dark px-3.5 text-base focus:border-halloween-orange focus:outline-none"
              />
            )}
            <p className="rounded-[10px] bg-halloween-error/10 px-3 py-2.5 text-sm leading-relaxed">
              รอบนี้จะหยุดรับจองและหยุดรับ walk-in ทันที
              {round.online_taken > 0 && (
                <>
                  <br />
                  <b>{round.online_taken} คนที่จองไว้แล้วยังมาเล่นได้ตามปกติ</b>
                  <br />
                  ถ้าเล่นไม่ได้จริง ต้องโทรบอกเขาเอง
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            <Stepper
              label="ที่นั่งจองออนไลน์"
              note={`ไม่ต่ำกว่าคนที่จองแล้ว (${round.online_taken})`}
              value={online}
              min={round.online_taken}
              onChange={setOnline}
            />
            <div className="border-t border-halloween-purple/80">
              <Stepper
                label="ที่นั่ง walk-in"
                note={defaults ? (walkin === defaults.walkin ? 'ค่าเริ่มต้น' : `แก้เอง (ค่าเริ่มต้น ${defaults.walkin})`) : ''}
                noteTone={defaults && walkin !== defaults.walkin ? 'text-halloween-orange' : undefined}
                value={walkin}
                min={0}
                onChange={setWalkin}
              />
            </div>
            {defaults && (
              <button
                type="button"
                onClick={() => {
                  setOnline(Math.max(defaults.online, round.online_taken));
                  setWalkin(defaults.walkin);
                }}
                className="min-h-10 self-start text-sm font-bold text-halloween-orange underline"
              >
                ใช้ค่าเริ่มต้น ({defaults.online} + {defaults.walkin})
              </button>
            )}
          </div>
        )}

        {error && <Notice>{error}</Notice>}

        <div className="flex flex-col gap-2.5">
          <button type="button" onClick={save} disabled={saving} className={`${btn()} w-full text-[17px]`}>
            {saving ? 'กำลังบันทึก…' : 'บันทึก'}
          </button>
          <button type="button" onClick={onClose} disabled={saving} className={`${btn('ghost')} w-full text-[17px]`}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
