'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookingIcon, BookingPage, Button, Card, CheckField, ErrorNotice, Sheet, Tape, TextField } from '@/components/booking';
import { useRounds } from '@/hooks/useBooking';
import { BookingApiError, book } from '@/lib/bookingClient';
import { isEmail, roundPick } from '@/lib/bookingRules';
import { rememberCode, saveLastBooking } from '@/lib/bookingStorage';
import { formatTime, formatTimeRange } from '@/lib/bookingTime';
import type { Round } from '@/lib/bookingTypes';
import { ACTIVITY, paths, rulesAccepted, useStudent } from '../_shared';

type Field = 'nickname' | 'phone' | 'email' | 'pdpa' | 'confirm';

const digits = (v: string) => v.replace(/[^0-9]/g, '');

// "Everyone who came into this house never left": the house's register, written in blood.
// The only thing a player writes here is their nickname; the rest comes from registration.
function RegisterNote({ value, error, onChange }: { value: string; error?: string; onChange: (v: string) => void }) {
  return (
    <section className="paper-note paper-aged mx-1 mt-2.5 px-5 pt-[26px] pb-5">
      <Tape className="left-1/2 -translate-x-1/2 rotate-3 !bg-[#cdb98f]/80" />
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id="bleed">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" />
        </filter>
      </svg>

      {/* bloody fingerprint, top right */}
      <svg width="74" height="58" viewBox="0 0 74 58" aria-hidden="true" className="absolute top-3.5 right-2.5 rotate-[18deg] opacity-55 [filter:url(#bleed)]">
        <ellipse cx="30" cy="26" rx="22" ry="17" fill="#8a0a10" opacity=".55" />
        <path d="M14 26c2-9 10-14 18-13s14 7 13 15M18 28c1-7 7-11 13-10s10 6 9 11M22 29c1-4 5-7 9-6s7 4 6 8" fill="none" stroke="#e6d2b0" strokeWidth="1.6" opacity=".7" />
        <path d="M48 30q14 2 22 10" stroke="#8a0a10" strokeWidth="7" strokeLinecap="round" fill="none" opacity=".5" />
        <circle cx="66" cy="12" r="2.4" fill="#8a0a10" />
        <circle cx="8" cy="50" r="1.8" fill="#8a0a10" />
      </svg>

      <p className="text-[17px] leading-normal">ทุกคนที่เข้ามาในบ้านหลังนี้</p>
      <div className="relative mt-0.5 pb-[30px]">
        <p className="relative text-[31px] font-bold leading-[1.15] text-[#8f0b12] [filter:url(#bleed)] [text-shadow:0_1px_0_#5c0007,0_0_8px_rgba(143,11,18,0.3)]">
          ยังไม่มีใครได้ออกไป
        </p>
        {/* blood running off the line */}
        <svg width="300" height="40" viewBox="0 0 300 40" aria-hidden="true" className="absolute left-0 top-[30px] [filter:url(#bleed)]">
          <g fill="#8f0b12">
            <path d="M12 0h5v12a2.5 2.5 0 0 1-5 0z" />
            <path d="M44 0h7v24a3.5 3.5 0 0 1-7 0z" />
            <path d="M97 0h4v8a2 2 0 0 1-4 0z" />
            <path d="M150 0h6v31a3 3 0 0 1-6 0z" />
            <path d="M205 0h5v16a2.5 2.5 0 0 1-5 0z" />
            <path d="M262 0h8v20a4 4 0 0 1-8 0z" />
            <circle cx="47.5" cy="34" r="2.6" />
            <circle cx="153" cy="39" r="1.6" />
          </g>
        </svg>
      </div>

      <div className="mt-2.5">
        <label htmlFor="hh-nick" className="block text-base font-bold">
          คนต่อไป มีชื่อว่า <span className="text-[var(--blood)]" aria-hidden="true">*</span>
        </label>
        <input
          id="hh-nick"
          type="text"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ชื่อเล่นของคุณ"
          autoComplete="nickname"
          aria-invalid={!!error || undefined}
          aria-describedby={error ? 'hh-nick-err' : undefined}
          className="block w-full border-0 border-b-2 border-dashed border-[#160204]/50 bg-transparent px-0.5 pb-0.5 text-[30px] font-bold text-[#a3101a] outline-none placeholder:font-normal placeholder:text-[#160204]/30 focus:border-[#a3101a] [text-shadow:0_0_1px_#a3101a,0_0_7px_rgba(163,16,26,0.35)] placeholder:[text-shadow:none]"
        />
        {error && (
          <p id="hh-nick-err" className="mt-1.5 text-sm font-bold text-[var(--blood)]">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

function BookForm() {
  const router = useRouter();
  const params = useSearchParams();
  const student = useStudent();
  const rounds = useRounds(ACTIVITY);

  const [roundId, setRoundId] = useState(params.get('round') ?? '');
  const [form, setForm] = useState({ nickname: '', phone: '', email: '' });
  // Only when the email from event registration can't be used (the server says EMAIL_NEEDED)
  const [needEmail, setNeedEmail] = useState(false);
  const [pdpa, setPdpa] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [sending, setSending] = useState(false);
  const [fullRound, setFullRound] = useState<Round | null>(null);

  // Came here without ticking the rules (deep link, new tab): start from the rules
  useEffect(() => {
    if (!rulesAccepted()) router.replace(paths.rules);
  }, [router]);

  const list = rounds.data?.rounds ?? [];
  const round = list.find((r) => r.id === roundId) ?? null;

  if (student === undefined || rounds.loading) {
    return (
      <BookingPage activity={ACTIVITY} backHref={paths.rounds}>
        <p role="status" className="py-6 text-center text-halloween-gray">กำลังโหลด…</p>
      </BookingPage>
    );
  }

  if (!student || !round) {
    return (
      <BookingPage activity={ACTIVITY} backHref={paths.rounds}>
        <ErrorNotice title={!student ? 'เข้าสู่ระบบก่อนจอง' : 'ไม่พบรอบที่เลือก'}>
          {!student ? 'เข้าสู่ระบบด้วยรหัสนิสิตก่อน แล้วกลับมาที่เมนูบ้านผีสิง' : 'กลับไปเลือกรอบอีกครั้ง'}
        </ErrorNotice>
        <Button href={!student ? '/' : paths.rounds}>{!student ? 'Log in' : 'Choose a round'}</Button>
      </BookingPage>
    );
  }

  const set = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const e: Partial<Record<Field, string>> = {};
    if (!form.nickname.trim()) e.nickname = 'ใส่ชื่อเล่นด้วยนะ';
    if (!/^0[0-9]{9}$/.test(digits(form.phone))) e.phone = 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก เช่น 0812345678';
    if (needEmail && !isEmail(form.email)) e.email = 'อีเมลไม่ถูกต้อง';
    if (!pdpa) e.pdpa = 'ติ๊กยินยอมการเก็บข้อมูลก่อนนะ';
    if (!confirm) e.confirm = 'ติ๊กยืนยันความถูกต้องก่อนนะ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (sending || !validate()) return;
    setSending(true);
    setSubmitError('');
    try {
      const result = await book({
        round_id: round.id,
        players: [
          {
            student_id: student.student_id,
            full_name: student.full_name,
            phone: digits(form.phone),
            // Email, faculty and year come from the event registration (filled in on the server)
            email: needEmail ? form.email.trim() : '',
            pdpa: true,
            rules: rulesAccepted(),
            nickname: form.nickname.trim(),
          },
        ],
      });
      rememberCode(ACTIVITY, result.code);
      saveLastBooking(ACTIVITY, result);
      router.push(paths.confirmed);
    } catch (e) {
      const code = e instanceof BookingApiError ? e.code : '';
      if (code === 'NOT_ENOUGH_SEATS' || code === 'ROUND_CLOSED') {
        // Someone took the last seat first: offer other rounds, keep everything typed
        await rounds.refresh();
        setFullRound(round);
      } else if (code === 'EMAIL_NEEDED') {
        setNeedEmail(true);
        setErrors((x) => ({ ...x, email: 'ใส่อีเมลที่ใช้ได้ ตั๋วจะส่งไปที่อีเมลนี้' }));
        requestAnimationFrame(() => document.getElementById('hh-email')?.focus());
      } else if (code === 'ALREADY_BOOKED') {
        setSubmitError('รหัสนิสิตนี้จองบ้านผีสิงไว้แล้ว (1 คน จองได้ 1 สิทธิ์) ดูตั๋วได้ในอีเมลยืนยัน');
      } else {
        setSubmitError(e instanceof BookingApiError ? e.message : 'ระบบขัดข้อง ลองใหม่อีกครั้ง');
      }
    } finally {
      setSending(false);
    }
  };

  // Rounds still open, nearest to the one that filled up first
  const alternatives = fullRound
    ? list
        .filter((r) => r.id !== fullRound.id && roundPick(r, 1).selectable)
        .sort((a, b) => Math.abs(a.round_no - fullRound.round_no) - Math.abs(b.round_no - fullRound.round_no))
        .slice(0, 2)
    : [];

  const pickRound = (r: Round) => {
    setRoundId(r.id);
    setFullRound(null);
    router.replace(`${paths.book}?${new URLSearchParams({ round: r.id })}`);
  };

  return (
    <BookingPage activity={ACTIVITY} backHref={paths.rounds} step="Step 3 of 3" title="Your details">
      <Card className="flex flex-col -rotate-[0.6deg]">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-bold text-halloween-moon">YOUR ROUND</span>
          <Link href={paths.rounds} className="min-h-11 flex items-center text-lg font-bold text-halloween-orange">
            Change
          </Link>
        </div>
        <span className="flex items-center gap-1.5 text-[15px] text-halloween-gray">
          <BookingIcon name="round" size={16} />
          รอบที่ {round.round_no}
        </span>
        <span className="text-[34px] leading-[1.05] font-bold">{formatTimeRange(round.starts_at, round.ends_at)}</span>
        <div className="my-3.5 border-t-2 border-dashed border-halloween-moon/45" />
        <span className="flex items-center gap-2 text-[17px] font-bold">
          <BookingIcon name="clock" size={20} />
          ลงทะเบียนหน้างาน {formatTimeRange(round.checkin_opens_at, round.checkin_closes_at)}
        </span>
      </Card>

      <RegisterNote value={form.nickname} error={errors.nickname} onChange={(v) => set('nickname', v)} />

      <TextField
        id="hh-phone"
        label="เบอร์โทรที่ติดต่อได้วันงาน"
        icon={<BookingIcon name="phone" size={18} />}
        required
        inputMode="tel"
        autoComplete="tel"
        value={form.phone}
        onChange={(e) => set('phone', e.target.value)}
        error={errors.phone}
      />

      {needEmail && (
        <TextField
          id="hh-email"
          label="อีเมล"
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          hint="อีเมลตอนลงทะเบียนเข้างานใช้ไม่ได้ ตั๋วจะส่งไปที่อีเมลนี้แทน"
          error={errors.email}
        />
      )}

      <CheckField id="hh-pdpa" checked={pdpa} onChange={(v) => { setPdpa(v); setErrors((e) => ({ ...e, pdpa: undefined })); }} error={errors.pdpa}>
        ยินยอมให้เก็บชื่อเล่นและเบอร์โทร และใช้ข้อมูลจากตอนลงทะเบียนงาน (ชื่อ รหัสนิสิต คณะ ชั้นปี อีเมล) เพื่อจัดกิจกรรมบ้านผีสิงเท่านั้น และลบหลังจบงาน
      </CheckField>
      <CheckField id="hh-confirm" checked={confirm} onChange={(v) => { setConfirm(v); setErrors((e) => ({ ...e, confirm: undefined })); }} error={errors.confirm}>
        ยืนยันความถูกต้อง หากการจองสำเร็จแล้วจะไม่สามารถแก้ไขข้อมูล เปลี่ยนรอบ หรือยกเลิกการจองได้
      </CheckField>

      {submitError && <ErrorNotice>{submitError}</ErrorNotice>}

      <Button onClick={submit} loading={sending} loadingText="กำลังจอง…" arrow>
        Confirm booking
      </Button>

      <Sheet open={!!fullRound} onClose={() => setFullRound(null)} title="Round full" footer={<Button href={paths.rounds}>See all rounds</Button>}>
        <ErrorNotice title="ขออภัย รอบนี้ได้เต็มแล้ว">
          {fullRound && (
            <span className="text-halloween-cream">
              รอบที่ {fullRound.round_no} ({formatTimeRange(fullRound.starts_at, fullRound.ends_at)}) มีคนจองที่สุดท้ายไปก่อนคุณกดยืนยัน
            </span>
          )}
        </ErrorNotice>
        <p className="text-[15px] leading-relaxed">ข้อมูลที่กรอกไว้ยังอยู่ เลือกรอบใหม่แล้วกดจองต่อได้เลย</p>
        {alternatives.length > 0 && <span className="text-sm font-bold text-halloween-moon">รอบที่ยังว่าง ใกล้เวลาเดิม</span>}
        {alternatives.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => pickRound(r)}
            className="flex min-h-[72px] items-center gap-3 rounded-[12px_8px_14px_7px] border-2 border-halloween-purple bg-halloween-charcoal px-3 py-3 text-left hover:border-halloween-orange"
          >
            <span className="flex flex-1 flex-col gap-1">
              <span className="flex items-center gap-2">
                <b className="text-[17px]">{formatTimeRange(r.starts_at, r.ends_at)}</b>
                <span className="rounded-md border border-halloween-purple px-1.5 py-0.5 text-[11px] font-bold text-halloween-gray">รอบที่ {r.round_no}</span>
              </span>
              <span className="text-xs text-halloween-gray">ลงทะเบียนหน้างาน {formatTime(r.checkin_opens_at)}–{formatTime(r.checkin_closes_at)}</span>
            </span>
            <span className="text-[28px] font-bold leading-none">
              {r.online_left}
              <span className="text-sm text-halloween-gray">/{r.online_cap}</span>
            </span>
          </button>
        ))}
      </Sheet>
    </BookingPage>
  );
}

export default function HauntedBookPage() {
  return (
    <Suspense fallback={null}>
      <BookForm />
    </Suspense>
  );
}
