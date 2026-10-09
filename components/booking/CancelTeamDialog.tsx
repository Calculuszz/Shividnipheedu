'use client';

import { useState } from 'react';
import { BookingApiError, cancelTeam } from '@/lib/bookingClient';
import { formatTimeRange } from '@/lib/bookingTime';
import type { PlayerStatus } from '@/lib/bookingTypes';
import { DialogButton, DialogError, DialogSheet, isStaleError, type DialogRound } from './DialogParts';
import { LeaderBadge, PlayerStatusChip } from './Status';

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
  /** ได้ TOO_LATE / NOT_CANCELLABLE / NOT_LEADER: ข้อมูลหน้าเก่าแล้ว หน้าควรเรียก find ใหม่ (dialog ยังโชว์ข้อความ error) */
  onStale?: () => void;
};

// 5c: ยกเลิกทั้งทีม (หัวหน้าเท่านั้น) POST /api/booking/cancel-team { code }
export default function CancelTeamDialog({ code, members, round, onDone, onClose, onStale }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // API ยกเลิกเฉพาะคนที่ยัง booked: คนที่เช็กอินแล้วอยู่ต่อ จึงโชว์และนับเฉพาะ booked
  const booked = members.filter((m) => m.status === 'booked');
  const stayNames = members.filter((m) => m.status === 'checked_in').map((m) => m.full_name);
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
      if (isStaleError(e)) onStale?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogSheet
      title="Cancel whole team?"
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <DialogButton variant="primary" disabled={busy} onClick={onClose}>
            Keep the team
          </DialogButton>
          <DialogButton variant="coral-outline" loading={busy} loadingText="กำลังยกเลิก…" onClick={onConfirm}>
            {`Yes, cancel all ${booked.length} seats`}
          </DialogButton>
        </>
      }
    >
      <p className="text-[13.6px] leading-[25.6px] text-halloween-cream/85">
        ที่นั่งของทุกคนด้านล่าง{inRound}จะถูกยกเลิก <b className="font-bold text-halloween-cream">กู้คืนไม่ได้</b> ทุกคนจะได้รับอีเมล
        “ทีมของคุณถูกยกเลิก” และจองรอบอื่นใหม่ได้ถ้ายังเปิดรับจอง
      </p>

      <ul className="rounded-2xl border border-halloween-purple/70 bg-halloween-purple/25 px-4 py-2.5">
        {booked.map((m, i) => (
          <li key={i} className="flex min-h-[33px] items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[13px] font-bold">{m.full_name}</span>
              {m.is_leader && <LeaderBadge />}
            </span>
            <PlayerStatusChip status={m.status} className="shrink-0" />
          </li>
        ))}
      </ul>

      {stayNames.length > 0 && (
        <p className="text-[13px] leading-[23px] text-halloween-cream/85">
          {stayNames.join(', ')} เช็กอินแล้ว จะไม่ถูกยกเลิก
        </p>
      )}

      {err && <DialogError>{err}</DialogError>}
    </DialogSheet>
  );
}
