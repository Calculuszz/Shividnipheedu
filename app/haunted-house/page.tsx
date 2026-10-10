'use client';

import { useEffect, useSyncExternalStore } from 'react';
import Doodle from '@/components/Doodle';
import LoadingScreen from '@/components/LoadingScreen';
import { BookingPage, Button, Card, ErrorNotice, InfoNotice, StickyNote, Tape } from '@/components/booking';
import { useBookingState, useMyBooking, useRounds } from '@/hooks/useBooking';
import { forgetCode, getRememberedCode } from '@/lib/bookingStorage';
import { formatDateTh, formatDayTimeEn, formatDayTimeTh, formatTimeRange } from '@/lib/bookingTime';
import type { ActivityInfo, MyBooking, Round } from '@/lib/bookingTypes';
import { ACTIVITY, Hero, REGISTER_POINT, VENUE_BUILDING, VENUE_FACULTY, paths, playMinutes, registerWindow } from './_shared';

const noSubscription = () => () => {};
function useRememberedCode() {
  return useSyncExternalStore(noSubscription, () => getRememberedCode(ACTIVITY), () => null);
}

export default function HauntedHouseHome() {
  const code = useRememberedCode();
  const state = useBookingState(ACTIVITY);
  const rounds = useRounds(ACTIVITY);
  const myBooking = useMyBooking(code, ACTIVITY);

  useEffect(() => {
    // The remembered booking is gone (or was never valid): stop asking for it
    if (code && (myBooking.error?.code === 'NOT_FOUND' || myBooking.error?.code === 'WRONG_ACTIVITY')) forgetCode(ACTIVITY);
  }, [code, myBooking.error]);

  if (state.loading || rounds.loading || (code !== null && myBooking.loading)) {
    return <LoadingScreen message="กำลังเปิดประตูบ้าน..." />;
  }

  if (state.error || !state.data) {
    return (
      <BookingPage activity={ACTIVITY} backHref="/menu">
        <ErrorNotice title="โหลดข้อมูลกิจกรรมไม่สำเร็จ">{state.error?.message ?? 'ลองโหลดหน้าใหม่อีกครั้ง'}</ErrorNotice>
      </BookingPage>
    );
  }

  const { activity } = state.data;
  const list = rounds.data?.rounds ?? [];
  const booked = code && !myBooking.error ? myBooking.data : null;

  return (
    <BookingPage activity={ACTIVITY} backHref="/menu">
      <Hero />

      {booked && <MyBookingSummary booking={booked} />}

      <InfoGrid rounds={list} />

      <StickyNote title="Chula students only" className="mt-1.5">
        บ้านผีสิงสงวนสิทธิ์สำหรับนิสิตจุฬาลงกรณ์มหาวิทยาลัยเท่านั้น
      </StickyNote>

      <HouseCard activity={activity} rounds={list} />

      {!booked && state.data.state === 'open' && (
        <div className="flex flex-col gap-2.5">
          <Button href={paths.rules} arrow className="!text-xl">Book a round</Button>
          {activity.booking_closes_at && (
            <p className="text-center text-[15px] text-halloween-gray">
              Online booking closes {formatDayTimeEn(activity.booking_closes_at)}
            </p>
          )}
        </div>
      )}

      {!booked && state.data.state === 'not_open' && (
        <div className="flex flex-col gap-2.5">
          {activity.booking_opens_at && (
            <p className="text-center text-[17px] font-bold">Online booking opens {formatDayTimeEn(activity.booking_opens_at)}</p>
          )}
          <Button disabled>Book a round</Button>
          <p className="text-center text-[15px] text-halloween-gray">ยังไม่เปิดรับจอง ปุ่มจะกดได้เมื่อถึงเวลาเปิด</p>
        </div>
      )}

      {!booked && state.data.state === 'closed' && (
        <InfoNotice title="Online booking closed — walk in at the booth">
          ปิดรับจองออนไลน์แล้ว
          {activity.booking_closes_at ? ` (ปิดเวลา ${formatDayTimeTh(activity.booking_closes_at)} น.)` : ''} ทุกรอบเก็บที่ไว้ให้ walk-in
          และมีรอบสำหรับคนที่มา walk-in โดยเฉพาะ มาต่อคิวได้ที่{REGISTER_POINT}
        </InfoNotice>
      )}

      <Card className="flex flex-col gap-4">
        <h2 className="display-font text-2xl text-halloween-orange -rotate-2 origin-left">Health &amp; safety</h2>
        <div className="flex gap-3.5 items-start">
          <Doodle name="moon" className="w-9 h-auto shrink-0" />
          <div>
            <b className="text-[17px]">มืดและแคบ</b>
            <p className="text-[15px] text-halloween-gray">ไม่แนะนำสำหรับคนที่กลัวที่มืดและแคบ หรือมีภาวะวิตกกังวล</p>
          </div>
        </div>
        <div className="flex gap-3.5 items-start">
          <Doodle name="bat" className="w-9 h-auto shrink-0" />
          <div>
            <b className="text-[17px]">เสียงดัง แสงกะพริบ</b>
            <p className="text-[15px] text-halloween-gray">ไม่แนะนำสำหรับคนที่แพ้แสงกะพริบหรือเสียงดัง</p>
          </div>
        </div>
        <div className="flex gap-3.5 items-start">
          <Doodle name="ghost" className="w-9 h-auto shrink-0" />
          <div>
            <b className="text-[17px]">ตกใจแรง</b>
            <p className="text-[15px] text-halloween-gray">ไม่แนะนำสำหรับคนที่มีโรคหัวใจ ความดันผิดปกติ หรือลมชัก</p>
          </div>
        </div>
        <p className="px-3.5 py-3 rounded-[10px_16px_8px_14px] border-2 border-dashed border-halloween-orange text-[15px] leading-relaxed text-halloween-orange">
          <b>ไม่แนะนำสำหรับคนที่มีอาการเวียนหัว หน้ามืด หรือไม่สบาย</b>
        </p>
      </Card>
    </BookingPage>
  );
}

function MyBookingSummary({ booking }: { booking: MyBooking }) {
  return (
    <Card className="flex flex-col -rotate-[0.6deg]">
      <span className="text-[15px] font-bold text-halloween-moon">YOU HAVE A BOOKING</span>
      <div className="mt-2.5 flex flex-col gap-0.5">
        <span className="text-[15px] text-halloween-gray">รอบที่ {booking.round.round_no}</span>
        <span className="text-[34px] leading-[1.05] font-bold">{formatTimeRange(booking.round.starts_at, booking.round.ends_at)}</span>
      </div>
      <div className="my-3.5 border-t-2 border-dashed border-halloween-moon/45" />
      <span className="text-[17px] font-bold">
        ลงทะเบียนหน้างาน {formatTimeRange(booking.round.checkin_opens_at, booking.round.checkin_closes_at)}
      </span>
      <Button href={paths.myBooking} className="mt-3">
        View my booking
      </Button>
    </Card>
  );
}

function InfoGrid({ rounds }: { rounds: Round[] }) {
  const first = rounds[0];
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Card tilt="left" className="flex gap-2.5 items-start">
        <Doodle name="moon" className="w-7 h-auto shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="display-font text-base text-halloween-moon">DATE</span>
          <span className="text-[15px] leading-tight font-bold">
            {first ? formatDateTh(first.starts_at) : '—'}
            <br />
            16:30–21:00 น.
          </span>
        </div>
      </Card>
      <Card tilt="right" className="flex gap-2.5 items-start">
        <Doodle name="tombstone" className="w-8 h-auto shrink-0" />
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-3 py-2.5 border-b-2 border-dashed border-halloween-cream/25 last:border-b-0">
      <dt className="text-lg font-bold text-halloween-moon">{label}</dt>
      <dd className="text-lg font-bold text-right">{value}</dd>
    </div>
  );
}

function HouseCard({ activity, rounds }: { activity: ActivityInfo; rounds: Round[] }) {
  const minutes = playMinutes(rounds[0]);
  const { opens, closes } = registerWindow(activity);
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="display-font text-[17px] text-halloween-moon">THE HOUSE</span>
        <p className="text-[22px] leading-snug font-bold text-halloween-moon">
          บ้านหลังหนึ่ง
          <br />
          ที่เปลี่ยนผู้คนไปตามกาลเวลา
        </p>
        <p className="text-base leading-relaxed">
          ทุกยุคมีเรื่องราวที่แตกต่างกัน แต่ไม่ว่าคนจะย้ายเข้าหรือย้ายออก{' '}
          <b className="text-halloween-orange">บ้านหลังนี้กลับไม่เคยปล่อยให้ใครจากไปจริง ๆ</b>
        </p>
        <div className="relative mx-1.5 mt-3.5 mb-1 rotate-[1.2deg] rounded-[6px_14px_8px_16px] bg-halloween-moon p-4 text-[15px] leading-relaxed text-halloween-charcoal shadow-[0_10px_20px_-8px_rgba(0,0,0,0.5)]">
          <Tape className="left-1/2 -translate-x-1/2 -rotate-[4deg]" />
          เมื่อเรื่องราวของแต่ละยุคค่อย ๆ ถูกเปิดเผย รายละเอียดเล็ก ๆ ที่เชื่อมโยงกันก็เริ่มปรากฏขึ้น ราวกับมีบางสิ่งกำลังตามทวงสิ่งที่เป็นของมันคืน
        </div>
        <div className="relative overflow-hidden px-1 pt-4 pb-1.5 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pick-a-boo/smoke.webp" alt="" className="pointer-events-none absolute left-1/2 top-0 h-full w-auto -translate-x-1/2 opacity-20" />
          <p className="relative text-[15px] text-halloween-gray">และดูเหมือนว่า…</p>
          <p className="relative mt-1 text-[21px] leading-snug font-bold text-halloween-orange -rotate-[1.5deg] [text-shadow:0_0_16px_rgba(229,56,59,0.4)]">
            บ้านหลังนี้ไม่เคยเป็นของ
            <br />
            คนที่เข้ามาอยู่เลย
          </p>
        </div>
      </div>

      <dl className="border-t-2 border-dashed border-halloween-cream/25">
        {minutes !== null && <Stat label="Play time" value={`${minutes} min / round`} />}
        <Stat label="Players" value={`${activity.online_seats + activity.walkin_seats} / round`} />
        <Stat label="Book online" value={`${activity.online_seats} / round`} />
        <Stat label="Walk-in" value={`${activity.walkin_seats} / round`} />
        <Stat label="Rounds" value={`${rounds.length} rounds`} />
      </dl>

      <InfoNotice className="!bg-halloween-dark">
        <span className="display-font text-[22px] leading-tight text-halloween-orange -rotate-2 inline-block origin-left">Register rule</span>
        <p className="mt-2">
          ลงทะเบียนที่{REGISTER_POINT} เปิด {opens} นาทีก่อนรอบ และปิด {closes} นาทีก่อนรอบ
        </p>
        <ol className="mt-2 flex flex-col gap-1.5 pl-5 list-decimal marker:text-halloween-orange marker:font-bold">
          <li>มาลงทะเบียนก่อนเวลาเล่นอย่างน้อย {closes} นาที</li>
          <li>มาไม่ทัน ถือว่าสละสิทธิ์ทุกกรณี</li>
          <li>จองแล้ว เปลี่ยนรอบหรือยกเลิกไม่ได้</li>
        </ol>
      </InfoNotice>

      <StickyNote className="!flex-row items-center justify-center gap-2.5 rotate-1">
        <span className="flex items-center gap-2.5">
          <Doodle name="ghost" className="w-8 h-auto" />
          <b className="text-lg">1 คน จองได้ 1 สิทธิ์</b>
        </span>
      </StickyNote>
    </Card>
  );
}
