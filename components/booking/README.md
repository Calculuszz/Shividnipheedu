# Booking kit

ของที่ใช้ร่วมกันสำหรับหน้าจองทุกหน้า เปิดดูของจริงทุกชิ้นได้ที่ **http://localhost:3000/dev/booking-kit** (เฉพาะตอน `pnpm dev`)

## เรียก API → `lib/bookingClient.ts`

ไม่ต้องเขียน `fetch` เอง ทุกฟังก์ชันโยน `BookingApiError` ที่มี `.code`, `.detail` และ `.message` เป็นภาษาไทยพร้อมแสดง

```ts
import { book, checkStudent, findBooking, BookingApiError } from '@/lib/bookingClient';

try {
  const result = await book({ round_id, players, notes });
} catch (e) {
  if (e instanceof BookingApiError) {
    if (e.code === 'NOT_ENOUGH_SEATS') openSeatConflict(Number(e.detail));
    else setError(e.message);            // ข้อความไทยตาม PDF หัวข้อ 03
  }
}
```

| ฟังก์ชัน | ใช้ที่ |
|---|---|
| `getBookingState(activity)` | หน้า 1, 1b, 1d, ฟอร์ม (team_min / team_max) |
| `getRounds(activity)` | 2, 2b, 2c, 3b, 3c |
| `checkStudent(activity, studentId)` → `boolean` | 2a, ช่องรหัสในฟอร์ม |
| `book({ round_id, players, notes })` | ปุ่ม Confirm |
| `findBooking(code)` | 1c, 5a, 5b–5h |
| `changeRound(code, roundId)` · `cancelSeat(code)` · `cancelTeam(code)` · `removeMember(code, playerId)` | 5b, 5c, 5e, 5f |
| `staff.dashboard()` · `staff.attendance(roundId)` · `staff.search(text)` · `staff.checkInByCode(code)` · `staff.addWalkin(...)` ฯลฯ | หลังบ้าน |

Types ของทุก response อยู่ใน `lib/bookingTypes.ts`

## Hooks → `hooks/useBooking.ts`

```tsx
const { data, error, loading, refresh } = useRounds('escape_room');
// กด + เพิ่มผู้เล่น หรือก่อน Confirm → await refresh() ได้ตัวเลขล่าสุด
```

`useBookingState(activity)` · `useRounds(activity)` · `useMyBooking(code | null)` · `useNow()` (นาฬิกาที่เทียบกับเซิร์ฟเวอร์ ใช้นับถอยหลัง)

## Helper อื่น

| ไฟล์ | มีอะไร |
|---|---|
| `lib/bookingTime.ts` | `formatTime` "17:50" · `formatTimeRange` · `formatDateEn` "Thu 22 Oct 2026" · `formatDateTh` · `formatDayTimeTh` "20 ต.ค. 23:59" · `formatCountdown` "in 25 min" |
| `lib/bookingStorage.ts` | `rememberCode` / `getRememberedCode` / `forgetCode` (localStorage `booking:escape_room`) · `saveLastBooking` / `readLastBooking` (ฟอร์ม → หน้า 4) |
| `lib/bookingRules.ts` | `bookingPaths(activity)` path ทุกหน้า · `roundPick(round, teamSize)` รอบนี้เลือกได้ไหม · `maskStudentId` · `isStudentId` · `isEmail` |
| `lib/bookingText.ts` | `errorMessage(code, detail)` · ป้ายสถานะ `PLAYER_STATUS_LABEL`, `ROUND_STATUS_LABEL` |

## Components → `import { … } from '@/components/booking'`

| Component | ใช้ทำอะไร |
|---|---|
| `BookingPage` | กรอบหน้า: พื้นหลัง, ความกว้างมือถือ, header (Back + My booking), หัวข้อ `title` / `step` |
| `Card` (`tone`: orange / purple / danger / cream, `tape`, `tilt`) | กล่องขอบตัดมือทุกกล่อง |
| `StickyNote` · `InfoNotice` · `ErrorNotice` | โน้ตสีเขียว · กล่องแจ้งข้อมูล · กล่อง error |
| `Button` (`variant`: primary / secondary / danger / link, `href`, `loading`) | ปุ่มสูง 52px |
| `TextField` · `CheckField` | ช่องกรอก (มี `hint`, `error`) · ช่องติ๊ก PDPA / กฎ |
| `SeatCount` · `RoundStamp` | ด้านขวาของการ์ดรอบ: ตัวเลขที่นั่ง หรือตราประทับ Walk-in / Full / Closed / In progress / Ended |
| `PlayerStatusChip` · `LeaderBadge` | ป้าย Booked / Checked in / Released … · ป้าย Leader |
| `BookingQR` | QR ของรหัสการจอง (สตาฟสแกนที่บูธ) |
| `Markdown` | แสดง `details_md`, `rules_md`, `health_notice` อย่างปลอดภัย |
| `Sheet` | dialog ที่เลื่อนขึ้นจากด้านล่าง (3c, 3d, 5c, 5e, 5f) |

## กติกาที่ต้องจำ

- ห้ามเขียนตัวเลขกติกาเอง (ขนาดทีม, ที่นั่ง, เวลา) อ่านจาก API เสมอ
- ห้ามแสดงรหัสการจองของคนอื่น และห้ามใส่รหัสใน URL
- `ALREADY_BOOKED` ห้ามบอกว่าจองรอบไหน (`errorMessage` จัดการให้แล้ว)
- ไม่ใช้ Supabase Realtime: โหลดตอนเปิดหน้า กด + และกด Confirm พอ
