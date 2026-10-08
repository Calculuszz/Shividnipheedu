'use client';

import { useState, type ReactNode } from 'react';
import { BookingApiError, cancelSeat } from '@/lib/bookingClient';
import { formatTimeRange } from '@/lib/bookingTime';
import { DialogButton, DialogError, DialogSheet, closesNote, type DialogRound } from './DialogParts';

type Props = {
  code: string;
  isLeader: boolean;
  /** ชื่อหัวหน้าคนใหม่ (ใช้เมื่อ isLeader) */
  nextLeaderName?: string | null;
  /** data.round ของ find: ใช้แสดงเวลารอบและเวลาปิดเช็กอิน */
  round?: DialogRound;
  /** จำนวนคนในทีมตอนนี้ (รวมตัวเอง) ใช้แสดง "เพื่อนอีก N คน" / "ทั้ง N คน" */
  teamSize?: number;
  /** หัวหน้าเลือก "Cancel whole team" แล้วกดยืนยัน → หน้าปิด dialog นี้แล้วเปิด CancelTeamDialog (5c) */
  onChooseTeam?: () => void;
  /** ยกเลิกที่นั่งสำเร็จ (หน้าเรียก find ใหม่ต่อเอง) */
  onDone: () => void;
  /** กดปิด / Keep my booking */
  onClose: () => void;
};

type Choice = 'seat' | 'team';

function ChoiceCard({
  selected,
  onSelect,
  title,
  desc,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  desc: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex w-full gap-3 rounded-2xl border-2 px-3.5 py-3 text-left transition-colors ${
        selected ? 'border-halloween-error bg-halloween-error/10' : 'border-halloween-purple bg-halloween-purple/20'
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? 'border-halloween-error bg-halloween-error' : 'border-halloween-gray/60'
        }`}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-black/30" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-bold leading-[21px]">{title}</span>
        <span className={`mt-1 text-[12.7px] leading-[23.2px] ${selected ? 'text-halloween-cream/80' : 'text-halloween-gray'}`}>
          {desc}
        </span>
        {children}
      </span>
    </button>
  );
}

// 5e: ยกเลิกเฉพาะที่นั่งของตัวเอง POST /api/booking/cancel-seat { code }
// หัวหน้า (ส่ง onChooseTeam มา) จะเห็นตัวเลือก "Cancel my seat / Cancel whole team" ตามดีไซน์
export default function CancelSeatDialog({
  code,
  isLeader,
  nextLeaderName,
  round,
  teamSize,
  onChooseTeam,
  onDone,
  onClose,
}: Props) {
  const [choice, setChoice] = useState<Choice>('seat');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const showChooser = isLeader && !!onChooseTeam;
  const others = teamSize && teamSize > 1 ? `เพื่อนอีก ${teamSize - 1} คน` : 'เพื่อนที่เหลือในทีม';
  const roundText = round ? `รอบ ${formatTimeRange(round.starts_at, round.ends_at)}` : 'รอบเดิม';
  const seatDesc = `ออกจากทีม ที่นั่งของคุณถูกปล่อยทันที ${others}ยังเล่น ${roundText} ตามเดิม`;
  const teamDesc = `ยกเลิกที่นั่งของ${teamSize ? `ทั้ง ${teamSize} คน` : 'ทั้งทีม'} ทุกคนได้รับอีเมลแจ้ง (ดูรายชื่อในขั้นถัดไป)`;
  const leaderNote = isLeader && nextLeaderName ? `ทีมจะไม่ถูกยกเลิก — ${nextLeaderName} จะเป็นหัวหน้าทีมแทน` : '';

  async function onConfirm() {
    if (showChooser && choice === 'team') {
      onChooseTeam?.();
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await cancelSeat(code);
      onDone();
    } catch (e) {
      // e.message เป็นข้อความไทยพร้อมแสดง (TOO_LATE, NOT_CANCELLABLE, TRY_AGAIN ฯลฯ)
      setErr(e instanceof BookingApiError ? e.message : 'ระบบขัดข้อง ลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  const note = leaderNote ? (
    <span className="mt-2 block rounded-[10px] bg-white/10 px-3 py-2.5 text-[13px] font-bold leading-[23.2px]">{leaderNote}</span>
  ) : null;

  return (
    <DialogSheet
      title={showChooser ? 'Cancel what?' : 'Cancel my seat?'}
      compactTitle
      onClose={onClose}
      footer={
        <>
          <DialogButton
            variant="coral"
            loading={busy}
            loadingText="กำลังยกเลิก…"
            onClick={onConfirm}
          >
            {showChooser && choice === 'team' ? 'Cancel whole team' : 'Cancel my seat'}
          </DialogButton>
          <DialogButton variant="muted" disabled={busy} onClick={onClose}>
            Keep my booking
          </DialogButton>
        </>
      }
    >
      {showChooser ? (
        <>
          <p className="text-[12.7px] leading-[23.2px] text-halloween-cream/85">
            คุณเป็นหัวหน้าทีม เลือกได้ว่าจะยกเลิกเฉพาะที่นั่งของคุณ หรือยกเลิกทั้งทีม{closesNote(round)}
          </p>
          <div role="radiogroup" aria-label="Cancel what?" className="flex flex-col gap-4">
            <ChoiceCard
              selected={choice === 'seat'}
              onSelect={() => setChoice('seat')}
              title="Cancel my seat"
              desc={seatDesc}
            >
              {note}
            </ChoiceCard>
            <ChoiceCard
              selected={choice === 'team'}
              onSelect={() => setChoice('team')}
              title="Cancel whole team"
              desc={teamDesc}
            />
          </div>
        </>
      ) : (
        <>
          <p className="text-[12.7px] leading-[23.2px] text-halloween-cream/85">
            {seatDesc}
            {closesNote(round)}
          </p>
          {leaderNote && (
            <div className="rounded-[10px] bg-white/10 px-3 py-2.5 text-[13px] font-bold leading-[23.2px]">{leaderNote}</div>
          )}
        </>
      )}

      {err && <DialogError>{err}</DialogError>}
    </DialogSheet>
  );
}
