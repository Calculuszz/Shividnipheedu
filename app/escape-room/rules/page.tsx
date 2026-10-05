'use client';

import { BookingPage, Card, ErrorNotice, Markdown } from '@/components/booking';
import LoadingScreen from '@/components/LoadingScreen';
import { CheckInRuleNotice, HealthCard, CONTACT_LINE } from '../_shared';
import { useBookingState } from '@/hooks/useBooking';
import { bookingPaths } from '@/lib/bookingRules';

const ACTIVITY = 'escape_room';
const paths = bookingPaths(ACTIVITY);

export default function RulesPage() {
  const state = useBookingState(ACTIVITY);

  if (state.loading) return <LoadingScreen message="กำลังโหลดข้อมูลกิจกรรม..." />;

  if (state.error || !state.data) {
    return (
      <BookingPage backHref={paths.home} showMyBooking={false}>
        <ErrorNotice title="โหลดข้อมูลไม่สำเร็จ">{state.error?.message ?? 'ลองโหลดหน้าใหม่อีกครั้ง'}</ErrorNotice>
      </BookingPage>
    );
  }

  const { activity } = state.data;

  return (
    <BookingPage backHref={paths.home} showMyBooking={false} title="Room rules">
      <Card tone="orange" className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-halloween-orange">กฎของห้อง</h2>
        <Markdown text={activity.rules_md} />

        <hr className="my-1 border-0 border-t-2 border-dashed border-halloween-cream/20" />

        <h2 className="text-xl font-bold text-halloween-orange">การเช็กอิน</h2>
        <ul className="pd-list flex flex-col gap-1.5 pl-5 list-disc marker:text-halloween-orange marker:font-bold text-base leading-relaxed">
          <li>1 QR เช็กอินได้ 1 คน</li>
          <li>1 คนเล่นได้ 1 รอบ</li>
        </ul>

        <CheckInRuleNotice activity={activity} />
      </Card>

      <HealthCard activity={activity} />

      <p className="text-center text-[15px] leading-normal text-halloween-gray">{CONTACT_LINE}</p>
    </BookingPage>
  );
}
