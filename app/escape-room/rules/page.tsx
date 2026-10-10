'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookingPage, Button, Card, CheckField, ErrorNotice, Markdown } from '@/components/booking';
import LoadingScreen from '@/components/LoadingScreen';
import { CheckInRuleNotice, HealthRows, MoonCorner, acceptRules } from '../_shared';
import { useBookingState } from '@/hooks/useBooking';
import { bookingPaths } from '@/lib/bookingRules';

const ACTIVITY = 'escape_room';
const paths = bookingPaths(ACTIVITY);

// Step 1 of booking (same as the Haunted House): booking rights, room rules,
// check-in and health warnings, then one tick box before picking a round.
export default function RulesPage() {
  const router = useRouter();
  const state = useBookingState(ACTIVITY);
  const [agreed, setAgreed] = useState(false);

  if (state.loading) return <LoadingScreen message="กำลังโหลดข้อมูลกิจกรรม..." />;

  if (state.error || !state.data) {
    return (
      <BookingPage backHref={paths.home} showMyBooking={false}>
        <MoonCorner />
        <ErrorNotice title="โหลดข้อมูลไม่สำเร็จ">{state.error?.message ?? 'ลองโหลดหน้าใหม่อีกครั้ง'}</ErrorNotice>
      </BookingPage>
    );
  }

  const { activity } = state.data;
  const next = () => {
    acceptRules();
    router.push(paths.rounds);
  };

  return (
    <BookingPage backHref={paths.home} showMyBooking={false} step="Step 1 of 3" title="Room rules">
      <MoonCorner />
      <Card tone="orange" className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-halloween-orange">สิทธิ์ในการจอง</h2>
        <ul className="pd-list flex flex-col gap-1.5 pl-5 list-disc marker:text-halloween-orange marker:font-bold text-base leading-relaxed">
          <li>จองได้เฉพาะนิสิตจุฬาลงกรณ์มหาวิทยาลัยเท่านั้น</li>
          <li>1 คนเล่นได้ 1 รอบ</li>
          <li>ทีมละ {activity.team_min}–{activity.team_max} คน</li>
        </ul>

        <hr className="my-1 border-0 border-t-2 border-dashed border-halloween-cream/20" />

        <h2 className="text-xl font-bold text-halloween-orange">กฎของห้อง</h2>
        <Markdown text={activity.rules_md} />

        <hr className="my-1 border-0 border-t-2 border-dashed border-halloween-cream/20" />

        <h2 className="text-xl font-bold text-halloween-orange">การเช็กอิน</h2>
        <ul className="pd-list flex flex-col gap-1.5 pl-5 list-disc marker:text-halloween-orange marker:font-bold text-base leading-relaxed">
          <li>
            เช็กอินที่บูธ เปิด {activity.checkin_opens_before_min} นาทีก่อนรอบ และเปิดนาน {activity.checkin_duration_min} นาที
          </li>
          <li>1 QR เช็กอินได้ 1 คน</li>
        </ul>

        <CheckInRuleNotice activity={activity} hideSummaryLine />

        {activity.health_notice && (
          <>
            <hr className="my-1 border-0 border-t-2 border-dashed border-halloween-cream/20" />
            <h2 className="text-xl font-bold text-halloween-orange">คำเตือนด้านสุขภาพ</h2>
            <HealthRows activity={activity} />
          </>
        )}
      </Card>

      <CheckField id="er-rules" checked={agreed} onChange={setAgreed}>
        ยืนยันและรับทราบกฎของห้องและคำเตือนด้านสุขภาพทั้งหมด
      </CheckField>

      <Button onClick={next} disabled={!agreed} arrow>
        Next: choose a round
      </Button>
    </BookingPage>
  );
}
