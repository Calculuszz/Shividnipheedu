import { BookingPage, Card } from '@/components/booking';
import { CONTACT_LINE, MoonCorner } from '../_shared';
import { bookingPaths } from '@/lib/bookingRules';

const paths = bookingPaths('escape_room');

export default function PrivacyPage() {
  return (
    <BookingPage backHref={paths.home} showMyBooking={false} title="Privacy policy">
      <MoonCorner />
      <Card tone="orange" className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-halloween-orange">ข้อมูลที่เก็บ</h2>
        <ul className="pd-list flex flex-col gap-1.5 pl-5 list-disc marker:text-halloween-orange marker:font-bold text-base leading-relaxed">
          <li>ผู้จองออนไลน์: ชื่อ รหัสนิสิต เบอร์โทร อีเมล รอบที่จอง และสถานะ (Booked / Checked in / Released / Cancelled / Removed)</li>
          <li>ผู้เล่น walk-in: ชื่อ รหัสนิสิต เบอร์โทร รอบที่เล่น และสถานะคิว</li>
        </ul>

        <hr className="my-1 border-0 border-t-2 border-dashed border-halloween-cream/20" />
        <h2 className="text-xl font-bold text-halloween-orange">ใช้เพื่ออะไร</h2>
        <ul className="pd-list flex flex-col gap-1.5 pl-5 list-disc marker:text-halloween-orange marker:font-bold text-base leading-relaxed">
          <li>ยืนยันว่าเป็นนิสิตจุฬาฯ และจัดที่นั่ง</li>
          <li>ส่งอีเมลยืนยัน แจ้งเตือน และแจ้งการเปลี่ยนแปลง</li>
          <li>เช็กอินที่บูธ และโทรติดต่อเมื่อใกล้ปิดเช็กอิน</li>
          <li>
            เก็บข้อมูล walk-in ไว้เพื่อป้องกันการเล่นซ้ำ
            <br />
            (1 คนเล่นได้ 1 รอบ)
          </li>
        </ul>

        <hr className="my-1 border-0 border-t-2 border-dashed border-halloween-cream/20" />
        <h2 className="text-xl font-bold text-halloween-orange">ใครเห็นข้อมูล</h2>
        <ul className="pd-list flex flex-col gap-1.5 pl-5 list-disc marker:text-halloween-orange marker:font-bold text-base leading-relaxed">
          <li>ทีมงาน Escape Room ที่ได้รับอนุญาตเท่านั้น</li>
          <li>เพื่อนในทีมเห็นเฉพาะชื่อและสถานะของกันและกัน ไม่เห็นรหัสการจองของคนอื่น</li>
        </ul>

        <hr className="my-1 border-0 border-t-2 border-dashed border-halloween-cream/20" />
        <h2 className="text-xl font-bold text-halloween-orange">ลบข้อมูลเมื่อไร</h2>
        <p className="text-base leading-relaxed">
          ข้อมูลทั้งหมดจะถูกลบภายใน <b>23 ตุลาคม 2569</b>
        </p>

        <hr className="my-1 border-0 border-t-2 border-dashed border-halloween-cream/20" />
        <h2 className="text-xl font-bold text-halloween-orange">ติดต่อ</h2>
        <p className="text-base leading-relaxed">ขอดู แก้ไข หรือลบข้อมูลได้ที่ Line ID : starter2157</p>
      </Card>

      <p className="text-center text-[15px] leading-normal text-halloween-gray">{CONTACT_LINE}</p>
    </BookingPage>
  );
}
