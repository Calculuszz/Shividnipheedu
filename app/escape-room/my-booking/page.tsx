'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import Doodle from '@/components/Doodle';
import BookingPage from '@/components/booking/BookingPage';
import BookingTicket from '@/components/booking/BookingTicket';
import BookingIcon from '@/components/booking/Icons';
import StatusNote, { type StatusNoteText } from '@/components/booking/StatusNote';
import Button from '@/components/booking/Button';
import Card from '@/components/booking/Card';
import { TextField } from '@/components/booking/Fields';
import { PlayerStatusChip } from '@/components/booking/Status';
import { BookingApiError, findBooking } from '@/lib/bookingClient';
import { bookingPaths, DEFAULT_ACTIVITY } from '@/lib/bookingRules';
import { forgetCode, getRememberedCode, rememberCode } from '@/lib/bookingStorage';
import { formatDayTimeTh, formatTime, formatTimeRange, serverNow } from '@/lib/bookingTime';
import type { MyBooking, TeamMember } from '@/lib/bookingTypes';

type View = 'find' | 'booking' | 'released' | 'cancelled';

const paths = bookingPaths(DEFAULT_ACTIVITY);
const VENUE = 'อาคารวิศวฯ 100 ปี';

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
          <Button href={paths.rules} block={false} className="!border-halloween-moon !bg-halloween-moon !text-halloween-dark px-8">
            Book a slot
          </Button>
        </section>
      )}
    </BookingPage>
  );
}

const STATUS_TEXT: StatusNoteText = {
  where: 'เช็กอินที่บูธ',
  openNow: 'เช็กอินเปิดแล้ว ไปที่บูธเลย',
  done: 'เช็กอินแล้ว',
  enter: 'เข้าห้อง',
  waitAt: 'รอหน้าห้องได้เลย',
  lateHelp: 'ยังมาเล่นแบบ walk-in ได้ ถ้ารอบยังมีที่',
};

const MEMBER_STATUS: Record<TeamMember['status'], string> = {
  booked: '',
  checked_in: 'เช็กอินแล้ว',
  released: 'สละสิทธิ์แล้ว',
  cancelled: 'ยกเลิกแล้ว',
  removed: 'ถูกนำออก',
};

function memberNote(member: TeamMember) {
  if (member.is_leader) return member.is_me ? 'หัวหน้าทีม (คุณ)' : 'หัวหน้าทีม';
  return [member.is_me ? '(คุณ)' : '', MEMBER_STATUS[member.status]].filter(Boolean).join(' ');
}

// Team names stay folded away: the count is enough most of the time
function TeamBox({ booking, canRemove }: { booking: MyBooking; canRemove: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="hand-cut border-2 border-halloween-purple bg-halloween-charcoal">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="team-list"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-16 w-full items-center gap-3 px-[18px] py-3.5 text-left"
      >
        <BookingIcon name="players" size={26} />
        <span className="flex-1 text-lg font-bold">ทีมของคุณ {booking.team.length} คน</span>
        <span className="text-sm font-bold text-halloween-orange">{open ? 'ซ่อน' : 'ดูรายชื่อ'}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`text-halloween-orange transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ol id="team-list" className="px-[18px] pb-1.5">
          {booking.team.map((member, index) => {
            const note = memberNote(member);
            return (
              <li key={member.id} className="flex items-center gap-3 border-t border-halloween-gray/20 py-3">
                <span className="w-[18px] text-[15px] font-bold text-halloween-gray">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{member.full_name}</p>
                  {note && <p className={`text-[13px] ${member.is_leader ? 'text-halloween-moon' : 'text-halloween-gray'}`}>{note}</p>}
                </div>
                {canRemove && !member.is_me && member.status === 'booked' && (
                  <button
                    type="button"
                    className="min-h-11 px-1 text-sm font-bold text-halloween-error underline underline-offset-4"
                    onClick={() => alert(`Remove ${member.full_name}`)}
                  >
                    นำออก
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function ManageRow({ icon, title, note, tone, disabled, onClick }: {
  icon: ReactNode;
  title: string;
  note: string;
  tone: 'orange' | 'plain' | 'error';
  disabled: boolean;
  onClick: () => void;
}) {
  const color = { orange: 'text-halloween-orange', plain: 'text-halloween-cream', error: 'text-halloween-error' }[tone];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-16 w-full items-center gap-3 border-t-[1.5px] border-dashed border-halloween-gray/35 px-1 py-3 text-left disabled:cursor-not-allowed disabled:opacity-45"
    >
      {icon}
      <span className="flex-1">
        <span className={`block text-[17px] font-bold ${color}`}>{title}</span>
        <span className="block text-[13px] text-halloween-gray">{note}</span>
      </span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={color}>
        <path d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function ManageBox({ booking }: { booking: MyBooking }) {
  const { me, can, round, activity } = booking;
  const cancelBy = `ทำได้ถึง ${formatTime(round.checkin_closes_at)} น.`;
  const leaderName = booking.team.find((member) => member.is_leader)?.full_name;
  const error = 'var(--halloween-error)';

  if (!Object.values(can).some(Boolean)) {
    return (
      <p className="px-1 text-sm text-halloween-gray">
        {me.status === 'checked_in' ? 'เช็กอินแล้ว เปลี่ยนรอบหรือยกเลิกไม่ได้อีก' : 'เช็กอินรอบนี้ปิดแล้ว จัดการการจองไม่ได้อีก'}
      </p>
    );
  }

  return (
    <section className="hand-cut border-2 border-halloween-purple bg-halloween-charcoal px-4 pt-[18px] pb-1.5">
      <p className="text-[13px] font-bold tracking-wide text-halloween-gray">จัดการการจอง</p>
      <h2 className="mt-0.5 mb-2.5 text-[22px] font-bold leading-tight">อยากเปลี่ยนแผน?</h2>
      {!me.is_leader && (
        <p className="mb-3 text-sm leading-relaxed text-halloween-gray">เปลี่ยนรอบหรือนำสมาชิกออกได้เฉพาะหัวหน้าทีม ({leaderName})</p>
      )}
      {me.is_leader && (
        <ManageRow
          icon={<BookingIcon name="round" size={24} />}
          title="เปลี่ยนรอบทั้งทีม"
          note={
            !can.change_round
              ? 'ปิดรับจองออนไลน์แล้ว เปลี่ยนรอบไม่ได้'
              : activity?.booking_closes_at
                ? `ทำได้ถึง ${formatDayTimeTh(activity.booking_closes_at)} น.`
                : 'ทำได้ถึงเวลาปิดรับจองออนไลน์'
          }
          tone="orange"
          disabled={!can.change_round}
          onClick={() => alert('Change slot')}
        />
      )}
      <ManageRow
        icon={<BookingIcon name="leave" size={24} light="var(--halloween-ash-gray)" accent={error} />}
        title="ยกเลิกที่นั่งของฉัน"
        note={`ทีมยังเล่นต่อได้ ${cancelBy}`}
        tone="plain"
        disabled={!can.cancel_seat}
        onClick={() => alert('Cancel my seat')}
      />
      {me.is_leader && (
        <ManageRow
          icon={<BookingIcon name="cancel" size={24} light={error} accent={error} />}
          title="ยกเลิกทั้งทีม"
          note={`ทุกคนในทีมเสียที่นั่ง ${cancelBy}`}
          tone="error"
          disabled={!can.cancel_team}
          onClick={() => alert('Cancel whole team')}
        />
      )}
    </section>
  );
}

function ActiveBooking({ booking, now }: { booking: MyBooking; now: number }) {
  const { me, round } = booking;
  return (
    <BookingPage backHref={paths.home} showMyBooking={false}>
      <StatusNote round={round} status={me.status} now={now} text={STATUS_TEXT} />
      <BookingTicket
        code={me.code}
        fullName={me.full_name}
        hint="ยื่น QR นี้ที่จุดเช็กอิน"
        round={{ label: `รอบที่ ${round.round_no}`, value: formatTimeRange(round.starts_at, round.ends_at) }}
        checkin={{ label: 'เช็กอินที่บูธ', value: formatTimeRange(round.checkin_opens_at, round.checkin_closes_at) }}
        place={{ label: 'จุดเช็กอิน', value: VENUE }}
      />
      <TeamBox booking={booking} canRemove={me.is_leader && booking.can.remove_member} />
      <ManageBox booking={booking} />
    </BookingPage>
  );
}

function ReleasedBooking({ booking }: { booking: MyBooking }) {
  return (
    <BookingPage backHref={paths.home} showMyBooking={false}>
      <StatusNote round={booking.round} status="released" now={Date.parse(booking.round.checkin_closes_at) + 60_000} text={STATUS_TEXT} />
      <p className="px-1 text-[15px] leading-relaxed text-halloween-gray">เพื่อนในทีมที่เช็กอินแล้วยังเล่นได้ตามปกติ ไม่ได้รับผลกระทบ</p>
      <TeamBox booking={booking} canRemove={false} />
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
      <Button href={paths.rules}>Book a slot</Button>
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
      const result = await findBooking(trimmed, DEFAULT_ACTIVITY);
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
        setError(caught.code === 'WRONG_ACTIVITY' ? caught.message : 'No booking found');
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
