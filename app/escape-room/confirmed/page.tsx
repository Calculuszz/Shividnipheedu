'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Doodle from '@/components/Doodle';
import { BookingPage, BookingQR, Button, Card, LeaderBadge, PlayerStatusChip } from '@/components/booking';
import { useBookingState, useRounds } from '@/hooks/useBooking';
import { bookingPaths } from '@/lib/bookingRules';
import { readLastBooking, rememberCode } from '@/lib/bookingStorage';
import { formatDateEn, formatDayTimeTh, formatTime, formatTimeRange } from '@/lib/bookingTime';
import type { BookResult, Round } from '@/lib/bookingTypes';

const ACTIVITY = 'escape_room';
const paths = bookingPaths(ACTIVITY);

// Icons from the design
const ICONS: Record<string, ReactNode> = {
  Room: (
    <>
      <path d="M5.2 20.6V5.6A2.6 2.6 0 0 1 7.8 3h8.4a2.6 2.6 0 0 1 2.6 2.6v15" fill="#bbd03c" />
      <path d="M3 21h18" stroke="#bbd03c" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="15.4" cy="12.6" r="1.4" fill="#1a0229" />
      <path d="M15.4 13.4v2" stroke="#1a0229" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  Date: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.6" fill="#bbd03c" />
      <path d="M3 9.6V7.6A2.6 2.6 0 0 1 5.6 5h12.8A2.6 2.6 0 0 1 21 7.6v2z" fill="#ea7b29" />
      <path d="M8 3v4M16 3v4" stroke="#bbd03c" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  Round: (
    <>
      <path d="M19.2 12.5a7.2 7.2 0 1 1-2.3-5.6" fill="none" stroke="#bbd03c" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M18.4 3l.5 4.6-4.6.4" fill="none" stroke="#bbd03c" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12.3" r="2.4" fill="#ea7b29" />
    </>
  ),
  Location: (
    <>
      <path d="M12 22.2s-7.2-6.6-7.2-12.2a7.2 7.2 0 0 1 14.4 0c0 5.6-7.2 12.2-7.2 12.2z" fill="#bbd03c" />
      <circle cx="12" cy="10" r="2.9" fill="#ea7b29" />
    </>
  ),
  Players: (
    <>
      <path d="M13.4 20.6v-7.1a4.2 4.2 0 0 1 8.4 0v7.1l-1.4-1.1-1.4 1.1-1.4-1.1-1.4 1.1-1.4-1.1z" fill="#ea7b29" />
      <path d="M2.4 21.6V13a5 5 0 0 1 10 0v8.6l-1.7-1.3-1.6 1.3-1.7-1.3-1.6 1.3-1.7-1.3z" fill="#bbd03c" />
      <circle cx="5.9" cy="12.7" r="1.05" fill="#1a0229" />
      <circle cx="8.9" cy="12.7" r="1.05" fill="#1a0229" />
    </>
  ),
};

function Details({ rows }: { rows: [keyof typeof ICONS, string][] }) {
  return (
    <dl className="w-full">
      {rows.map(([term, value]) => (
        <div key={term} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b-2 border-dashed border-halloween-cream/30 px-0.5 py-2.5">
          <dt className="flex items-center gap-2.5 whitespace-nowrap text-lg font-bold text-halloween-moon">
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">{ICONS[term]}</svg>
            {term}
          </dt>
          <dd className="ml-auto whitespace-nowrap text-right text-lg font-bold text-halloween-cream">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Confirmed({ result }: { result: BookResult }) {
  const state = useBookingState(ACTIVITY);
  const rounds = useRounds(ACTIVITY);
  const round: Round | undefined = rounds.data?.rounds.find((r) => r.id === result.round_id);
  const activity = state.data?.activity;
  const count = result.players.length;

  const rows: [keyof typeof ICONS, string][] = [
    ['Room', activity?.room_name || activity?.name || 'Escape Room'],
    ...(round
      ? ([
          ['Date', formatDateEn(round.starts_at)],
          ['Round', `Round ${round.round_no} · ${formatTimeRange(round.starts_at, round.ends_at)}`],
        ] as [keyof typeof ICONS, string][])
      : []),
    ['Location', 'อาคารวิศวฯ 100 ปี คณะวิศวฯ'],
    ['Players', String(count)],
  ];

  return (
    <BookingPage activity={ACTIVITY}>
      <div className="flex flex-col items-center gap-3 px-1 pt-3 text-center">
        <Doodle name="pumpkin" className="w-[78px] h-auto -rotate-6" />
        <h1 className="display-font text-[40px] leading-[1.05] text-halloween-orange -rotate-2">You&apos;re booked!</h1>
        <span className="rounded-[4px_9px_5px_8px] bg-halloween-purple px-3.5 py-2 text-[15px] font-bold">
          Sent to {count} {count === 1 ? 'recipient' : 'recipients'}
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
        <div className="flex w-full flex-col gap-2.5 rounded-[12px_8px_14px_6px/8px_14px_6px_12px] border-[1.5px] border-halloween-purple bg-halloween-dark px-4 py-3.5">
          <span className="display-font origin-left -rotate-2 text-[22px] leading-tight text-halloween-orange">Check-in rule</span>
          <ol className="flex list-decimal flex-col gap-1.5 pl-[22px] text-base leading-normal marker:font-bold marker:text-halloween-orange">
            <li>ยืนยันสิทธิ์ = เช็กอินที่บูธภายในเวลาเช็กอินของรอบ</li>
            <li>มาไม่ทันถือว่าสละสิทธิ์ ที่นั่งจะถูกปล่อยให้ walk-in</li>
            <li>ยังมาเล่นแบบ walk-in ได้ถ้ารอบยังมีที่</li>
          </ol>
        </div>
      </Card>

      <Card className="flex flex-col gap-1 p-[18px]">
        <div className="flex items-center gap-2">
          <h2 className="flex-1 text-[19px] font-bold">Team</h2>
          <span className="text-sm text-halloween-gray">
            {count} {count === 1 ? 'person' : 'people'}
          </span>
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
          <p className="rounded-[12px_8px_14px_6px/8px_14px_6px_12px] border-[1.5px] border-halloween-purple bg-halloween-dark px-3.5 py-3 text-[15px] leading-relaxed">
            ย้ายรอบได้ถึงเวลาปิดรับจองล่วงหน้า ({formatDayTimeTh(activity.booking_closes_at)} น.)
          </p>
        )}
        <p className="rounded-[12px_8px_14px_6px/8px_14px_6px_12px] border-[1.5px] border-halloween-purple bg-halloween-dark px-3.5 py-3 text-[15px] leading-relaxed">
          ยกเลิกได้ถึงเวลาปิดเช็กอินของรอบ{round ? ` (${formatTime(round.checkin_closes_at)} น.)` : ''}
        </p>
      </Card>

      <Button href={paths.myBooking}>View my booking</Button>
      <Button href={paths.home} variant="secondary">Back to home</Button>
      <p className="mb-6 text-center text-sm leading-normal text-halloween-cream/80">
        ไม่ได้รับอีเมล? ตรวจสอบโฟลเดอร์ Junk หรือค้นหาด้วยรหัส {result.code}
      </p>
    </BookingPage>
  );
}

// 4: reads the book result from sessionStorage, none → home
export default function ConfirmedPage() {
  const router = useRouter();
  const [result, setResult] = useState<BookResult | null>(null);

  useEffect(() => {
    // Browser-only, read after mount
    let alive = true;
    void Promise.resolve().then(() => {
      if (!alive) return;
      const last = readLastBooking();
      if (!last?.code || !Array.isArray(last.players)) {
        router.replace(paths.home);
        return;
      }
      rememberCode(ACTIVITY, last.code);
      setResult(last);
    });
    return () => {
      alive = false;
    };
  }, [router]);

  if (!result) return null;
  return <Confirmed result={result} />;
}
