'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookingApiError, staff } from '@/lib/bookingClient';
import { isPhone, isStudentId, normalizePhone } from '@/lib/bookingRules';
import { formatTime, formatTimeRange } from '@/lib/bookingTime';
import type { Walkin } from '@/lib/bookingTypes';
import { focusRound, maskId, roundName, roundPhase } from '@/lib/staffRounds';
import type { StaffCtx } from './StaffApp';
import { Notice, PhoneLink, RoundPicker, btn, card } from './ui';
import { staffFail } from './useStaffRounds';

const QUEUE_POLL_MS = 10_000;
const input =
  'h-12 w-full rounded-[10px] border-2 bg-halloween-dark px-3.5 text-base text-halloween-cream placeholder:text-halloween-gray/70 focus:border-halloween-orange focus:outline-none';

type Errors = Partial<Record<'full_name' | 'nickname' | 'student_id' | 'phone' | 'briefed', string>>;

const EMPTY = { full_name: '', nickname: '', student_id: '', phone: '' };

export default function WalkinTab({ ctx }: { ctx: StaffCtx }) {
  const { now, words: w } = ctx;
  // Walk-ins can join until the round ends
  const rounds = ctx.rounds.filter((r) => !r.closed && roundPhase(r, now) !== 'ended');
  const [roundId, setRoundId] = useState(() => {
    const hint = ctx.roundHint && rounds.some((r) => r.id === ctx.roundHint) ? ctx.roundHint : null;
    return hint ?? focusRound(rounds, now)?.id ?? null;
  });
  const round = rounds.find((r) => r.id === roundId) ?? null;

  const [form, setForm] = useState(EMPTY);
  // Haunted House walk-ins never saw the rules page, so staff read them out first
  const [briefed, setBriefed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [walkins, setWalkins] = useState<Walkin[] | null>(null);
  const [queueError, setQueueError] = useState('');
  const [calling, setCalling] = useState(false);
  const [called, setCalled] = useState<{ name: string; phone: string; no: number } | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const current = useRef(roundId);
  const loadQueue = useCallback(async (id: string) => {
    try {
      const data = await staff.attendance(id);
      if (current.current !== id) return;
      setWalkins(data.walkins);
      setQueueError('');
    } catch (e) {
      if (current.current === id) setQueueError(staffFail(e));
    }
  }, []);

  useEffect(() => {
    current.current = roundId;
    if (!roundId) return;
    const run = () => !document.hidden && void loadQueue(roundId);
    run();
    const timer = setInterval(run, QUEUE_POLL_MS);
    return () => clearInterval(timer);
  }, [roundId, loadQueue]);

  const pick = (id: string) => {
    setRoundId(id);
    setWalkins(null);
    setMessage(null);
    setCalled(null);
  };

  const refreshAll = () => {
    if (roundId) void loadQueue(roundId);
    void ctx.refresh();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!round) return;
    const next: Errors = {};
    if (!form.full_name.trim()) next.full_name = 'กรอกชื่อ-นามสกุล';
    if (w.solo && !form.nickname.trim()) next.nickname = 'กรอกชื่อเล่น';
    if (!isStudentId(form.student_id.trim())) next.student_id = 'รหัสนิสิตต้องเป็นตัวเลข 10 หลัก';
    if (!isPhone(form.phone)) next.phone = 'เบอร์โทรไม่ถูกต้อง เช่น 0812345678';
    if (w.solo && !briefed) next.briefed = 'บอกกฎและข้อควรระวังก่อน แล้วติ๊กช่องนี้';
    setErrors(next);
    setMessage(null);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const res = await staff.addWalkin({
        round_id: round.id,
        student_id: form.student_id.trim(),
        full_name: form.full_name.trim(),
        phone: normalizePhone(form.phone),
        ...(w.solo ? { nickname: form.nickname.trim() } : {}),
      });
      setMessage({
        ok: true,
        text:
          res.status === 'checked_in'
            ? `เพิ่ม ${form.full_name.trim()} แล้ว ${w.checkin}ให้แล้ว ${w.waitAt}`
            : `เพิ่ม ${form.full_name.trim()} เข้าคิวของ${roundName(round)} แล้ว จะเรียกเมื่อมีที่ว่าง`,
      });
      setForm(EMPTY);
      setBriefed(false);
      refreshAll();
    } catch (err) {
      if (err instanceof BookingApiError && err.code === 'ALREADY_BOOKED') {
        setErrors({ student_id: 'รหัสนิสิตนี้จองหรือเล่นไปแล้ว (1 คนเล่นได้ 1 รอบ)' });
      } else if (err instanceof BookingApiError && err.code === 'INVALID_PLAYER') {
        setMessage({ ok: false, text: 'ข้อมูลไม่ครบหรือไม่ถูกต้อง ลองตรวจอีกครั้ง' });
      } else {
        setMessage({ ok: false, text: staffFail(err) });
        if (err instanceof BookingApiError && err.code === 'ROUND_CLOSED') refreshAll();
      }
    } finally {
      setSaving(false);
    }
  };

  const callNext = async () => {
    if (!round) return;
    setCalling(true);
    setQueueError('');
    try {
      const { walkin } = await staff.callNextWalkin(round.id);
      if (walkin) setCalled({ name: walkin.full_name, phone: walkin.phone, no: walkin.queue_no });
      else setQueueError('ไม่มีคนในคิวแล้ว');
    } catch (e) {
      setQueueError(e instanceof BookingApiError && e.code === 'NOT_ENOUGH_SEATS' ? 'ตอนนี้ยังไม่มีที่ว่าง' : staffFail(e));
    } finally {
      setCalling(false);
      refreshAll();
    }
  };

  const leave = async (q: Walkin) => {
    if (!window.confirm(`เอา ${q.full_name} ออกจากคิวใช่ไหม?`)) return;
    setLeavingId(q.id);
    try {
      await staff.leaveQueue(q.id);
    } catch (e) {
      setQueueError(staffFail(e));
    } finally {
      setLeavingId(null);
      refreshAll();
    }
  };

  if (!rounds.length) {
    return (
      <div className="flex flex-col gap-3.5">
        <h1 className="text-2xl font-bold">Walk-in</h1>
        <div className={`${card} py-7 text-center text-halloween-gray`}>ไม่มีรอบที่ยังรับ walk-in ได้แล้ว</div>
      </div>
    );
  }

  const free = round ? Math.max(round.walkin_left, 0) : 0;
  const full = free === 0;
  const queue = (walkins ?? []).filter((q) => q.status === 'queued');
  const inCount = (walkins ?? []).filter((q) => q.status === 'checked_in').length;
  const knowsReleased = round ? now > Date.parse(round.checkin_closes_at) : false;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold">Walk-in</h1>
        <span className="text-sm text-halloween-gray">
          {w.solo ? 'สำหรับคนที่ไม่ได้จอง หรือมาไม่ทันเวลาลงทะเบียน' : 'สำหรับนิสิตจุฬาฯ ที่มาบูธโดยไม่ได้จองไว้'}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">รอบ</span>
        <RoundPicker
          rounds={rounds}
          selected={roundId}
          onSelect={pick}
          accent="orange"
          sub={(r) => {
            const f = Math.max(r.walkin_left, 0);
            if (f > 0) return { text: `ว่าง ${f}`, tone: 'moon' };
            return { text: r.walkin_queued > 0 ? `คิว ${r.walkin_queued}` : 'เต็ม' };
          }}
        />
      </div>

      {round && (
        <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start">
          <form onSubmit={submit} noValidate className={`${card} flex flex-col gap-3`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <b className="text-xl">{roundName(round)}</b>
                <span className="text-sm text-halloween-gray">
                  {w.play} {formatTimeRange(round.starts_at, round.ends_at)}
                </span>
              </div>
              <b className={`text-[15px] ${full ? 'text-halloween-error' : 'text-halloween-moon'}`}>ว่าง {free} ที่</b>
            </div>

            <Field id="w-name" label="ชื่อ-นามสกุล *" error={errors.full_name}>
              <input
                id="w-name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                autoComplete="off"
                className={`${input} ${errors.full_name ? 'border-halloween-error' : 'border-halloween-purple'}`}
              />
            </Field>
            {w.solo && (
              <Field id="w-nick" label="ชื่อเล่น *" error={errors.nickname}>
                <input
                  id="w-nick"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  autoComplete="off"
                  className={`${input} ${errors.nickname ? 'border-halloween-error' : 'border-halloween-purple'}`}
                />
              </Field>
            )}
            <Field
              id="w-sid"
              label="รหัสนิสิต *"
              error={errors.student_id}
              hint={
                <>
                  ตัวเลข 10 หลัก
                  <br />1 คนเล่นได้แค่ 1 รอบ ระบบจะเช็กกับคนที่จองไว้ให้
                </>
              }
            >
              <input
                id="w-sid"
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                inputMode="numeric"
                autoComplete="off"
                className={`${input} ${errors.student_id ? 'border-halloween-error' : 'border-halloween-purple'}`}
              />
            </Field>
            <Field id="w-phone" label="เบอร์โทร *" error={errors.phone}>
              <input
                id="w-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                inputMode="tel"
                autoComplete="off"
                className={`${input} ${errors.phone ? 'border-halloween-error' : 'border-halloween-purple'}`}
              />
            </Field>

            {w.solo && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="w-briefed" className="flex items-start gap-2.5 text-sm leading-relaxed">
                  <input
                    id="w-briefed"
                    type="checkbox"
                    checked={briefed}
                    onChange={(e) => setBriefed(e.target.checked)}
                    className="mt-0.5 h-[22px] w-[22px] shrink-0 accent-halloween-orange"
                  />
                  <span>
                    บอกกฎและข้อควรระวังแล้ว
                    <span className="block text-halloween-gray">ห้ามวิ่ง ห้ามจับพร็อพ และไม่แนะนำคนที่มีโรคหัวใจ ลมชัก แพ้แสงกะพริบ</span>
                  </span>
                </label>
                {errors.briefed && (
                  <span role="alert" className="text-sm font-bold text-halloween-error">
                    {errors.briefed}
                  </span>
                )}
              </div>
            )}

            <button type="submit" disabled={saving} className={`${btn(full ? 'primary' : 'lime')} w-full text-[17px]`}>
              {saving ? 'กำลังบันทึก…' : full ? `เพิ่มเข้าคิว (เป็นคิวที่ ${queue.length + 1})` : `เพิ่มและ${w.checkin}เลย`}
            </button>
            <span className="text-center text-[13px] text-halloween-gray">
              {full
                ? `รอบนี้เต็ม ระบบใส่คิวให้ เรียกตามลำดับเมื่อมีคน${w.solo ? w.released : 'ถูกปล่อย'}`
                : `มีที่ว่าง ระบบ${w.checkin}ให้ทันที`}
            </span>
            {message && <Notice tone={message.ok ? 'ok' : 'error'}>{message.text}</Notice>}
          </form>

          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold">คิวของ{roundName(round)}</h2>
              {queue.length > 0 && <span className="text-sm text-halloween-gray">{queue.length} คนรอ</span>}
            </div>

            {called && (
              <Notice tone="ok">
                เรียกคิวที่ {called.no}: {called.name}
                <span className="block font-normal text-halloween-cream">
                  {w.checkin}ให้แล้ว {w.solo ? w.waitAt : 'ให้เข้าห้องได้เลย'} (เบอร์ {called.phone})
                </span>
              </Notice>
            )}
            {queueError && <Notice>{queueError}</Notice>}

            {walkins === null ? (
              <p className="py-6 text-center text-halloween-gray">กำลังโหลดคิว…</p>
            ) : queue.length === 0 ? (
              <div className={`${card} text-center text-sm text-halloween-gray`}>
                {full ? 'ไม่มีคิว รอบนี้เต็มแล้ว' : `ไม่มีคิว ยังมีที่ว่าง เพิ่มแล้ว${w.checkin}ได้ทันที`}
              </div>
            ) : (
              <div className={`${card} flex flex-col gap-2.5`}>
                <button
                  type="button"
                  onClick={callNext}
                  disabled={full || calling}
                  className={`${btn('primary', full)} w-full text-[17px]`}
                >
                  {calling ? 'กำลังเรียก…' : 'เรียกคนถัดไป'}
                </button>
                {full && (
                  <span className="-mt-1 text-center text-[13px] leading-relaxed text-halloween-gray">
                    ตอนนี้ยังไม่มีที่ว่าง
                    {!knowsReleased && (
                      <>
                        <br />
                        จะรู้ที่ว่างจริงหลังปิด{w.checkin}ตอน {formatTime(round.checkin_closes_at)}
                      </>
                    )}
                  </span>
                )}
                {queue.map((q) => (
                  <div key={q.id} className="flex items-center gap-2.5 border-t border-halloween-purple/80 pt-2.5">
                    <b className="w-9 text-lg text-halloween-orange">#{q.queue_no}</b>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <b className="text-[15px]">{q.full_name}</b>
                      {q.nickname && <span className="text-sm font-bold text-halloween-moon">ชื่อเล่น {q.nickname}</span>}
                      <PhoneLink phone={q.phone} />
                      <span className="text-[13px] leading-normal text-halloween-gray">
                        รหัส {maskId(q.student_id)}
                        <br />
                        มาต่อคิวตอน {formatTime(q.created_at)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => leave(q)}
                      disabled={leavingId === q.id}
                      className="min-h-11 shrink-0 rounded-lg border-2 border-halloween-purple px-2.5 text-[13px] font-bold hover:bg-halloween-purple/40"
                    >
                      ออกจากคิว
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[13px] leading-relaxed text-halloween-gray">
              walk-in ที่{w.solo ? 'เข้าบ้าน' : 'เข้าเล่น'}รอบนี้แล้ว {inCount} คน
              <br />
              ดูรายชื่อทั้งหมดได้ในไฟล์ Export (หน้าภาพรวม)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      {children}
      {error ? (
        <span role="alert" className="text-sm font-bold text-halloween-error">
          {error}
        </span>
      ) : (
        hint && <span className="text-[13px] leading-normal text-halloween-gray">{hint}</span>
      )}
    </div>
  );
}
