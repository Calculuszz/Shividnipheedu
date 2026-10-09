'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Doodle from '@/components/Doodle';
import { BookingPage, Button, Card, CheckField } from '@/components/booking';
import { ACTIVITY, BOOKING_RIGHTS, HealthRows, PLAY_RULES, acceptRules, paths } from '../_shared';

// Page 2 of the brief: booking rights, house rules, health warnings, then one tick box.
export default function HauntedRulesPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  const next = () => {
    acceptRules();
    router.push(paths.rounds);
  };

  return (
    <BookingPage activity={ACTIVITY} backHref={paths.home} showMyBooking={false} step="Step 1 of 3" title="House rules">
      <Doodle name="web" className="absolute right-0 top-[60px] w-24 h-auto opacity-50 pointer-events-none" />
      <Card className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-halloween-orange">สิทธิ์ในการจอง</h2>
        <ul className="flex flex-col gap-1.5 pl-5 list-disc marker:text-halloween-orange text-base leading-relaxed">
          {BOOKING_RIGHTS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>

        <hr className="my-1 border-0 border-t-2 border-dashed border-halloween-cream/20" />

        <h2 className="text-xl font-bold text-halloween-orange">กฎในการเล่น</h2>
        <ul className="flex flex-col gap-1.5 pl-5 list-disc marker:text-halloween-orange text-base leading-relaxed">
          {PLAY_RULES.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>

        <hr className="my-1 border-0 border-t-2 border-dashed border-halloween-cream/20" />

        <h2 className="text-xl font-bold text-halloween-orange">ข้อควรระวังในการเล่น</h2>
        <HealthRows />
      </Card>

      <CheckField id="hh-rules" checked={agreed} onChange={setAgreed}>
        ยืนยันและรับทราบเงื่อนไขและกติกาทั้งหมดในการเล่นบ้านผีสิง
      </CheckField>

      <Button onClick={next} disabled={!agreed}>
        Next: choose a round
      </Button>
    </BookingPage>
  );
}
