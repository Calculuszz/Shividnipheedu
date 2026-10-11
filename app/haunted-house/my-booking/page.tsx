'use client';

import { useState } from 'react';
import Doodle from '@/components/Doodle';
import { BookingPage, BookingTicket, Button, ErrorNotice, StatusNote, TextField } from '@/components/booking';
import type { StatusNoteText } from '@/components/booking/StatusNote';
import { useMyBooking, useMyCode, useNow } from '@/hooks/useBooking';
import { BookingApiError, findBooking } from '@/lib/bookingClient';
import { rememberCode } from '@/lib/bookingStorage';
import { formatTimeRange } from '@/lib/bookingTime';
import type { MyBooking } from '@/lib/bookingTypes';
import { ACTIVITY, VENUE_BUILDING, paths } from '../_shared';

export default function HauntedMyBookingPage() {
  // This device's booking, or the logged-in student's own (opened on a new phone)
  const mine = useMyCode(ACTIVITY);
  const [typedCode, setTypedCode] = useState<string | null>(null);
  const code = typedCode ?? mine.code;
  const booking = useMyBooking(code, ACTIVITY);

  if (mine.checking || (code && booking.loading)) {
    return (
      <BookingPage activity={ACTIVITY} backHref={paths.home} showMyBooking={false}>
        <p role="status" className="py-6 text-center text-halloween-gray">กำลังเปิดตั๋ว…</p>
      </BookingPage>
    );
  }

  const found = code && booking.data && booking.data.activity?.id === ACTIVITY ? booking.data : null;
  if (found) return <Ticket booking={found} />;

  return <FindTicket onFound={setTypedCode} />;
}

function FindTicket({ onFound }: { onFound: (code: string) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const find = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await findBooking(value, ACTIVITY);
      if (data.activity?.id !== ACTIVITY) throw new BookingApiError(404, 'NOT_FOUND');
      rememberCode(ACTIVITY, data.me.code);
      onFound(data.me.code);
    } catch (e) {
      setError(e instanceof BookingApiError ? e.message : 'ระบบขัดข้อง ลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BookingPage activity={ACTIVITY} backHref={paths.home} showMyBooking={false} title="My booking">
      <Doodle name="web" className="absolute right-0 top-[60px] w-24 h-auto opacity-50 pointer-events-none" />
      <p className="text-base leading-relaxed">ใส่รหัสการจองจากอีเมลยืนยัน (ขึ้นต้นด้วย SVP-)</p>
      <TextField id="hh-code" label="รหัสการจอง" mono value={value} onChange={(e) => setValue(e.target.value)} placeholder="SVP-XXXXXX" autoCapitalize="characters" />
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <Button onClick={find} loading={busy} loadingText="กำลังค้นหา…" disabled={!value.trim()}>
        Find my ticket
      </Button>
    </BookingPage>
  );
}

const STATUS_TEXT: StatusNoteText = {
  where: 'เช็คอินที่จุดลงทะเบียน',
  openNow: 'เช็คอินเปิดแล้ว ไปที่จุดลงทะเบียนเลย',
  done: 'เช็คอินแล้ว',
  enter: 'เข้าบ้าน',
  waitAt: 'รอหน้าทางเข้าบ้านผีสิงได้เลย',
  lateHelp: 'ยังต่อคิว walk-in ได้ที่จุดลงทะเบียน',
};

function Ticket({ booking }: { booking: MyBooking }) {
  const now = useNow(30_000);
  const { round, me } = booking;
  return (
    <BookingPage activity={ACTIVITY} backHref={paths.home} showMyBooking={false}>
      <StatusNote round={round} status={me.status} now={now} text={STATUS_TEXT} />
      <BookingTicket
        code={me.code}
        fullName={me.full_name}
        hint="ยื่น QR นี้ที่จุดเช็คอิน"
        round={{ label: `รอบที่ ${round.round_no}`, value: formatTimeRange(round.starts_at, round.ends_at) }}
        checkin={{ label: 'ลงทะเบียน', value: formatTimeRange(round.checkin_opens_at, round.checkin_closes_at) }}
        place={{ label: 'จุดลงทะเบียน', value: VENUE_BUILDING }}
      />
    </BookingPage>
  );
}
