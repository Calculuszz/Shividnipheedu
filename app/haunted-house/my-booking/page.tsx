'use client';

import { useState, useSyncExternalStore } from 'react';
import Doodle from '@/components/Doodle';
import { BookingPage, BookingQR, Button, Card, ErrorNotice, TextField } from '@/components/booking';
import { useMyBooking, useNow } from '@/hooks/useBooking';
import { BookingApiError, findBooking } from '@/lib/bookingClient';
import { getRememberedCode, rememberCode } from '@/lib/bookingStorage';
import { formatDateTh, formatTime, formatTimeRange, minutesUntil } from '@/lib/bookingTime';
import type { MyBooking } from '@/lib/bookingTypes';
import { ACTIVITY, REGISTER_POINT, paths } from '../_shared';

const noSubscription = () => () => {};

export default function HauntedMyBookingPage() {
  const remembered = useSyncExternalStore(noSubscription, () => getRememberedCode(ACTIVITY), () => null);
  const [typedCode, setTypedCode] = useState<string | null>(null);
  const code = typedCode ?? remembered;
  const booking = useMyBooking(code);

  if (code && booking.loading) {
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
      const data = await findBooking(value);
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

function Banner({ booking }: { booking: MyBooking }) {
  const now = useNow(30_000);
  const { round, me } = booking;
  const toOpen = minutesUntil(round.checkin_opens_at, now);
  const toClose = minutesUntil(round.checkin_closes_at, now);

  if (me.status === 'checked_in') {
    return <BannerBox tone="moon" title="ลงทะเบียนแล้ว" text={`ให้รอหน้าทางเข้า เริ่มเล่น ${formatTime(round.starts_at)} น.`} />;
  }
  if (me.status === 'released' || toClose < 0) {
    return <BannerBox tone="error" title="เลยเวลาลงทะเบียนแล้ว" text="สิทธิ์ของรอบนี้ถูกสละไปแล้ว ถ้ายังอยากเล่น ลองต่อคิว walk-in ที่จุดลงทะเบียน" />;
  }
  if (toOpen <= 0) {
    return <BannerBox tone="error" title={`ลงทะเบียนตอนนี้! ปิดใน ${toClose} นาที`} text={`ยื่น QR ให้สตาฟที่จุดลงทะเบียน ช้ากว่า ${formatTime(round.checkin_closes_at)} น. ถือว่าสละสิทธิ์`} />;
  }
  if (toOpen <= 60) {
    return <BannerBox tone="orange" title={`เปิดลงทะเบียนในอีก ${toOpen} นาที`} text={`ไปที่${REGISTER_POINT}ได้เลย`} />;
  }
  const days = Math.ceil(toOpen / (24 * 60));
  return (
    <BannerBox
      tone="plain"
      title={days > 1 ? `อีก ${days} วัน` : 'วันนี้'}
      text={`${formatDateTh(round.starts_at)} มาลงทะเบียน ${formatTimeRange(round.checkin_opens_at, round.checkin_closes_at)} น.`}
    />
  );
}

function BannerBox({ tone, title, text }: { tone: 'plain' | 'orange' | 'error' | 'moon'; title: string; text: string }) {
  const styles = {
    plain: 'border-halloween-purple bg-halloween-charcoal text-halloween-moon',
    orange: 'border-[#ffb347] bg-[#ffb347]/10 text-[#ffb347]',
    error: 'border-halloween-orange bg-halloween-orange/15 text-halloween-orange',
    moon: 'border-halloween-moon bg-halloween-moon/10 text-halloween-moon',
  }[tone];
  return (
    <div role="status" className={`flex flex-col gap-1 rounded-[12px_8px_14px_6px/8px_14px_6px_12px] border-2 px-4 py-3.5 ${styles}`}>
      <b className="text-xl">{title}</b>
      <span className="text-[15px] leading-relaxed text-halloween-cream">{text}</span>
    </div>
  );
}

function Ticket({ booking }: { booking: MyBooking }) {
  const { round, me } = booking;
  return (
    <BookingPage activity={ACTIVITY} backHref={paths.home} showMyBooking={false} title="My booking">
      <Doodle name="web" className="absolute right-0 top-[60px] w-24 h-auto opacity-50 pointer-events-none" />
      <Banner booking={booking} />

      <Card className="flex flex-col -rotate-[0.6deg]">
        <span className="text-[15px] font-bold text-halloween-moon">YOU HAVE A BOOKING</span>
        <div className="mt-2.5 flex flex-col gap-0.5">
          <span className="text-[15px] text-halloween-gray">รอบที่ {round.round_no}</span>
          <span className="text-[34px] leading-[1.05] font-bold">{formatTimeRange(round.starts_at, round.ends_at)}</span>
        </div>
        <div className="my-3.5 border-t-2 border-dashed border-halloween-moon/45" />
        <span className="text-[17px] font-bold">ลงทะเบียนหน้างาน {formatTimeRange(round.checkin_opens_at, round.checkin_closes_at)}</span>
        <div className="mt-3.5 flex items-center gap-3.5">
          <div className="shrink-0 rounded-xl border-2 border-halloween-purple bg-halloween-purple/30 p-2">
            <BookingQR code={me.code} size={110} />
          </div>
          <span className="text-[15px] leading-relaxed text-halloween-gray">
            {me.full_name}
            <br />
            ยื่น QR นี้ที่จุดลงทะเบียน
          </span>
        </div>
      </Card>

      <div className="flex flex-col gap-1.5 text-[15px] leading-relaxed text-halloween-gray">
        <p>การจองนี้แก้ข้อมูล เปลี่ยนรอบ หรือยกเลิกไม่ได้</p>
        <p>มาไม่ทันเวลาปิดลงทะเบียน ถือว่าสละสิทธิ์</p>
      </div>
    </BookingPage>
  );
}
