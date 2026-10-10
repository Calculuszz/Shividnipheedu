// The staff app is shared by the Escape Room and the Haunted House. They run the booth
// differently, so staff see each activity's own words: a team "เช็กอิน" at the Escape Room,
// one person "ลงทะเบียน" at the Haunted House (the words its brief and student pages use).

export type StaffActivity = 'escape_room' | 'haunted_house';

export type StaffWords = {
  title: string;
  /** One person per booking: no teams, leaders or team notes */
  solo: boolean;
  /** Verb on buttons and in sentences */
  checkin: string;
  checkedIn: string;
  /** Booked but didn't come before check-in closed */
  released: string;
  /** What the round itself is called next to its times */
  play: string;
  /** Label for the check-in window */
  desk: string;
  /** Where to send someone after check-in */
  waitAt: string;
  scanHint: string;
  /** Quick reasons for closing a round */
  closeReasons: string[];
};

export const STAFF_WORDS: Record<StaffActivity, StaffWords> = {
  escape_room: {
    title: 'Escape Room',
    solo: false,
    checkin: 'เช็กอิน',
    checkedIn: 'เช็กอินแล้ว',
    released: 'ถูกปล่อย',
    play: 'เล่น',
    desk: 'เช็กอินที่บูธ',
    waitAt: 'ให้รอหน้าห้องได้เลย',
    scanHint: 'สแกนทีละคน ทุกคนในทีมมี QR ของตัวเอง',
    closeReasons: ['พักสตาฟ', 'ห้องมีปัญหา'],
  },
  haunted_house: {
    title: 'Haunted House',
    solo: true,
    checkin: 'ลงทะเบียน',
    checkedIn: 'ลงทะเบียนแล้ว',
    released: 'สละสิทธิ์',
    play: 'เข้าบ้าน',
    desk: 'ลงทะเบียน',
    waitAt: 'ให้ไปรอหน้าทางเข้าบ้านผีสิง',
    scanHint: 'QR อยู่ในอีเมลยืนยัน และหน้า My booking',
    closeReasons: ['พักนักแสดง', 'บ้านมีปัญหา'],
  },
};
