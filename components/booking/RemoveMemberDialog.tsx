'use client';

import { useState } from 'react';
import { BookingApiError, removeMember } from '@/lib/bookingClient';
import { DialogButton, DialogError, DialogSheet, closesNote, type DialogRound } from './DialogParts';

type Props = {
  /** รหัสของหัวหน้าที่เปิดหน้าอยู่ */
  code: string;
  /** member.id มาจาก team[].id ของผล find (ไม่ใช่รหัสจอง) */
  member: { id: string; full_name: string };
  /** data.round ของ find: ใช้แสดงเวลาปิดเช็กอิน */
  round?: DialogRound;
  /** นำออกสำเร็จ (หน้าเรียก find ใหม่ต่อเอง) */
  onDone: () => void;
  /** กดปิด / Keep in team */
  onClose: () => void;
};

// 5f: นำสมาชิกออกจากทีม (หัวหน้าเท่านั้น) POST /api/booking/remove-member { code, player_id }
export default function RemoveMemberDialog({ code, member, round, onDone, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function onConfirm() {
    setBusy(true);
    setErr('');
    try {
      await removeMember(code, member.id);
      onDone();
    } catch (e) {
      // e.message เป็นข้อความไทยพร้อมแสดง (NOT_LEADER, CANNOT_REMOVE_LEADER, NOT_CANCELLABLE, NOT_FOUND, TOO_LATE ฯลฯ)
      setErr(e instanceof BookingApiError ? e.message : 'ระบบขัดข้อง ลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogSheet
      title={`Remove ${member.full_name}?`}
      onClose={onClose}
      footer={
        <>
          <DialogButton variant="primary" disabled={busy} onClick={onClose}>
            Keep in team
          </DialogButton>
          <DialogButton variant="coral-outline" loading={busy} loadingText="กำลังนำออก…" onClick={onConfirm}>
            Remove from team
          </DialogButton>
        </>
      }
    >
      <p className="text-[13.6px] leading-[25.6px] text-halloween-cream/85">
        {member.full_name} จะถูกนำออกจากทีม ที่นั่งถูกปล่อยทันที (สถานะ Removed) และจะได้รับอีเมล
        “คุณถูกนำออกจากทีม” เขาสามารถจองรอบอื่นเองได้{closesNote(round)}
      </p>

      {err && <DialogError>{err}</DialogError>}
    </DialogSheet>
  );
}
