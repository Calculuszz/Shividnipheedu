'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import BookingPage from '@/components/booking/BookingPage';
import BookingQR from '@/components/booking/BookingQR';
import Button from '@/components/booking/Button';
import Card, { ErrorNotice, InfoNotice, StickyNote } from '@/components/booking/Card';
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
  return (
    <BookingPage backHref={paths.home} showMyBooking={false} title="Find my booking">
      <Card tape tilt="left" className="mt-2 flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-halloween-orange">Enter your personal code</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-halloween-gray">
            รหัสอยู่ในอีเมลยืนยันการจองของคุณ
          </p>
        </div>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <TextField
            id="booking-code"
            label="Booking code"
            placeholder="SVP-XXXXXX"
            value={code}
            onChange={(event) => onCodeChange(event.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            mono
            error={error || undefined}
          />
          <Button type="submit" loading={loading} loadingText="กำลังค้นหา…">
            Find my booking
          </Button>
        </form>
      </Card>

      {error === 'No booking found' && (
        <div className="flex flex-col gap-3">
          <ErrorNotice title="No booking found">
            ตรวจสอบรหัสในอีเมลยืนยันอีกครั้ง หรือจองรอบใหม่ได้ด้านล่าง
          </ErrorNotice>
          <Button href={paths.start} variant="secondary">
            Book a slot
          </Button>
        </div>
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

  if (booking.me.status === 'checked_in') {
    return (
      <div className="rounded-lg border-2 border-halloween-moon bg-halloween-moon px-4 py-3 text-halloween-dark">
        <b>Checked in</b>
        <p className="text-sm">ไปที่หน้าห้องตามเวลารอบ {formatTime(booking.round.starts_at)} ได้เลย</p>
      </div>
    );
  }

  if (now < opens) {
    return (
      <div className="rounded-lg border-2 border-halloween-orange bg-halloween-charcoal/90 px-4 py-3 text-halloween-cream">
        <b className="text-halloween-orange">Check-in opens {until(opens)}</b>
        <p className="text-sm">เปิด {formatTime(booking.round.checkin_opens_at)} · ปิด {formatTime(booking.round.checkin_closes_at)}</p>
      </div>
    );
  }

  if (now <= closes) {
    return (
      <div className="rounded-lg border-2 border-halloween-moon bg-halloween-charcoal/90 px-4 py-3 text-halloween-cream">
        <b className="text-halloween-moon">Check-in open · closes {until(closes)}</b>
        <p className="text-sm">แสดง QR นี้ที่บูธก่อน {formatTime(booking.round.checkin_closes_at)}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-halloween-purple bg-halloween-charcoal/90 px-4 py-3 text-halloween-gray">
      <b>Check-in closed {formatTime(booking.round.checkin_closes_at)}</b>
      <p className="text-sm">เลยเวลาจัดการการจองแล้ว</p>
    </div>
  );
}

function BookingDetails({ booking }: { booking: MyBooking }) {
  const rows = [
    ['Room', booking.activity?.room_name || booking.activity?.name || 'Escape Room'],
    ['Round', `Round ${booking.round.round_no} · ${formatTimeRange(booking.round.starts_at, booking.round.ends_at)}`],
    ['Check-in', `${formatTime(booking.round.checkin_opens_at)}–${formatTime(booking.round.checkin_closes_at)} at the booth`],
  ];

  return (
    <dl className="divide-y divide-halloween-purple/50">
      {rows.map(([term, value]) => (
        <div key={term} className="grid grid-cols-[76px_1fr] gap-3 py-3 first:pt-0 last:pb-0">
          <dt className="font-bold text-halloween-orange">{term}</dt>
          <dd className="text-halloween-cream">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TeamRow({ member, showRemove, canRemove }: { member: TeamMember; showRemove: boolean; canRemove: boolean }) {
  return (
    <li className="flex items-center gap-3 py-3 border-b border-halloween-purple/40 last:border-b-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-halloween-purple/50 font-bold">
        {member.is_me ? '★' : '•'}
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
  const allLocked = !Object.values(booking.can).some(Boolean);
  const changeLockedOnly = !booking.can.change_round &&
    (booking.can.cancel_seat || booking.can.cancel_team || booking.can.remove_member);

  return (
    <BookingPage backHref={paths.home} showMyBooking={false}>
      <CheckinBanner booking={booking} now={now} />

      <div className="pt-1 text-center">
        <p className="text-[15px] font-bold tracking-[0.18em] text-halloween-moon">YOUR CODE</p>
        <h1 className="display-font mt-1 text-[38px] leading-none text-halloween-orange">{booking.me.code}</h1>
        <div className="mt-2 flex justify-center"><PlayerStatusChip status={booking.me.status} /></div>
      </div>

      <Card tone="cream" tilt="right" className="flex flex-col items-center gap-3 text-center">
        <BookingQR code={booking.me.code} size={210} />
        <p className="font-bold text-halloween-charcoal">QR ส่วนตัวของ {booking.me.full_name}</p>
        <p className="text-sm text-halloween-purple">ใช้เช็กอินได้คนเดียว รหัสนี้อย่าส่งต่อ</p>
      </Card>

      <Card><BookingDetails booking={booking} /></Card>

      <Card>
        <h2 className="display-font text-2xl text-halloween-orange">Team</h2>
        <ul className="mt-2">
          {booking.team.map((member) => (
            <TeamRow
              key={member.id}
              member={member}
              showRemove={booking.me.is_leader}
              canRemove={booking.can.remove_member}
            />
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col gap-3">
        <div>
          <h2 className="display-font text-2xl text-halloween-orange">Manage</h2>
          <p className="mt-1 text-sm text-halloween-gray">
            {allLocked
              ? 'เช็กอินรอบนี้ปิดแล้ว — จัดการการจองไม่ได้อีก'
              : changeLockedOnly
                ? 'ปิดรับจองออนไลน์แล้ว แต่ยังยกเลิกได้ถึงเวลาปิดเช็กอิน'
                : booking.me.is_leader ? 'Leader' : 'จัดการที่นั่งของคุณ'}
          </p>
        </div>
        {booking.me.is_leader && (
          <Button disabled={!booking.can.change_round} variant="secondary" onClick={() => alert('Change slot')}>Change slot (whole team)</Button>
        )}
        <Button disabled={!booking.can.cancel_seat} variant="danger" onClick={() => alert('Cancel my seat')}>Cancel my seat</Button>
        {booking.me.is_leader && (
          <Button disabled={!booking.can.cancel_team} variant="danger" onClick={() => alert('Cancel whole team')}>Cancel whole team</Button>
        )}
        <p className="text-sm leading-relaxed text-halloween-gray">
          ย้ายรอบได้ถึงเวลาปิดรับจองล่วงหน้า · ยกเลิกได้ถึงเวลาปิดเช็กอินของรอบ ({formatTime(booking.round.checkin_closes_at)} น.)
        </p>
      </Card>
    </BookingPage>
  );
}

function ReleasedBooking({ booking }: { booking: MyBooking }) {
  return (
    <BookingPage backHref={paths.home} showMyBooking={false} title="Oh no…">
      <InfoNotice title={`Check-in closed ${formatTime(booking.round.checkin_closes_at)}`}>
        ไม่ได้เช็กอินภายในเวลา
      </InfoNotice>
      <Card tone="danger" tape className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="display-font text-3xl text-halloween-error">Seat released</h2>
          <PlayerStatusChip status="released" />
        </div>
        <p className="leading-relaxed">
          คุณไม่ได้เช็กอินภายใน {formatTime(booking.round.checkin_closes_at)} ที่นั่งจึงถูกปล่อยแล้ว
          {' '}(รอบ {formatTimeRange(booking.round.starts_at, booking.round.ends_at)} · รหัส {booking.me.code})
        </p>
      </Card>
      <StickyNote title="Walk-in ยังได้">
        ยังมาเล่นแบบ walk-in ได้ถ้ารอบยังมีที่ — ติดต่อที่บูธ
      </StickyNote>
      <Card>
        <h2 className="display-font text-2xl text-halloween-orange">Team</h2>
        <p className="mt-1 text-sm text-halloween-gray">เพื่อนในทีมที่เช็กอินแล้วยังเล่นได้ตามปกติ ไม่ได้รับผลกระทบ</p>
        <ul className="mt-2">
          {booking.team.map((member) => <TeamRow key={member.id} member={member} showRemove={false} canRemove={false} />)}
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
