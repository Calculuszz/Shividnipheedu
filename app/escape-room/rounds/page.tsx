'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams, redirect } from 'next/navigation';
import Doodle from '@/components/Doodle';
import { BookingPage, Button, Card, ErrorNotice, InfoNotice, RoundList } from '@/components/booking';
import { useBookingState, useRounds } from '@/hooks/useBooking';
import { BookingApiError, checkStudent } from '@/lib/bookingClient';
import { bookingPaths, isStudentId, roundPick } from '@/lib/bookingRules';
import { errorMessage } from '@/lib/bookingText';
import { formatDayTimeTh, formatTimeRange } from '@/lib/bookingTime';
import type { Round } from '@/lib/bookingTypes';
import { checkSession } from '@/lib/studentSession';
import { rulesAccepted } from '../_shared';

const ACTIVITY = 'escape_room';

function RoundPageContent() {
  const searchParams = useSearchParams();
  const stateResult = useBookingState(ACTIVITY);
  const roundsResult = useRounds(ACTIVITY);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkError, setCheckError] = useState('');
  const router = useRouter();
  const paths = bookingPaths(ACTIVITY);

  // Straight from "Book a slot": the logged-in student is the leader. Look up whether they
  // already have a booking (1 person, 1 round), then show the rounds to pick or to view.
  const needsCheck = !searchParams.get('leader') && searchParams.get('view') !== 'readonly';
  useEffect(() => {
    if (!needsCheck) return;
    if (!rulesAccepted()) {
      router.replace(bookingPaths(ACTIVITY).rules);
      return;
    }
    let alive = true;
    void (async () => {
      const user = await checkSession();
      const id = user === 'offline' ? localStorage.getItem('studentId') : user?.student_id;
      if (!alive) return;
      if (!id || !isStudentId(id)) {
        router.replace('/');
        return;
      }
      try {
        const taken = await checkStudent(ACTIVITY, id);
        const rounds = bookingPaths(ACTIVITY).rounds;
        if (alive) router.replace(taken ? `${rounds}?view=readonly` : `${rounds}?leader=${encodeURIComponent(id)}`);
      } catch (e) {
        if (alive) setCheckError(e instanceof BookingApiError ? e.message : errorMessage('SERVER_ERROR'));
      }
    })();
    return () => {
      alive = false;
    };
  }, [needsCheck, router]);

  if (needsCheck) {
    return (
      <BookingPage activity={ACTIVITY} backHref={paths.home}>
        {checkError
          ? <ErrorNotice>{checkError}</ErrorNotice>
          : <p role="status" className="py-6 text-center text-halloween-gray">Loading rounds…</p>}
      </BookingPage>
    );
  }

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
  const step = readOnly || walkin ? undefined : 'Step 2 of 3';
  const leader = searchParams.get('leader');
  const validLeader = leader !== null && isStudentId(leader);
  const selectedRound = rounds.find((round) => round.id === selectedId) ?? null;
  const selectedRoundIsPickable = selectedRound !== null && roundPick(selectedRound, teamSize).selectable;
  const effectiveSelectedId = selectedRoundIsPickable ? selectedId : null;
  const currentSelectedRound = selectedRoundIsPickable ? selectedRound : null;

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
      {rounds.length > 0 && !readOnly && !walkin && (
        <p className="text-sm text-halloween-gray">
          <b className="text-halloween-cream">หมายเหตุ:</b> ที่ว่างที่เห็นเป็นที่สำหรับจองออนไลน์เท่านั้น
          <br />
          ทุกรอบมีที่แยกไว้ให้สำหรับ walk-in
        </p>
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

      {rounds.length === 0 ? (
        <InfoNotice>ยังไม่มีรอบให้เลือกในขณะนี้</InfoNotice>
      ) : (
        <>
          {!readOnly && !walkin && !validLeader && (
            <ErrorNotice>
              ไม่พบรหัสนิสิตของหัวหน้าทีม
              <span className="mt-2 block">
                <Button href={paths.rounds} variant="secondary">เริ่มใหม่</Button>
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
