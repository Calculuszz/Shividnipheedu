'use client';

import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Doodle from '@/components/Doodle';
import { BookingPage, BookingQR, Button, Card, LeaderBadge, PlayerStatusChip } from '@/components/booking';
import { useBookingState, useRounds } from '@/hooks/useBooking';
import { bookingPaths } from '@/lib/bookingRules';
import { parseLastBooking, readLastBookingRaw, rememberCode } from '@/lib/bookingStorage';
import { formatDateEn, formatDayTimeTh, formatTime, formatTimeRange } from '@/lib/bookingTime';
import type { BookResult } from '@/lib/bookingTypes';
import { CheckInRuleNotice, VENUE_BUILDING, VENUE_FACULTY } from '../_shared';

const ACTIVITY = 'escape_room';
const paths = bookingPaths(ACTIVITY);

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// Server snapshot undefined = not read yet, avoids a hydration mismatch
const noSubscription = () => () => {};
const readLastRaw = () => readLastBookingRaw(ACTIVITY);
function useLastBooking() {
  const raw = useSyncExternalStore(noSubscription, readLastRaw, () => undefined);
  const result = useMemo(() => (raw === undefined ? undefined : parseLastBooking(raw)), [raw]);
  return result;
}

type Row = { icon: string; term: string; value: string };

function Details({ rows }: { rows: Row[] }) {
  return (
    <dl className="w-full">
      {rows.map(({ icon, term, value }) => (
        <div key={term} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b-2 border-dashed border-halloween-cream/30 px-0.5 py-2.5">
          <dt className="flex items-center gap-2.5 whitespace-nowrap text-lg font-bold text-halloween-moon">
            <Image src={`/icons/${icon}.svg`} alt="" width={26} height={26} />
            {term}
          </dt>
          <dd className="ml-auto text-right text-lg font-bold text-halloween-cream">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[12px_8px_14px_6px/8px_14px_6px_12px] border-[1.5px] border-halloween-purple bg-halloween-dark px-3.5 py-3 text-[15px] leading-relaxed">
      {children}
    </p>
  );
}

function Confirmed({ result }: { result: BookResult }) {
  const state = useBookingState(ACTIVITY);
  const rounds = useRounds(ACTIVITY);
  const round = rounds.data?.rounds.find((r) => r.id === result.round_id);
  const activity = state.data?.activity;
  const count = result.players.length;

  const rows: Row[] = [
    { icon: 'room', term: 'Room', value: activity?.room_name || activity?.name || 'Escape Room' },
    round && { icon: 'date', term: 'Date', value: formatDateEn(round.starts_at) },
    round && { icon: 'round', term: 'Round', value: `Round ${round.round_no} · ${formatTimeRange(round.starts_at, round.ends_at)}` },
    { icon: 'location', term: 'Location', value: `${VENUE_BUILDING} ${VENUE_FACULTY}` },
    { icon: 'players', term: 'Players', value: String(count) },
  ].filter((row): row is Row => Boolean(row));

  return (
    <BookingPage activity={ACTIVITY}>
      <div className="flex flex-col items-center gap-3 px-1 pt-3 text-center">
        <Doodle name="pumpkin" className="w-[78px] h-auto -rotate-6" />
        <h1 className="display-font text-[40px] leading-[1.05] text-halloween-orange -rotate-2">You&apos;re booked!</h1>
        <span className="rounded-[4px_9px_5px_8px] bg-halloween-purple px-3.5 py-2 text-[15px] font-bold">
          Sent to {plural(count, 'recipient')}
        </span>
        <p className="text-base leading-relaxed">
          {count === 1
            ? 'ส่งอีเมลยืนยันพร้อมรหัสและ QR ให้คุณแล้ว'
            : 'ทุกคนในทีมได้รับอีเมลยืนยันพร้อมรหัสและ QR ของตัวเอง'}
        </p>
      </div>

      <Card className="flex flex-col items-center gap-3 rounded-3xl px-5 py-[22px]">
        <span className="text-[15px] font-bold text-halloween-moon">YOUR PERSONAL CODE</span>
        <span className="display-font text-[40px] leading-none tracking-[3px]">{result.code}</span>
        <div className="rounded-[18px] border-2 border-halloween-purple bg-halloween-purple/30 p-3">
          <BookingQR code={result.code} size={196} />
        </div>
        {round && (
          <span className="rounded-[14px] bg-halloween-charcoal px-3.5 py-2.5 text-[17px] font-bold">
            Check-in {formatTimeRange(round.checkin_opens_at, round.checkin_closes_at)} at the booth
          </span>
        )}
        <p className="text-center text-[15px] leading-normal text-halloween-gray">
          QR นี้ใช้เช็กอินสำหรับคุณคนเดียว
          {count > 1 && (
            <>
              <br />
              เพื่อนแต่ละคนได้รหัสและ QR ของตัวเองทางอีเมล
            </>
          )}
        </p>
        <div className="my-1 w-full border-t-2 border-dashed border-halloween-purple" />
        {rounds.loading && !round ? (
          <p role="status" className="py-2 text-sm text-halloween-gray">กำลังโหลดข้อมูลรอบ…</p>
        ) : (
          <Details rows={rows} />
        )}
        {activity && (
          <div className="w-full">
            <CheckInRuleNotice activity={activity} tone="purple" />
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-1 p-[18px]">
        <div className="flex items-center gap-2">
          <h2 className="flex-1 text-[19px] font-bold">Team</h2>
          <span className="text-sm text-halloween-gray">{plural(count, 'person', 'people')}</span>
        </div>
        <ul>
          {result.players.map((player, index) => (
            <li key={index} className="flex items-center gap-2.5 border-b-[1.5px] border-dashed border-halloween-purple py-2.5 last:border-b-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-halloween-charcoal text-[15px] font-bold text-halloween-moon">
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                <span className="flex flex-wrap items-center gap-1.5 font-bold">
                  {player.full_name}
                  {player.is_leader && <LeaderBadge />}
                </span>
                <PlayerStatusChip status="booked" />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col gap-2.5 p-[18px]">
        <h2 className="text-[19px] font-bold">Changes &amp; cancelling</h2>
        {activity?.booking_closes_at && (
          <Note>ย้ายรอบได้ถึงเวลาปิดรับจองล่วงหน้า ({formatDayTimeTh(activity.booking_closes_at)} น.)</Note>
        )}
        <Note>ยกเลิกได้ถึงเวลาปิดเช็กอินของรอบ{round ? ` (${formatTime(round.checkin_closes_at)} น.)` : ''}</Note>
      </Card>

      <Button href={paths.myBooking}>View my booking</Button>
      <Button href={paths.home} variant="secondary">Back to home</Button>
      <p className="mb-6 text-center text-sm leading-normal text-halloween-cream/80">
        ไม่ได้รับอีเมล? ตรวจสอบโฟลเดอร์ Junk หรือค้นหาด้วยรหัส {result.code}
      </p>
    </BookingPage>
  );
}

// 4: shows the book result from sessionStorage, none → home
export default function ConfirmedPage() {
  const router = useRouter();
  const result = useLastBooking();

  useEffect(() => {
    if (result === null) router.replace(paths.home);
    else if (result) rememberCode(ACTIVITY, result.code);
  }, [result, router]);

  return result ? <Confirmed result={result} /> : null;
}
