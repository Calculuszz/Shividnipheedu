'use client';

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import Link from 'next/link';
import { BookingPage, Card, Tape, InfoNotice, ErrorNotice, Button, PlayerStatusChip } from '@/components/booking';
import { ChulaOnlyNote, CheckInRuleNotice, HealthCard, CONTACT_LINE, VENUE_BUILDING, VENUE_FACULTY } from './_shared';
import Doodle from '@/components/Doodle';
import LoadingScreen from '@/components/LoadingScreen';
import { useBookingState, useRounds, useMyBooking } from '@/hooks/useBooking';
import { forgetCode, getRememberedCode } from '@/lib/bookingStorage';
import { bookingPaths } from '@/lib/bookingRules';
import { formatDateTh, formatDayTimeTh, formatTimeRange } from '@/lib/bookingTime';
import type { ActivityInfo, MyBooking, Round } from '@/lib/bookingTypes';

const ACTIVITY = 'escape_room';
const paths = bookingPaths(ACTIVITY);

// useSyncExternalStore (not useState+useEffect) to read localStorage: the server
// snapshot is null, so there's no hydration mismatch warning.
const noSubscription = () => () => {};
function useRememberedCode() {
  return useSyncExternalStore(noSubscription, () => getRememberedCode(ACTIVITY), () => null);
}

export default function EscapeRoomHome() {
  const code = useRememberedCode();

  const state = useBookingState(ACTIVITY);
  const rounds = useRounds(ACTIVITY);
  const myBooking = useMyBooking(code);

  useEffect(() => {
    // Remembered code no longer resolves to a booking (cancelled, expired) — stop asking for it.
    if (code && myBooking.error?.code === 'NOT_FOUND') forgetCode(ACTIVITY);
  }, [code, myBooking.error]);

  const stillChecking = state.loading || rounds.loading || (code !== null && myBooking.loading);
  if (stillChecking) return <LoadingScreen message="กำลังโหลดข้อมูลกิจกรรม..." />;

  if (state.error || !state.data) {
    return (
      <BookingPage backHref="/menu">
        <ErrorNotice title="โหลดข้อมูลกิจกรรมไม่สำเร็จ">
          {state.error?.message ?? 'ลองโหลดหน้าใหม่อีกครั้ง'}
        </ErrorNotice>
      </BookingPage>
    );
  }

  const { activity } = state.data;
  const myBookingData = code && !myBooking.error ? myBooking.data : null;

  return (
    <BookingPage backHref="/menu" footer={<Footer />}>
      <Hero />

      {myBookingData && <MyBookingSummary booking={myBookingData} />}

      <InfoGrid rounds={rounds.data?.rounds} />

      <ChulaOnlyNote />

      <RoomCard activity={activity} rounds={rounds.data?.rounds} />

      {!myBookingData && state.data.state === 'open' && (
        <div className="flex flex-col gap-2.5">
          <Button href={paths.start}>Book a slot</Button>
          {activity.booking_closes_at && (
            <p className="text-center text-[15px] leading-normal text-halloween-gray">
              Online booking closes at {formatDayTimeTh(activity.booking_closes_at)}
            </p>
          )}
        </div>
      )}

      {!myBookingData && state.data.state === 'closed' && (
        <div className="flex flex-col gap-2.5">
          <InfoNotice title="Online booking closed — walk in at the booth">
            ปิดรับจองออนไลน์แล้ว
            {activity.booking_closes_at ? ` (ปิดเวลา ${formatDayTimeTh(activity.booking_closes_at)} น.)` : ''} รอบที่ยังมีที่นั่ง
            walk-in มาลงชื่อได้ที่บูธใต้{VENUE_BUILDING} {VENUE_FACULTY}
          </InfoNotice>
          <Button href={paths.rounds}>See rounds with walk-in seats</Button>
        </div>
      )}

      {!myBookingData && state.data.state === 'not_open' && (
        <div className="flex flex-col gap-2.5">
          {activity.booking_opens_at && (
            <p className="text-center text-[17px] font-bold">
              Online booking opens {formatDayTimeTh(activity.booking_opens_at)}
            </p>
          )}
          <Button disabled>Book a slot</Button>
          <p className="text-center text-[15px] leading-normal text-halloween-gray">
            ยังไม่เปิดรับจอง — ปุ่มจะกดได้เมื่อถึงเวลาเปิด
          </p>
        </div>
      )}

      <HealthCard activity={activity} />

    </BookingPage>
  );
}

function Hero() {
  return (
    <div className="flex flex-col items-center gap-3.5 text-center pt-1 pb-1">
      <Doodle name="bat" className="w-9 h-auto -rotate-[10deg]" />
      <h1 className="display-font text-[56px] leading-[0.95] -rotate-3">
        <span className="block text-halloween-moon">ESCAPE</span>
        <span className="block text-halloween-orange">ROOM</span>
      </h1>
      <p className="display-font text-xl text-halloween-moon -rotate-2">
        Banshi <span className="text-sm">x</span> Vidva <span className="text-sm">x</span> Nitade
      </p>
    </div>
  );
}

function MyBookingSummary({ booking }: { booking: MyBooking }) {
  return (
    <Card tone="orange" className="flex flex-col gap-0 -rotate-[0.6deg]">
      <div className="flex items-center justify-between gap-2.5">
        <span className="text-[15px] font-bold text-halloween-moon">YOU HAVE A BOOKING</span>
        <PlayerStatusChip status={booking.me.status} />
      </div>
      <div className="flex items-end justify-between gap-2.5 mt-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] text-halloween-gray">Round {booking.round.round_no}</span>
          <span className="text-[34px] leading-[1.05] font-bold">
            {formatTimeRange(booking.round.starts_at, booking.round.ends_at)}
          </span>
        </div>
      </div>
      <div className="border-t-2 border-dashed border-halloween-moon/45 my-3.5" />
      <span className="flex items-center gap-2.5 text-[17px] font-bold">
        Check-in {formatTimeRange(booking.round.checkin_opens_at, booking.round.checkin_closes_at)}
      </span>
      <Button href={paths.myBooking} className="mt-3">
        View my booking
      </Button>
    </Card>
  );
}

function InfoGrid({ rounds }: { rounds?: Round[] }) {
  const first = rounds?.[0];
  const last = rounds?.[rounds.length - 1];
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Card tone="orange" tilt="left" className="flex gap-2.5 items-start">
        <Doodle name="moon" className="w-7 h-auto shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="display-font text-base text-halloween-moon">DATE</span>
          <span className="text-[15px] leading-tight font-bold">
            {first ? formatDateTh(first.starts_at) : '—'}
            <br />
            {first && last ? `${formatTimeRange(first.starts_at, last.ends_at)} น.` : ''}
          </span>
        </div>
      </Card>
      <Card tone="orange" tilt="right" className="flex gap-2.5 items-start">
        <Doodle name="pumpkin" className="w-8 h-auto shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="display-font text-base text-halloween-moon">LOCATION</span>
          <span className="text-[15px] leading-tight font-bold">
            {VENUE_BUILDING}
            <br />
            {VENUE_FACULTY}
          </span>
        </div>
      </Card>
    </div>
  );
}

// Copied from the design's inline SVGs — these aren't in the shared Doodle set.
const STAT_ICON: Record<string, ReactNode> = {
  'Play time': (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 -rotate-[5deg]">
      <path d="M6.5 3h11M6.5 21h11" stroke="#bbd03c" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M7.6 3.6c0 4 3 5.4 3 8.4s-3 4.4-3 8.4h8.8c0-4-3-5.4-3-8.4s3-4.4 3-8.4z" fill="#bbd03c" />
      <path d="M9.7 19.3c.6-1.9 1.3-2.7 2.3-2.7s1.7.8 2.3 2.7z" fill="#ea7b29" />
      <path d="M10.1 7.3h3.8L12 9.8z" fill="#ea7b29" />
    </svg>
  ),
  'Team size': (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 rotate-[4deg]">
      <path d="M13.4 20.6v-7.1a4.2 4.2 0 0 1 8.4 0v7.1l-1.4-1.1-1.4 1.1-1.4-1.1-1.4 1.1-1.4-1.1z" fill="#ea7b29" />
      <circle cx="16.5" cy="13.4" r=".85" fill="#1a0229" />
      <circle cx="18.9" cy="13.4" r=".85" fill="#1a0229" />
      <path d="M2.4 21.6V13a5 5 0 0 1 10 0v8.6l-1.7-1.3-1.6 1.3-1.7-1.3-1.6 1.3-1.7-1.3z" fill="#bbd03c" />
      <circle cx="5.9" cy="12.7" r="1.05" fill="#1a0229" />
      <circle cx="8.9" cy="12.7" r="1.05" fill="#1a0229" />
      <ellipse cx="7.4" cy="15.6" rx=".9" ry="1.2" fill="#1a0229" />
    </svg>
  ),
  Rounds: (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 -rotate-[3deg]">
      <path d="M19.2 12.5a7.2 7.2 0 1 1-2.3-5.6" fill="none" stroke="#bbd03c" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M18.4 3l.5 4.6-4.6.4" fill="none" stroke="#bbd03c" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12.3" r="2.4" fill="#ea7b29" />
    </svg>
  ),
  Price: (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 rotate-[5deg]">
      <g transform="rotate(-10 12 12)">
        <path
          d="M2.8 7.6A1.6 1.6 0 0 1 4.4 6h15.2a1.6 1.6 0 0 1 1.6 1.6v2.2a2.3 2.3 0 0 0 0 4.4v2.2a1.6 1.6 0 0 1-1.6 1.6H4.4a1.6 1.6 0 0 1-1.6-1.6v-2.2a2.3 2.3 0 0 0 0-4.4z"
          fill="#bbd03c"
        />
        <path d="M15.4 7.4v9.2" stroke="#1a0229" strokeWidth="1.4" strokeDasharray="1.5 1.5" />
        <path d="M7 10.2h5M7 13.4h3.4" stroke="#1a0229" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  ),
  'Check-in': (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 -rotate-[4deg]">
      <rect x="3" y="3" width="18" height="18" rx="3.2" fill="#bbd03c" />
      <path d="M6 6h4v4H6zM14 6h4v4h-4zM6 14h4v4H6z" fill="none" stroke="#1a0229" strokeWidth="1.7" />
      <path d="M14 14h2.2v2.2H14zM16.4 16.4h1.8v1.8h-1.8z" fill="#1a0229" />
    </svg>
  ),
};

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-3 py-2.5 border-b-2 border-dashed border-halloween-cream/25 last:border-b-0">
      <dt className="flex items-center gap-2.5 text-lg font-bold text-halloween-moon whitespace-nowrap">
        {STAT_ICON[label]}
        {label}
      </dt>
      <dd className="text-lg font-bold text-right">{value}</dd>
    </div>
  );
}

// The room's story from the brief, set in different voices so it reads like a scene
// (the room has no name, so there's no title above it).
function Story() {
  return (
    <div className="flex flex-col gap-2">
      <span className="display-font text-[17px] text-halloween-moon">THE ROOM</span>
      <p className="text-[22px] leading-snug font-bold text-halloween-moon">
        ทุกโรงเรียนมีเรื่องเล่า…
        <br />
        แต่โรงเรียนร้างแห่งนี้มี “รายชื่อ”
        <br />
        ที่ไม่เคยถูกลบออกไป
      </p>
      <p className="text-base leading-relaxed">
        พวกคุณคือ <b className="text-halloween-orange">ชมรมวิจัยสิ่งลี้ลับ</b> ที่ออกตามล่าเรื่องเหนือธรรมชาติ
        คืนนี้เป้าหมายคือโรงเรียนร้างที่ลือกันว่าผีดุที่สุดในย่าน ทุกคนเข้าไปด้วยความตื่นเต้น
        คิดว่าจะได้แค่ภาพและหลักฐานกลับไปทำรายงาน
      </p>
      <p className="text-[15px] italic text-halloween-gray">แต่เมื่อก้าวเข้าไปได้ไม่นาน ประตูก็ปิดลงด้านหลังอย่างเงียบงัน</p>
      <div className="relative mx-1.5 mt-3.5 mb-1 rotate-[1.2deg] rounded-[6px_14px_8px_16px] bg-halloween-moon p-4 text-[15px] leading-relaxed text-halloween-charcoal shadow-[0_10px_20px_-8px_rgba(0,0,0,0.5)]">
        <Tape className="left-1/2 -translate-x-1/2 -rotate-[4deg]" />
        ในห้องเรียนหนึ่ง พวกคุณพบ <b>ลิสต์รายชื่อ</b> ในนั้นมีชื่อของผู้ที่เคยเข้ามาในโรงเรียนนี้และไม่เคยได้ออกไปอีกเลย
        ทุกชื่อถูกขีดฆ่าด้วย<span className="font-bold text-[#b3261e]">หมึกสีแดง</span>ทีละคน ผ่านมาหลายสิบปี
        รายชื่อนั้นถูกเติมต่อเรื่อยมา
      </div>
      <div className="px-1 pt-3 pb-1 text-center">
        <p className="text-[15px] text-halloween-gray">เมื่อไล่ลงไปจนถึงบรรทัดสุดท้าย พวกคุณก็นิ่งงัน</p>
        <p className="mt-1.5 text-[21px] leading-snug font-bold text-halloween-orange -rotate-[1.5deg] [text-shadow:0_0_16px_rgba(234,123,41,0.4)]">
          ชื่อ 15 ชื่อสุดท้าย
          <br />
          คือชื่อของพวกคุณทุกคน
        </p>
        <p className="mt-1 text-base font-bold text-halloween-moon">และหมึกของมันยังไม่แห้ง</p>
      </div>
      <p className="text-base leading-relaxed">
        ทุกคนในรายชื่อก่อนหน้านี้ตายไปแล้วโดยฝีมือ “ใครบางคน” แต่ไม่มีใครรู้ว่าคือใคร
        มีเพียงเบาะแสว่าฆาตกรอยู่ในกลุ่มผีที่ยังวนเวียนอยู่ในโรงเรียน{' '}
        <b className="text-halloween-orange">
          ถ้าไม่หาตัวให้เจอ ชื่อของพวกคุณก็จะ<span className="line-through decoration-2">ถูกขีดฆ่า</span>ตามไปทีละคน
        </b>
      </p>
    </div>
  );
}

function RoomCard({ activity, rounds }: { activity: ActivityInfo; rounds?: Round[] }) {
  const first = rounds?.[0];
  const playMinutes = first ? Math.round((Date.parse(first.ends_at) - Date.parse(first.starts_at)) / 60_000) : null;

  return (
    <Card tone="orange" className="flex flex-col gap-4">
      <Story />
      <dl className="border-t-2 border-dashed border-halloween-cream/25">
        {playMinutes !== null && <StatRow label="Play time" value={`${playMinutes} min / round`} />}
        <StatRow label="Team size" value={`${activity.online_seats + activity.walkin_seats} players / round`} />
        {rounds && <StatRow label="Rounds" value={`${rounds.length} rounds`} />}
        <StatRow label="Price" value="Free" />
        <StatRow label="Check-in" value={`${activity.checkin_opens_before_min} min before`} />
      </dl>
      <CheckInRuleNotice activity={activity} />
      <div className="relative flex items-center justify-center gap-2.5 p-3 bg-halloween-moon text-halloween-charcoal rounded-[6px_14px_8px_16px] -rotate-1 shadow-[0_10px_20px_-8px_rgba(0,0,0,0.5)]">
        <Tape />
        <Doodle name="ghost" className="w-8 h-auto" />
        <span className="text-xl font-bold">1 คนจองได้ 1 รอบ</span>
      </div>
      <Link
        href={paths.rules}
        className="self-start flex items-center gap-1.5 min-h-11 text-base font-bold text-halloween-orange hover:text-halloween-moon"
      >
        Room rules &amp; health
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </Card>
  );
}

function Footer() {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center text-sm text-halloween-cream/80 pt-5 pb-2">
      <span>Banshi x Vidva x Nitade</span>
      <span>{CONTACT_LINE}</span>
      <span className="flex gap-3.5">
        <Link href={paths.rules} className="text-halloween-orange hover:text-halloween-moon">
          กฎของห้อง
        </Link>
        <Link href={paths.privacy} className="text-halloween-orange hover:text-halloween-moon">
          นโยบายความเป็นส่วนตัว
        </Link>
      </span>
    </div>
  );
}
