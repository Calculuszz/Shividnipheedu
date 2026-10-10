'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, redirect } from 'next/navigation';
import Doodle from '@/components/Doodle';
import { BookingPage, Button, Card, ErrorNotice, InfoNotice, RoundList } from '@/components/booking';
import { ALMOST_FULL_THRESHOLD } from '@/components/booking/RoundList';
import { useBookingState, useRounds } from '@/hooks/useBooking';
import { bookingPaths, isStudentId, roundPick } from '@/lib/bookingRules';
import { errorMessage } from '@/lib/bookingText';
import { formatDateEn, formatDayTimeTh, formatTimeRange } from '@/lib/bookingTime';
import type { Round } from '@/lib/bookingTypes';

const ACTIVITY = 'escape_room';

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-halloween-gray" aria-label="Seat availability legend">
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-[3px] bg-halloween-moon" aria-hidden="true" />
        ว่าง
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-[3px] bg-halloween-orange" aria-hidden="true" />
        เหลือน้อย (≤{ALMOST_FULL_THRESHOLD})
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-[3px] border-2 border-dashed border-halloween-error" aria-hidden="true" />
        เต็ม / ปิด
      </span>
    </div>
  );
}

function RoundPageContent() {
  const searchParams = useSearchParams();
  const stateResult = useBookingState(ACTIVITY);
  const roundsResult = useRounds(ACTIVITY);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const paths = bookingPaths(ACTIVITY);

  if (stateResult.loading || roundsResult.loading) {
    return (
      <BookingPage activity={ACTIVITY} backHref={paths.home}>
        <p role="status" className="py-6 text-center text-halloween-gray">Loading rounds…</p>
      </BookingPage>
    );
  }

  if (stateResult.error || roundsResult.error) {
    return (
      <BookingPage activity={ACTIVITY} backHref={paths.home}>
        {stateResult.error && <ErrorNotice title={stateResult.error.code}>{stateResult.error.message}</ErrorNotice>}
        {roundsResult.error && <ErrorNotice title={roundsResult.error.code}>{roundsResult.error.message}</ErrorNotice>}
      </BookingPage>
    );
  }

  const bookingState = stateResult.data;
  const rounds = roundsResult.data?.rounds ?? [];
  if (!bookingState) {
    return (
      <BookingPage activity={ACTIVITY} backHref={paths.home}>
        <InfoNotice>Booking information is unavailable. Please try again.</InfoNotice>
      </BookingPage>
    );
  }

  if (bookingState.state === 'not_open') redirect(paths.home);

  const teamSize = bookingState.activity.team_min;
  const readOnly = searchParams.get('view') === 'readonly';
  const walkin = !readOnly && bookingState.state === 'closed';
  const title = readOnly ? 'ROUNDS' : walkin ? 'WALK-IN ROUNDS' : 'PICK YOUR ROUND';
  const step = readOnly || walkin ? undefined : 'Step 1 of 2';
  const leader = searchParams.get('leader');
  const validLeader = leader !== null && isStudentId(leader);
  const selectedRound = rounds.find((round) => round.id === selectedId) ?? null;
  const selectedRoundIsPickable = selectedRound !== null && roundPick(selectedRound, teamSize).selectable;
  const effectiveSelectedId = selectedRoundIsPickable ? selectedId : null;
  const currentSelectedRound = selectedRoundIsPickable ? selectedRound : null;

  const durationMinutes = rounds.length > 0
    ? Math.round((Date.parse(rounds[0].ends_at) - Date.parse(rounds[0].starts_at)) / 60_000)
    : null;
  const continueHref = currentSelectedRound && validLeader
    ? `${paths.book}?${new URLSearchParams({ round: currentSelectedRound.id, leader }).toString()}`
    : undefined;

  function selectRound(round: Round) {
    setSelectedId(round.id);
  }

  // The Continue bar is fixed to the bottom of the screen
  const hasBar = !readOnly && !walkin && rounds.length > 0;

  return (
    <BookingPage activity={ACTIVITY} backHref={paths.home} bottomBar={hasBar}>
      <div className="relative flex flex-col gap-1.5">
        {step && <span className="text-[15px] font-bold text-halloween-moon">{step}</span>}
        <h1 className="display-font whitespace-nowrap pr-16 text-[34px] leading-[1.05] text-halloween-orange -rotate-2 origin-left">{title}</h1>
        <Doodle name="moon" className="absolute -right-1 -top-2 w-11 rotate-[18deg]" />
      </div>
      {rounds.length > 0 && durationMinutes !== null && (
        <div className="flex flex-col gap-1">
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold text-halloween-cream">
            <span>{formatDateEn(rounds[0].starts_at)}</span>
            <span className="font-normal text-halloween-gray">{durationMinutes} min / round</span>
          </p>
          {!readOnly && !walkin && bookingState.activity.booking_closes_at && (
            <p className="text-sm font-bold text-halloween-orange">
              Online booking closes at {formatDayTimeTh(bookingState.activity.booking_closes_at)}
            </p>
          )}
        </div>
      )}

      {walkin && (
        <>
          <InfoNotice title="Online booking closed — walk in at the booth">
            ปิดรับจองออนไลน์แล้ว{bookingState.activity.booking_closes_at
            ? ` (ปิดเวลา ${formatDayTimeTh(bookingState.activity.booking_closes_at)} น.)`
              : ''}{' '}รอบที่ยังมีที่นั่ง walk-in มาลงชื่อได้ที่บูธใต้อาคารวิศวฯ 100 ปี
          </InfoNotice>
          <div className="flex flex-col gap-1 text-sm leading-relaxed text-halloween-gray">
            <p>รอบที่ขึ้น <strong className="text-halloween-moon">Walk-in available</strong> ยังมีที่นั่ง walk-in มาลงชื่อที่บูธ (เลือกในหน้านี้ไม่ได้)</p>
            <p>1 คนเล่นได้ 1 รอบ</p>
          </div>
        </>
      )}

      {readOnly && (
        <Card className="flex flex-col gap-3" tone="orange">
          <div>
            <h2 className="text-[17px] font-bold text-halloween-orange">Already booked</h2>
            <p className="mt-1 text-sm leading-relaxed text-halloween-cream">{errorMessage('ALREADY_BOOKED')}</p>
          </div>
          <Button href={paths.myBooking}>View my booking</Button>
          <Button href={paths.home} variant="secondary" className="!text-halloween-orange">Back to home</Button>
        </Card>
      )}

      {readOnly && (
        <div className="flex flex-col gap-1 text-sm leading-relaxed text-halloween-gray">
          <p>ดูรอบได้อย่างเดียว เลือกไม่ได้</p>
          <p>ดูการจองของคุณด้วยรหัสส่วนตัวในอีเมลยืนยัน</p>
        </div>
      )}

      {!readOnly && !walkin && (
        <div className="flex flex-col gap-1 text-sm leading-relaxed text-halloween-gray">
          <p>รอบที่เต็มหรือปิดรับจองแล้วเลือกไม่ได้</p>
          <p>ที่นั่งที่แสดงคือที่นั่งจองออนไลน์ (1 ที่นั่ง = 1 คน)</p>
        </div>
      )}

      {rounds.length === 0 ? (
        <InfoNotice>ยังไม่มีรอบให้เลือกในขณะนี้</InfoNotice>
      ) : (
        <>
          {!walkin && <Legend />}
          {!readOnly && !walkin && !validLeader && (
            <ErrorNotice>
              ไม่พบรหัสนิสิตของหัวหน้าทีม กรุณากรอกรหัสนิสิตอีกครั้ง
              <span className="mt-2 block">
                <Button href={paths.start} variant="secondary">กลับไปกรอกรหัสนิสิต</Button>
              </span>
            </ErrorNotice>
          )}
          <RoundList
            rounds={rounds}
            teamSize={teamSize}
            selectedId={readOnly || walkin ? null : effectiveSelectedId}
            onSelect={selectRound}
            readOnly={readOnly || walkin}
            mode={walkin ? 'walkin' : 'online'}
          />
        </>
      )}

      {hasBar && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md rounded-t-[20px] border-t-2 border-halloween-orange bg-halloween-dark/95 p-4 shadow-[0_-12px_30px_rgba(26,2,41,0.7)] backdrop-blur-sm">
            <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
              <div className="min-w-0">
                {currentSelectedRound ? (
                  <>
                    <p className="text-xs text-halloween-gray">Round {currentSelectedRound.round_no}</p>
                    <p className="truncate text-base font-bold text-halloween-cream">
                      {formatTimeRange(currentSelectedRound.starts_at, currentSelectedRound.ends_at)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-halloween-gray">เลือกหนึ่งรอบเพื่อดำเนินการต่อ</p>
                )}
              </div>
              {currentSelectedRound && (
                <p className="shrink-0 text-right font-bold text-halloween-moon">
                  <span className="text-2xl">{currentSelectedRound.online_left}</span>
                  <span className="ml-1 text-xs">seats left</span>
                </p>
              )}
            </div>
            {continueHref ? (
              <Button href={continueHref}>Continue</Button>
            ) : (
              <Button disabled>Continue</Button>
            )}
          </div>
        </>
      )}
    </BookingPage>
  );
}

export default function EscapeRoomRoundsPage() {
  return (
    <Suspense fallback={null}>
      <RoundPageContent />
    </Suspense>
  );
}
