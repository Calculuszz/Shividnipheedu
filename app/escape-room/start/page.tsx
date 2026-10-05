'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookingPage, Card, Button, ErrorNotice } from '@/components/booking';
import { TextField } from '@/components/booking';
import LoadingScreen from '@/components/LoadingScreen';
import { ChulaOnlyNote } from '../_shared';
import { BookingApiError, checkStudent } from '@/lib/bookingClient';
import { bookingPaths, isStudentId } from '@/lib/bookingRules';

const ACTIVITY = 'escape_room';
const paths = bookingPaths(ACTIVITY);

export default function StartBookingPage() {
  const router = useRouter();
  // undefined = still checking, null = confirmed not logged in, string = the id
  const [studentId, setStudentId] = useState<string | null>();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('studentId');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- must read client-only localStorage after mount (not derivable from props/render).
    setStudentId(id && isStudentId(id) ? id : null);
  }, []);

  if (studentId === undefined) return <LoadingScreen message="กำลังตรวจสอบการเข้าสู่ระบบ..." />;

  // No silent redirect: someone landing here without logging in first (e.g. a
  // direct link) should see why, not bounce to '/' with no explanation.
  if (studentId === null) {
    return (
      <BookingPage backHref={paths.home} title="Start booking">
        <Card tone="orange" className="flex flex-col gap-3.5 items-center text-center">
          <p className="text-base leading-relaxed">ต้องเข้าสู่ระบบด้วยรหัสนิสิตก่อน ถึงจะเริ่มจองได้</p>
          <Button href="/">ไปหน้าเข้าสู่ระบบ</Button>
        </Card>
      </BookingPage>
    );
  }

  async function handleCheck() {
    setError(null);
    setChecking(true);
    try {
      const taken = await checkStudent(ACTIVITY, studentId!);
      router.push(taken ? `${paths.rounds}?view=readonly` : `${paths.rounds}?leader=${encodeURIComponent(studentId!)}`);
    } catch (e) {
      setError(e instanceof BookingApiError ? e.message : 'ระบบขัดข้อง ลองใหม่อีกครั้ง');
      setChecking(false);
    }
  }

  return (
    <BookingPage backHref={paths.home} title="Start booking">
      <ChulaOnlyNote />

      <Card tone="orange" className="flex flex-col gap-3.5">
        <h2 className="text-xl font-bold">Your Student ID</h2>
        <p className="text-[15px] leading-relaxed text-halloween-gray">
          ตรวจก่อนว่าคุณยังไม่มีการจองอยู่ (1 คนจองได้ 1 รอบ) คุณจะเป็นหัวหน้าทีมของการจองนี้
        </p>
        <TextField id="sid" label="Student ID" required mono readOnly value={studentId} hint="รหัสนิสิต 10 หลัก" />
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <Button onClick={handleCheck} loading={checking} loadingText="กำลังตรวจสอบ…">
          Check
        </Button>
      </Card>

      <p className="text-center text-[15px] leading-normal text-halloween-gray px-2">
        ถ้ามีการจองอยู่แล้ว ดูหรือจัดการได้ที่{' '}
        <Link href={paths.myBooking} className="font-bold text-halloween-orange hover:text-halloween-moon">
          My booking
        </Link>{' '}
        ด้วยรหัสในอีเมลยืนยัน
      </p>
    </BookingPage>
  );
}
