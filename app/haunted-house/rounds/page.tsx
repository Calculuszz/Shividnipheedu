'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import Doodle from '@/components/Doodle';
import { BookingPage, Button, Card, CheckField, ErrorNotice, InfoNotice, RoundList } from '@/components/booking';
import { useBookingState, useRounds } from '@/hooks/useBooking';
import { checkStudent } from '@/lib/bookingClient';
import { roundPick } from '@/lib/bookingRules';
import { formatDateTh, formatTimeRange } from '@/lib/bookingTime';
import { ACTIVITY, REGISTER_POINT, ROUND_LABELS, paths, registerWindow, useStudent } from '../_shared';

// Page 3 of the brief: the round table, registration details and the advance-booking tick box.
export default function HauntedRoundsPage() {
  const student = useStudent();
  const state = useBookingState(ACTIVITY);
  const rounds = useRounds(ACTIVITY);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [alreadyBooked, setAlreadyBooked] = useState(false);

  // One booking per person: say so before they fill anything in
  useEffect(() => {
    if (!student) return;
    let alive = true;
    checkStudent(ACTIVITY, student.student_id)
      .then((taken) => alive && setAlreadyBooked(taken))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [student]);

  if (student === undefined || state.loading || rounds.loading) {
    return (
      <BookingPage activity={ACTIVITY} backHref={paths.rules}>
        <p role="status" className="py-6 text-center text-halloween-gray">กำลังโหลดรอบ…</p>
      </BookingPage>
    );
  }

  if (state.error || rounds.error || !state.data) {
    return (
      <BookingPage activity={ACTIVITY} backHref={paths.home}>
        <ErrorNotice title="โหลดข้อมูลไม่สำเร็จ">{(state.error ?? rounds.error)?.message ?? 'ลองโหลดหน้าใหม่อีกครั้ง'}</ErrorNotice>
      </BookingPage>
    );
  }

  if (state.data.state !== 'open') redirect(paths.home);

  if (!student) {
    return (
      <BookingPage activity={ACTIVITY} backHref={paths.home} title="Log in first">
        <InfoNotice title="เข้าสู่ระบบก่อนจอง">
          การจองใช้ชื่อและรหัสนิสิตจากตอนลงทะเบียนเข้างาน เข้าสู่ระบบด้วยรหัสนิสิตก่อน แล้วกลับมาที่เมนูบ้านผีสิง
        </InfoNotice>
        <Button href="/">Log in</Button>
      </BookingPage>
    );
  }

  const list = rounds.data?.rounds ?? [];
  const selected = list.find((r) => r.id === selectedId && roundPick(r, 1).selectable) ?? null;
  const { opens, closes } = registerWindow(state.data.activity);

  return (
    <BookingPage activity={ACTIVITY} backHref={paths.rules} step="Step 2 of 3" title="Choose a round">
      <Doodle name="moon" className="absolute right-5 top-[70px] w-10 rotate-[18deg] pointer-events-none" />
      {list[0] && (
        <p className="text-sm font-bold">
          {formatDateTh(list[0].starts_at)}
          <span className="ml-3 font-normal text-halloween-gray">ที่ว่างที่เห็น = ที่จองออนไลน์ (1 ที่ = 1 คน)</span>
        </p>
      )}

      {alreadyBooked ? (
        <Card className="flex flex-col gap-3">
          <h2 className="text-[17px] font-bold text-halloween-orange">คุณจองบ้านผีสิงไว้แล้ว</h2>
          <p className="text-[15px] leading-relaxed">1 คน จองได้ 1 สิทธิ์ ดูตั๋วได้ที่ My booking หรือในอีเมลยืนยัน</p>
          <Button href={paths.myBooking}>View my booking</Button>
        </Card>
      ) : (
        <>
          <RoundList rounds={list} teamSize={1} selectedId={selected?.id ?? null} onSelect={(r) => setSelectedId(r.id)} labels={ROUND_LABELS} />

          <Card className="flex flex-col gap-2.5">
            <h2 className="text-xl font-bold text-halloween-orange">ลงทะเบียนหน้างาน</h2>
            <ul className="flex flex-col gap-1.5 pl-5 list-disc marker:text-halloween-orange text-[15px] leading-relaxed">
              <li>มาลงทะเบียนได้ {opens} นาทีก่อนเวลาเล่น</li>
              <li>ปิดลงทะเบียน {closes} นาทีก่อนเวลาเล่นตามตาราง</li>
              <li className="font-bold text-halloween-error">มาช้ากว่าเวลาปิด ถือว่าสละสิทธิ์ทุกกรณี</li>
              <li>จุดลงทะเบียน: {REGISTER_POINT}</li>
            </ul>
          </Card>

          <CheckField id="hh-terms" checked={agreed} onChange={setAgreed}>
            รับทราบและยินยอมกับเงื่อนไขการจองลงทะเบียนล่วงหน้า
          </CheckField>

          <div className="flex flex-col gap-2 pb-4">
            {selected && (
              <p className="text-center text-[15px]">
                รอบที่ {selected.round_no} เล่น {formatTimeRange(selected.starts_at, selected.ends_at)}
              </p>
            )}
            {selected && agreed ? (
              <Button href={`${paths.book}?${new URLSearchParams({ round: selected.id })}`}>Next: your details</Button>
            ) : (
              <Button disabled>{selected ? 'ติ๊กยอมรับเงื่อนไขก่อน' : 'เลือกรอบก่อน'}</Button>
            )}
          </div>
        </>
      )}
    </BookingPage>
  );
}
