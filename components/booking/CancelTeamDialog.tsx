'use client';

import { useState } from 'react';
import { BookingApiError, cancelTeam } from '@/lib/bookingClient';
import { formatTimeRange } from '@/lib/bookingTime';
import type { PlayerStatus } from '@/lib/bookingTypes';
import { DialogButton, DialogError, DialogSheet, type DialogRound } from './DialogParts';

type Member = { full_name: string; is_leader: boolean; status: PlayerStatus };

type Props = {
  code: string;
  members: Member[];
  /** data.round ของ find: ใช้แสดง "ในรอบ 17:50–18:10" */
  round?: DialogRound;
  /** ยกเลิกทั้งทีมสำเร็จ (หน้าเรียก find ใหม่ต่อเอง) */
  onDone: () => void;
  /** กดปิด / Keep the team */
  onClose: () => void;
};

const STATUS_LABEL: Record<string, string> = {
  booked: 'Booked',
  checked_in: 'Checked in',
  released: 'Released',
  cancelled: 'Cancelled',
  removed: 'Removed',
};

// 5c: ยกเลิกทั้งทีม (หัวหน้าเท่านั้น) POST /api/booking/cancel-team { code }
export default function CancelTeamDialog({ code, members, round, onDone, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // คนที่เช็กอินแล้วไม่ถูกยกเลิก จึงนับเฉพาะคนที่ยัง Booked
  const booked = members.filter((m) => m.status === 'booked').length;
  const seats = booked > 0 ? booked : members.length;
  const inRound = round ? `ในรอบ ${formatTimeRange(round.starts_at, round.ends_at)} ` : '';

  async function onConfirm() {
    setBusy(true);
    setErr('');
    try {
      await cancelTeam(code);
      onDone();
    } catch (e) {
      // e.message เป็นข้อความไทยพร้อมแสดง (NOT_LEADER, TOO_LATE, TRY_AGAIN ฯลฯ)
      setErr(e instanceof BookingApiError ? e.message : 'ระบบขัดข้อง ลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogSheet
      title="Cancel whole team?"
      onClose={onClose}
      footer={
        <>
          <DialogButton variant="primary" disabled={busy} onClick={onClose}>
            Keep the team
          </DialogButton>
          <DialogButton variant="coral-outline" loading={busy} loadingText="กำลังยกเลิก…" onClick={onConfirm}>
            {`Yes, cancel all ${seats} seats`}
          </DialogButton>
        </>
      }
    >
      <p className="text-[13.6px] leading-[25.6px] text-halloween-cream/85">
        ที่นั่งของทุกคนด้านล่าง{inRound}จะถูกยกเลิก <b className="font-bold text-halloween-cream">กู้คืนไม่ได้</b> ทุกคนจะได้รับอีเมล
        “ทีมของคุณถูกยกเลิก” และจองรอบอื่นใหม่ได้ถ้ายังเปิดรับจอง
      </p>

      <ul className="rounded-2xl border border-halloween-purple/70 bg-halloween-purple/25 px-4 py-2.5">
        {members.map((m, i) => (
          <li key={i} className="flex min-h-[33px] items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[13px] font-bold">{m.full_name}</span>
              {m.is_leader && (
                <span className="shrink-0 rounded-full bg-halloween-moon/15 px-2 py-0.5 text-[11px] font-bold text-halloween-moon">
                  Leader
                </span>
              )}
            </span>
            <span className="shrink-0 rounded-md bg-halloween-purple/50 px-2.5 py-1 text-xs font-bold text-halloween-cream/90">
              {STATUS_LABEL[m.status] ?? m.status}
            </span>
          </li>
        ))}
      </ul>

      {err && <DialogError>{err}</DialogError>}
    </DialogSheet>
  );
}
