import type { PlayerStatus, RoundStatus } from '@/lib/bookingTypes';

// Thai copy for every error code the booking API can return (docs/booking-api.pdf, section 03).
// Pages show errorMessage(err) instead of writing their own text.

type Ctx = { teamMin?: number; teamMax?: number };

export function errorMessage(code: string, detail?: string, ctx: Ctx = {}): string {
  switch (code) {
    case 'INVALID_STUDENT_ID':
      return 'รหัสนิสิตต้องเป็นตัวเลข 10 หลัก';
    case 'INVALID_PLAYER':
      return 'กรอกช่องที่มี * ให้ครบทุกคน';
    case 'TEAM_SIZE':
      return ctx.teamMin && ctx.teamMax ? `ทีมละ ${ctx.teamMin}–${ctx.teamMax} คน` : 'จำนวนผู้เล่นไม่อยู่ในช่วงที่กำหนด';
    case 'DUPLICATE_IN_TEAM':
      return 'รหัสนิสิตซ้ำกับผู้เล่นคนอื่นในทีม';
    case 'ALREADY_BOOKED':
      // Never say which round: that would leak someone else's booking
      return 'รหัสนิสิตนี้มีการจองอยู่แล้ว (1 คนจองได้ 1 รอบ)';
    case 'NOT_ENOUGH_SEATS':
      return detail !== undefined ? `รอบนี้เหลือ ${detail} ที่นั่ง` : 'ที่นั่งไม่พอ';
    case 'BOOKING_NOT_OPEN':
      return 'ยังไม่เปิดรับจอง';
    case 'BOOKING_CLOSED':
      return 'ปิดรับจองออนไลน์แล้ว มา walk-in ที่บูธได้';
    case 'ROUND_CLOSED':
      return 'รอบนี้ปิดรับจองแล้ว เลือกรอบอื่นได้';
    case 'ROUND_NOT_FOUND':
      return 'ไม่พบรอบนี้ ลองโหลดหน้าใหม่';
    case 'NOT_FOUND':
      return 'ไม่พบการจองจากรหัสนี้ กรุณาตรวจสอบรหัสในอีเมลยืนยันอีกครั้ง';
    case 'NOT_LEADER':
      return 'เฉพาะหัวหน้าทีมทำรายการนี้ได้';
    case 'SAME_ROUND':
      return 'เป็นรอบปัจจุบันอยู่แล้ว';
    case 'TOO_LATE':
      return 'เลยเวลาเปลี่ยนแปลงการจองแล้ว';
    case 'NOT_CANCELLABLE':
      return 'ที่นั่งนี้ยกเลิกไม่ได้แล้ว';
    case 'CANNOT_REMOVE_LEADER':
      return 'หัวหน้าทีมนำตัวเองออกไม่ได้ ใช้ "ยกเลิกที่นั่งของฉัน" แทน';
    case 'TRY_AGAIN':
      return 'มีการเปลี่ยนแปลงการจองพร้อมกัน ลองใหม่อีกครั้ง';
    case 'CHECKIN_NOT_OPEN':
      return 'ยังไม่ถึงเวลาเช็กอินของรอบนี้';
    case 'CHECKIN_CLOSED':
      return 'เลยเวลาเช็กอินแล้ว ที่นั่งถูกปล่อย (walk-in ได้ถ้ามีที่)';
    case 'ALREADY_CHECKED_IN':
      return 'เช็กอินแล้ว';
    case 'TOO_EARLY':
      return 'ยังลบข้อมูลไม่ได้ ต้องรอให้รอบสุดท้ายจบก่อน';
    case 'CONFIRM_REQUIRED':
      return 'พิมพ์ข้อความยืนยันให้ถูกต้องก่อน';
    case 'RATE_LIMITED':
      return 'ลองหลายครั้งเกินไป รอสักครู่แล้วลองใหม่นะ';
    case 'UNAUTHORIZED':
      return 'หมดเวลาเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่';
    case 'NETWORK':
      return 'เชื่อมต่อไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
    case 'BAD_REQUEST':
      return 'ข้อมูลไม่ถูกต้อง ลองโหลดหน้าใหม่';
    default:
      return 'ระบบขัดข้อง ลองใหม่อีกครั้ง';
  }
}

export const PLAYER_STATUS_LABEL: Record<PlayerStatus, string> = {
  booked: 'Booked',
  checked_in: 'Checked in',
  released: 'Released',
  cancelled: 'Cancelled',
  removed: 'Removed',
};

export const ROUND_STATUS_LABEL: Record<RoundStatus, string> = {
  available: 'Available',
  full: 'Full',
  closed: 'Closed',
  walkin_available: 'Walk-in available',
  in_progress: 'In progress',
  ended: 'Ended',
};
