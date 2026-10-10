'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Doodle from '@/components/Doodle';
import { BookingPage, BookingQR, Button, Card } from '@/components/booking';
import { useRounds } from '@/hooks/useBooking';
import { parseLastBooking, readLastBookingRaw } from '@/lib/bookingStorage';
import { formatDateTh, formatTimeRange } from '@/lib/bookingTime';
import type { BookResult } from '@/lib/bookingTypes';
import { ACTIVITY, REGISTER_POINT, paths } from '../_shared';

const noSubscription = () => () => {};
const readLastRaw = () => readLastBookingRaw(ACTIVITY);
function useLastBooking() {
  const raw = useSyncExternalStore(noSubscription, readLastRaw, () => undefined);
  return useMemo(() => (raw === undefined ? undefined : parseLastBooking(raw)), [raw]);
}

// Page 5 of the brief
export default function HauntedConfirmedPage() {
  const router = useRouter();
  const result = useLastBooking();

  useEffect(() => {
    // Reloaded in another tab / session ended: the ticket lives on My booking
    if (result === null) router.replace(paths.myBooking);
  }, [result, router]);

  if (!result) return null;
  return <Confirmed result={result} />;
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b-[1.5px] border-dashed border-halloween-purple py-2 last:border-b-0">
      <dt className="font-bold text-halloween-moon">{term}</dt>
      <dd className="text-right font-bold">{value}</dd>
    </div>
  );
}

function Confirmed({ result }: { result: BookResult }) {
  const rounds = useRounds(ACTIVITY);
  const round = rounds.data?.rounds.find((r) => r.id === result.round_id);
  const name = result.players[0]?.full_name ?? '';

  return (
    <BookingPage activity={ACTIVITY}>
      <div className="flex flex-col items-center gap-3 px-1 pt-3 text-center">
        <Doodle name="tombstone" className="w-[78px] h-auto -rotate-6" />
        <h1 className="display-font text-[40px] leading-[1.05] text-halloween-orange -rotate-2">You&apos;re booked!</h1>
        <span className="rounded-[4px_9px_5px_8px] bg-halloween-purple px-3.5 py-2 text-[15px] font-bold">ส่งตั๋วไปที่อีเมลแล้ว</span>
      </div>

      <Card className="flex flex-col items-center gap-3 rounded-3xl px-5 py-[22px]">
        <span className="text-[15px] font-bold text-halloween-moon">YOUR TICKET</span>
        {round && <span className="display-font text-[40px] leading-none">รอบที่ {round.round_no}</span>}
        <div className="rounded-[18px] border-2 border-halloween-purple bg-halloween-purple/30 p-3">
          <BookingQR code={result.code} size={176} />
        </div>
        <span className="text-[15px] text-halloween-gray">รหัส {result.code}</span>
        {round && (
          <span className="rounded-[14px] bg-halloween-dark px-3.5 py-2.5 text-[17px] font-bold">
            ลงทะเบียนหน้างาน {formatTimeRange(round.checkin_opens_at, round.checkin_closes_at)}
          </span>
        )}
        <p className="text-center text-[15px] text-halloween-gray">ยื่น QR นี้ที่จุดลงทะเบียน</p>
        <div className="my-1 w-full border-t-2 border-dashed border-halloween-purple" />
        <dl className="w-full">
          <Row term="ชื่อ" value={name} />
          {round && <Row term="วันที่" value={formatDateTh(round.starts_at)} />}
          {round && <Row term="เล่น" value={`${formatTimeRange(round.starts_at, round.ends_at)} น.`} />}
          <Row term="จุดลงทะเบียน" value={REGISTER_POINT} />
        </dl>
      </Card>

      <div className="flex flex-col gap-1.5 rounded-[12px_8px_14px_6px/8px_14px_6px_12px] border-[1.5px] border-halloween-orange bg-halloween-dark px-4 py-3.5">
        <span className="text-[17px] font-bold text-halloween-orange">อย่ามาสาย</span>
        <p className="text-[15px] leading-relaxed">
          การจองลงทะเบียนเข้าร่วมกิจกรรมบ้านผีสิงของท่านได้เสร็จสมบูรณ์แล้ว กรุณามาลงทะเบียนตามเวลาที่กำหนด
          และโปรดมาก่อนเวลาเล่นกิจกรรมขั้นต่ำ 10 นาที ไม่เช่นนั้นจะถือว่าสละสิทธิ์
        </p>
      </div>

      <Card className="flex flex-col gap-2 p-[18px]">
        <h2 className="text-[19px] font-bold">Changes &amp; cancelling</h2>
        <p className="text-[15px] leading-relaxed text-halloween-gray">การจองนี้แก้ข้อมูล เปลี่ยนรอบ หรือยกเลิกไม่ได้</p>
      </Card>

      <Button href={paths.myBooking}>View my booking</Button>
      <Button href="/menu" variant="secondary">
        Back to menu
      </Button>
      <p className="mb-6 text-center text-sm text-halloween-cream/80">ไม่ได้รับอีเมล? ดูในโฟลเดอร์ Junk หรือเปิดตั๋วจาก My booking</p>
    </BookingPage>
  );
}
