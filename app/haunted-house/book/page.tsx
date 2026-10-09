'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookingPage, Button, Card, CheckField, ErrorNotice, Sheet, StickyNote, TextField } from '@/components/booking';
import { useRounds } from '@/hooks/useBooking';
import { BookingApiError, book } from '@/lib/bookingClient';
import { isEmail, roundPick } from '@/lib/bookingRules';
import { rememberCode, saveLastBooking } from '@/lib/bookingStorage';
import { formatTime, formatTimeRange } from '@/lib/bookingTime';
import type { Round } from '@/lib/bookingTypes';
import { FACULTIES, YEARS } from '@/lib/registrationOptions';
import { ACTIVITY, paths, rulesAccepted, useStudent } from '../_shared';

type Field = 'nickname' | 'faculty' | 'year' | 'phone' | 'email' | 'pdpa' | 'confirm';

const digits = (v: string) => v.replace(/[^0-9]/g, '');
const maskId = (id: string) => `${id.slice(0, 4)}•••${id.slice(-3)}`;

function SelectField({
  id,
  label,
  value,
  options,
  placeholder,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-bold text-halloween-cream">
        {label} <span className="text-halloween-error" aria-hidden="true">*</span>
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error || undefined}
        className={`w-full min-h-[52px] px-3.5 py-3 rounded-lg border-2 bg-halloween-dark text-halloween-cream text-[17px] outline-none focus:border-halloween-orange ${
          error ? 'border-halloween-error' : 'border-halloween-purple'
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && <span className="text-sm font-bold text-halloween-error">{error}</span>}
    </div>
  );
}

function BookForm() {
  const router = useRouter();
  const params = useSearchParams();
  const student = useStudent();
  const rounds = useRounds(ACTIVITY);

  const [roundId, setRoundId] = useState(params.get('round') ?? '');
  const [form, setForm] = useState({ nickname: '', faculty: '', year: '', phone: '', email: '' });
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
    if (!form.faculty) e.faculty = 'เลือกคณะด้วยนะ';
    if (!form.year) e.year = 'เลือกชั้นปีด้วยนะ';
    if (!/^0[0-9]{9}$/.test(digits(form.phone))) e.phone = 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก เช่น 0812345678';
    if (!isEmail(form.email)) e.email = 'อีเมลไม่ถูกต้อง';
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
            email: form.email.trim(),
            pdpa: true,
            rules: rulesAccepted(),
            nickname: form.nickname.trim(),
            faculty: form.faculty,
            year: form.year,
          },
        ],
      });
      rememberCode(ACTIVITY, result.code);
      saveLastBooking(result);
      router.push(paths.confirmed);
    } catch (e) {
      const code = e instanceof BookingApiError ? e.code : '';
      if (code === 'NOT_ENOUGH_SEATS' || code === 'ROUND_CLOSED') {
        // Someone took the last seat first: offer other rounds, keep everything typed
        await rounds.refresh();
        setFullRound(round);
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
          <Link href={paths.rounds} className="min-h-11 flex items-center text-[15px] font-bold text-halloween-orange">
            Change
          </Link>
        </div>
        <span className="text-[15px] text-halloween-gray">รอบที่ {round.round_no}</span>
        <span className="text-[34px] leading-[1.05] font-bold">{formatTimeRange(round.starts_at, round.ends_at)}</span>
        <div className="my-3.5 border-t-2 border-dashed border-halloween-moon/45" />
        <span className="text-[17px] font-bold">ลงทะเบียนหน้างาน {formatTimeRange(round.checkin_opens_at, round.checkin_closes_at)}</span>
      </Card>

      <StickyNote title="ข้อมูลจากตอนลงทะเบียนงาน" className="mt-2">
        <div className="flex justify-between gap-3 py-1">
          <span className="opacity-75">ชื่อ-นามสกุล</span>
          <b className="text-right">{student.full_name}</b>
        </div>
        <div className="flex justify-between gap-3 py-1">
          <span className="opacity-75">รหัสนิสิต</span>
          <b>{maskId(student.student_id)}</b>
        </div>
      </StickyNote>

      <TextField id="hh-nick" label="ชื่อเล่น" required value={form.nickname} onChange={(e) => set('nickname', e.target.value)} error={errors.nickname} autoComplete="nickname" />
      <SelectField id="hh-faculty" label="คณะ" value={form.faculty} options={FACULTIES} placeholder="เลือกคณะ" error={errors.faculty} onChange={(v) => set('faculty', v)} />
      <SelectField id="hh-year" label="ชั้นปี" value={form.year} options={YEARS} placeholder="เลือกชั้นปี" error={errors.year} onChange={(v) => set('year', v)} />
      <TextField id="hh-phone" label="เบอร์โทรศัพท์" required inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} hint="ตัวเลข 10 หลัก" error={errors.phone} />
      <TextField id="hh-email" label="อีเมล" required type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} hint="ส่งตั๋วไปที่อีเมลนี้" error={errors.email} />

      <CheckField id="hh-pdpa" checked={pdpa} onChange={(v) => { setPdpa(v); setErrors((e) => ({ ...e, pdpa: undefined })); }} error={errors.pdpa}>
        ยินยอมให้เก็บชื่อ รหัสนิสิต ชื่อเล่น คณะ ชั้นปี เบอร์โทร และอีเมล เพื่อใช้จัดกิจกรรมบ้านผีสิงเท่านั้น และลบหลังจบงาน
      </CheckField>
      <CheckField id="hh-confirm" checked={confirm} onChange={(v) => { setConfirm(v); setErrors((e) => ({ ...e, confirm: undefined })); }} error={errors.confirm}>
        ยืนยันความถูกต้อง หากการจองสำเร็จแล้วจะไม่สามารถแก้ไขข้อมูล, เปลี่ยนรอบ หรือยกเลิกการจองได้
      </CheckField>

      {submitError && <ErrorNotice>{submitError}</ErrorNotice>}

      <Button onClick={submit} loading={sending} loadingText="กำลังจอง…">
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
