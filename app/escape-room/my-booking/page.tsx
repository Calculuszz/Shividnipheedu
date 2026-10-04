'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Doodle from '@/components/Doodle';
import BookingPage from '@/components/booking/BookingPage';
import BookingQR from '@/components/booking/BookingQR';
import Button from '@/components/booking/Button';
import Card from '@/components/booking/Card';
import { TextField } from '@/components/booking/Fields';
import { LeaderBadge, PlayerStatusChip } from '@/components/booking/Status';
import { BookingApiError, findBooking } from '@/lib/bookingClient';
import { bookingPaths, DEFAULT_ACTIVITY } from '@/lib/bookingRules';
import { forgetCode, getRememberedCode, rememberCode } from '@/lib/bookingStorage';
import { formatTime, formatTimeRange, serverNow } from '@/lib/bookingTime';
import type { MyBooking, TeamMember } from '@/lib/bookingTypes';

type View = 'find' | 'booking' | 'released' | 'cancelled';

const paths = bookingPaths(DEFAULT_ACTIVITY);

function FindBooking({
  code,
  error,
  loading,
  onCodeChange,
  onSubmit,
}: {
  code: string;
  error: string;
  loading: boolean;
  onCodeChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const notFound = error === 'No booking found';
  const fieldError = notFound
    ? 'ไม่พบการจองจากรหัสนี้ กรุณาตรวจสอบรหัสในอีเมลยืนยันอีกครั้ง'
    : error;

  return (
    <BookingPage backHref={paths.home} showMyBooking={false}>
      <div className="relative mt-7 mb-1 min-h-[62px]">
        <h1 className="display-font whitespace-nowrap pr-16 text-[38px] leading-[1.05] text-halloween-orange">
          Find my booking
        </h1>
        <Doodle name="moon" className="absolute -right-1 -top-3 w-[58px] rotate-[18deg]" />
      </div>

      <Card className="flex flex-col gap-5 rounded-[26px_18px_28px_16px/18px_28px_16px_26px] px-5 py-6">
        <p className="text-[17px] font-bold leading-relaxed text-halloween-gray">
          รหัสอยู่ในอีเมลยืนยันการจองของคุณ
        </p>
        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <TextField
            id="booking-code"
            label="Personal booking code"
            required
            placeholder="SVP-XXXXXX"
            value={code}
            onChange={(event) => onCodeChange(event.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            mono
            error={fieldError || undefined}
          />
          <Button type="submit" loading={loading} loadingText="กำลังค้นหา…">
            Find my booking
          </Button>
        </form>
        <p className="text-[15px] leading-7 text-halloween-gray">
          รหัสเป็นของแต่ละคน เพื่อนในทีมใช้รหัสของตัวเอง · ค้นหาสำเร็จแล้วเครื่องนี้จะจำรหัสไว้
        </p>
      </Card>

      {notFound && (
        <section className="mt-1 flex min-h-[330px] flex-col items-center justify-center gap-5 rounded-[26px_18px_28px_16px/18px_28px_16px_26px] border-2 border-dashed border-halloween-gray/70 bg-halloween-charcoal/35 px-6 py-8 text-center">
          <Doodle name="ghost" className="w-[92px] -rotate-3" />
          <div>
            <h2 className="text-[22px] font-bold text-halloween-cream">No booking found</h2>
            <p className="mt-3 text-[16px] leading-7 text-halloween-cream">
              ยังไม่พบการจองที่ตรงกับรหัสนี้ ถ้ายังไม่ได้จอง สามารถจองรอบที่ยังว่างได้เลย
            </p>
          </div>
          <Button href={paths.start} block={false} className="!border-halloween-moon !bg-halloween-moon !text-halloween-dark px-8">
            Book a slot
          </Button>
        </section>
      )}
    </BookingPage>
  );
}

function CheckinBanner({ booking, now }: { booking: MyBooking; now: number }) {
  const opens = Date.parse(booking.round.checkin_opens_at);
  const closes = Date.parse(booking.round.checkin_closes_at);
  const until = (target: number) => {
    const minutes = Math.max(0, Math.ceil((target - now) / 60_000));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
  };

  const open = now >= opens && now <= closes;
  const closed = now > closes;
  const checkedIn = booking.me.status === 'checked_in';
  const title = checkedIn
    ? 'Checked in — see you at the room'
    : open
      ? 'Check-in open now — go to the booth'
      : closed
        ? `Check-in closed ${formatTime(booking.round.checkin_closes_at)}`
        : `Check-in opens ${formatTime(booking.round.checkin_opens_at)} · in ${until(opens)}`;
  const detail = checkedIn
    ? `ไปที่หน้าห้องตามเวลารอบ ${formatTime(booking.round.starts_at)} ได้เลย`
    : open
      ? `closes ${formatTime(booking.round.checkin_closes_at)} · ${until(closes)} left`
      : closed
        ? 'เลยเวลาจัดการการจองแล้ว'
        : 'เช็กอินที่บูธ อาคารวิศวฯ 100 ปี ใช้ QR ส่วนตัวของคุณ';
  const steps = [
    { label: booking.me.status === 'checked_in' ? 'Checked in' : 'Booked', done: true },
    { label: `Check-in ${formatTime(booking.round.checkin_opens_at)}–${formatTime(booking.round.checkin_closes_at)}`, done: open || closed || checkedIn },
    { label: `Round ${formatTime(booking.round.starts_at)}`, done: false },
  ];

  return (
    <section className={`rounded-[22px_16px_24px_14px/16px_24px_14px_22px] px-4 py-5 ${checkedIn ? 'bg-halloween-moon text-halloween-dark' : open ? 'bg-halloween-orange text-halloween-dark' : closed ? 'bg-halloween-error/20 text-halloween-cream' : 'bg-halloween-purple/85 text-halloween-cream'}`}>
      <h2 className="text-[18px] font-bold">{title}</h2>
      <p className="mt-1 text-[14px]">{detail}</p>
      <div className="relative mt-5 grid grid-cols-3 gap-2 before:absolute before:left-[16%] before:right-[16%] before:top-[11px] before:border-t-2 before:border-halloween-cream/30">
        {steps.map((step) => (
          <div key={step.label} className="relative z-10 flex flex-col items-center gap-1.5 text-center">
            <span className={`h-6 w-6 rounded-full border-[3px] ${step.done ? 'border-halloween-moon bg-halloween-charcoal' : open ? 'border-halloween-purple bg-halloween-orange' : 'border-halloween-cream bg-halloween-purple'}`} />
            <span className="text-[11px] font-bold leading-tight">{step.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function BookingDetails({ booking }: { booking: MyBooking }) {
  const rows = [
    ['▰', 'Room', booking.activity?.room_name || booking.activity?.name || 'Escape Room'],
    ['⟳', 'Round', `Round ${booking.round.round_no} · ${formatTimeRange(booking.round.starts_at, booking.round.ends_at)}`],
    ['▦', 'Check-in', `${formatTime(booking.round.checkin_opens_at)}–${formatTime(booking.round.checkin_closes_at)} at the booth`],
    ['●', 'Location', 'อาคารวิศวฯ 100 ปี คณะวิศวฯ'],
  ];

  return (
    <dl className="divide-y divide-halloween-purple/50">
      {rows.map(([icon, term, value]) => (
        <div key={term} className="grid grid-cols-[22px_76px_1fr] items-center gap-2 py-3">
          <span aria-hidden="true" className="text-lg font-bold text-halloween-moon">{icon}</span>
          <dt className="font-bold text-halloween-moon">{term}</dt>
          <dd className="text-right font-bold text-halloween-cream">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TeamRow({ member, index, showRemove, canRemove }: { member: TeamMember; index?: number; showRemove: boolean; canRemove: boolean }) {
  return (
    <li className="flex items-center gap-3 py-3 border-b border-halloween-purple/40 last:border-b-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center font-bold text-halloween-moon">
        {index ?? '•'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-halloween-cream">{member.full_name}</span>
          {member.is_leader && <LeaderBadge you={member.is_me} />}
          {member.is_me && !member.is_leader && <span className="text-sm text-halloween-gray">(you)</span>}
        </div>
        <PlayerStatusChip status={member.status} className="mt-1" />
      </div>
      {!member.is_me && showRemove && (
        <button
          type="button"
          disabled={!canRemove || member.status !== 'booked'}
          className="min-h-11 px-2 text-sm font-bold text-halloween-error underline underline-offset-4 disabled:cursor-not-allowed disabled:text-halloween-gray disabled:no-underline"
          onClick={() => alert(`Remove ${member.full_name}`)}
        >
          Remove
        </button>
      )}
    </li>
  );
}

function ActiveBooking({ booking, now }: { booking: MyBooking; now: number }) {
  const checkinOpen = now >= Date.parse(booking.round.checkin_opens_at) && now <= Date.parse(booking.round.checkin_closes_at);
  const allLocked = !Object.values(booking.can).some(Boolean);
  const changeLockedOnly = booking.me.is_leader && !booking.can.change_round &&
    (booking.can.cancel_seat || booking.can.cancel_team || booking.can.remove_member);
  const compact = allLocked || changeLockedOnly;
  const checkedIn = booking.me.status === 'checked_in';

  return (
    <BookingPage backHref={paths.home} showMyBooking={false}>
      <CheckinBanner booking={booking} now={now} />

      <div className="pt-1">
        <h1 className="display-font text-[36px] leading-none text-halloween-orange">
          {checkedIn ? 'Enjoy the room!' : checkinOpen ? 'Check-in is open!' : `See you at ${formatTime(booking.round.starts_at)}`}
        </h1>
      </div>

      {compact ? (
        <Card className="flex items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="display-font text-[29px] leading-none text-halloween-cream">{booking.me.code}</p>
            <p className="mt-2 text-[13px] text-halloween-gray">
              Round {booking.round.round_no} · {formatTimeRange(booking.round.starts_at, booking.round.ends_at)} · Check-in {formatTime(booking.round.checkin_opens_at)}–{formatTime(booking.round.checkin_closes_at)}
            </p>
          </div>
          <PlayerStatusChip status={booking.me.status} />
        </Card>
      ) : (
      <Card className="flex flex-col gap-5 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-bold tracking-wide text-halloween-moon">YOUR CODE</p>
            <p className="display-font mt-1 text-[32px] leading-none text-halloween-cream">{booking.me.code}</p>
          </div>
          <PlayerStatusChip status={booking.me.status} />
        </div>
        <div className="grid grid-cols-[128px_1fr] items-center gap-4">
          <BookingQR code={booking.me.code} size={128} />
          <div className="text-[14px] leading-relaxed text-halloween-gray">
            <p>QR ส่วนตัวของ</p>
            <p className="font-bold text-halloween-cream">{booking.me.full_name}</p>
            <p className="mt-1">ใช้เช็กอินได้คนเดียว รหัสนี้อย่าส่งต่อ</p>
          </div>
        </div>
        <BookingDetails booking={booking} />
      </Card>
      )}

      {!compact && (
      <Card className="px-5 py-4">
        <h2 className="display-font text-[25px] text-halloween-orange">Check-in rule</h2>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-[14px] leading-relaxed marker:font-bold marker:text-halloween-orange">
          <li>ยืนยันสิทธิ์ = เช็กอินที่บูธภายในเวลาเช็กอินของรอบ</li>
          <li>มาไม่ทันถือว่าสละสิทธิ์ ที่นั่งจะถูกปล่อยให้ walk-in</li>
          <li>ยังมาเล่นแบบ walk-in ได้ถ้ารอบยังมีที่</li>
        </ol>
      </Card>
      )}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-bold text-halloween-cream">Team</h2>
          <span className="text-sm text-halloween-gray">{booking.team.length} people</span>
        </div>
        <ul className="mt-2">
          {booking.team.map((member, index) => (
            <TeamRow
              key={member.id}
              member={member}
              index={index + 1}
              showRemove={booking.me.is_leader}
              canRemove={booking.can.remove_member}
            />
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold text-halloween-cream">Manage</h2>
            {!booking.me.is_leader && !allLocked && (
              <p className="mt-3 text-sm leading-relaxed text-halloween-gray">
                เปลี่ยนรอบหรือนำสมาชิกออกได้เฉพาะหัวหน้าทีม ({booking.team.find((member) => member.is_leader)?.full_name})
              </p>
            )}
          </div>
          {booking.me.is_leader && <span className="text-sm font-bold text-halloween-moon">Leader</span>}
        </div>
        {allLocked && (
          <p className="mt-1 text-sm text-halloween-gray">
            {checkedIn
              ? 'เช็กอินแล้ว ไปที่หน้าห้องตามเวลารอบได้เลย'
              : 'เช็กอินรอบนี้ปิดแล้ว — จัดการการจองไม่ได้อีก'}
          </p>
        )}
        {changeLockedOnly && <p className="text-sm text-halloween-gray">ปิดรับจองออนไลน์แล้ว แต่ยังยกเลิกได้ถึงเวลาปิดเช็กอิน</p>}
        {booking.me.is_leader && (
          <Button disabled={!booking.can.change_round} variant="secondary" onClick={() => alert('Change slot')}>Change slot (whole team)</Button>
        )}
        <div className={booking.me.is_leader ? 'grid grid-cols-2 gap-3' : ''}>
          <Button disabled={!booking.can.cancel_seat} variant="danger" onClick={() => alert('Cancel my seat')}>Cancel my seat</Button>
          {booking.me.is_leader && (
            <Button disabled={!booking.can.cancel_team} variant="danger" onClick={() => alert('Cancel whole team')}>Cancel whole team</Button>
          )}
        </div>
        {booking.me.is_leader && (
          <p className="text-sm leading-relaxed text-halloween-gray">ย้ายรอบได้ถึงเวลาปิดรับจองล่วงหน้า</p>
        )}
        <p className="text-sm leading-relaxed text-halloween-gray">ยกเลิกได้ถึงเวลาปิดเช็กอินของรอบ ({formatTime(booking.round.checkin_closes_at)} น.)</p>
      </Card>
    </BookingPage>
  );
}

function ReleasedBooking({ booking }: { booking: MyBooking }) {
  return (
    <BookingPage backHref={paths.home} showMyBooking={false}>
      <CheckinBanner booking={booking} now={Date.parse(booking.round.checkin_closes_at) + 60_000} />
      <h1 className="display-font text-[36px] leading-none text-halloween-orange">Oh no…</h1>
      <Card tone="danger" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-halloween-cream">Seat released</h2>
          <PlayerStatusChip status="released" />
        </div>
        <p className="leading-relaxed">
          คุณไม่ได้เช็กอินภายใน {formatTime(booking.round.checkin_closes_at)} ที่นั่งจึงถูกปล่อยแล้ว
          {' '}(รอบ {formatTimeRange(booking.round.starts_at, booking.round.ends_at)} · รหัส {booking.me.code})
        </p>
        <div className="rounded-lg bg-halloween-cream/10 px-4 py-3 text-sm">
          ยังมาเล่นแบบ walk-in ได้ถ้ารอบยังมีที่ — ติดต่อที่บูธ
        </div>
        <div className="rounded-lg border border-halloween-purple px-4 py-3 text-sm">
          เพื่อนในทีมที่เช็กอินแล้วยังเล่นได้ตามปกติ ไม่ได้รับผลกระทบ
        </div>
      </Card>
      <Card className="px-5 py-4">
        <h2 className="display-font text-[25px] text-halloween-orange">Check-in rule</h2>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-[14px] leading-relaxed marker:font-bold marker:text-halloween-orange">
          <li>ยืนยันสิทธิ์ = เช็กอินที่บูธภายในเวลาเช็กอินของรอบ</li>
          <li>มาไม่ทันถือว่าสละสิทธิ์ ที่นั่งจะถูกปล่อยให้ walk-in</li>
          <li>ยังมาเล่นแบบ walk-in ได้ถ้ารอบยังมีที่</li>
        </ol>
      </Card>
      <Card>
        <h2 className="text-[18px] font-bold text-halloween-cream">Team</h2>
        <ul className="mt-2">
          {booking.team.map((member, index) => <TeamRow key={member.id} member={member} index={index + 1} showRemove={false} canRemove={false} />)}
        </ul>
      </Card>
    </BookingPage>
  );
}

function CancelledBooking({ status }: { status: 'cancelled' | 'removed' }) {
  return (
    <BookingPage backHref={paths.home} showMyBooking={false} title="Booking cancelled">
      <Card tone="danger" tape className="flex flex-col gap-3 text-center">
        <div className="flex justify-center"><PlayerStatusChip status={status} /></div>
        <h2 className="text-xl font-bold text-halloween-error">การจองนี้ถูกยกเลิกแล้ว</h2>
        <p className="text-halloween-gray">
          {status === 'removed' ? 'คุณถูกนำออกจากทีม และสามารถจองรอบใหม่ได้' : 'ที่นั่งของคุณถูกยกเลิกแล้ว และสามารถจองรอบใหม่ได้'}
        </p>
      </Card>
      <Button href={paths.start}>Book a slot</Button>
    </BookingPage>
  );
}

export default function MyBookingPage() {
  const [view, setView] = useState<View>('find');
  const [code, setCode] = useState('');
  const [booking, setBooking] = useState<MyBooking | null>(null);
  const [cancelledStatus, setCancelledStatus] = useState<'cancelled' | 'removed'>('cancelled');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const load = useMemo(() => async (value: string, remembered = false) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('กรุณากรอกรหัสการจอง');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await findBooking(trimmed);
      setBooking(result);
      setCode(result.me.code);

      if (result.me.status === 'cancelled' || result.me.status === 'removed') {
        forgetCode(DEFAULT_ACTIVITY);
        setCancelledStatus(result.me.status);
        setView('cancelled');
      } else {
        rememberCode(DEFAULT_ACTIVITY, result.me.code);
        setView(result.me.status === 'released' ? 'released' : 'booking');
      }
    } catch (caught) {
      if (caught instanceof BookingApiError && caught.status === 404) {
        if (remembered) forgetCode(DEFAULT_ACTIVITY);
        setError('No booking found');
      } else {
        setError(caught instanceof Error ? caught.message : 'ระบบขัดข้อง ลองใหม่อีกครั้ง');
      }
      setView('find');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const restoreRememberedBooking = async () => {
      await Promise.resolve();
      const remembered = getRememberedCode(DEFAULT_ACTIVITY);
      if (remembered) {
        setCode(remembered);
        await load(remembered, true);
      } else {
        setLoading(false);
      }
    };
    void restoreRememberedBooking();
  }, [load]);

  useEffect(() => {
    if (view !== 'booking') return;
    const tick = () => setNow(serverNow());
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [view]);

  if (view === 'booking' && booking) return <ActiveBooking booking={booking} now={now} />;
  if (view === 'released' && booking) return <ReleasedBooking booking={booking} />;
  if (view === 'cancelled') return <CancelledBooking status={cancelledStatus} />;

  return (
    <FindBooking
      code={code}
      error={error}
      loading={loading}
      onCodeChange={(value) => {
        setCode(value);
        if (error) setError('');
      }}
      onSubmit={(event) => {
        event.preventDefault();
        void load(code);
      }}
    />
  );
}
