'use client';

import { useState } from 'react';
import Button from '@/components/booking/Button';
import { ErrorNotice } from '@/components/booking/Card';
import { SeatBars } from '@/components/booking/RoundList';
import Sheet from '@/components/booking/Sheet';
import { RoundStamp, SeatCount } from '@/components/booking/Status';
import { useRounds } from '@/hooks/useBooking';
import { ALMOST_FULL, roundPick } from '@/lib/bookingRules';
import { formatDayTimeTh, formatTime, formatTimeRange } from '@/lib/bookingTime';
import type { ActivityId, Round } from '@/lib/bookingTypes';

type Props = {
  activity: ActivityId;
  /** Only rounds with online_left ≥ teamSize are pickable */
  teamSize: number;
  currentRoundId: string | null;
  /** Not booked yet, caller swaps round_id */
  onPick: (roundId: string) => void;
  onClose: () => void;
  /** Optional, shows the change deadline */
  bookingClosesAt?: string | null;
};

const DASHED = 'border-2 border-dashed border-halloween-error/65 bg-halloween-error/10';

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-sm text-halloween-gray" aria-hidden="true">
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-[3px] bg-halloween-moon" />
        ว่าง
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-[3px] bg-halloween-orange" />
        เหลือน้อย (≤{ALMOST_FULL})
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-[3px] border-2 border-dashed border-halloween-error" />
        เต็ม / ปิด
      </span>
    </div>
  );
}

/** RoundStamp style for "Not enough" */
function NotEnoughStamp({ round }: { round: Round }) {
  return (
    <span className="w-[84px] shrink-0 self-center flex flex-col items-center gap-1">
      <span className="display-font px-2 py-0.5 border-[2.5px] rounded-[6px_10px_5px_9px] text-xl leading-tight tracking-wider -rotate-[8deg] whitespace-nowrap text-halloween-error border-halloween-error">
        Not enough
      </span>
      <span className="text-[13px] font-bold text-halloween-error">
        {Math.max(round.online_left, 0)}/{round.online_cap} left
      </span>
    </span>
  );
}

type RowKind = 'pickable' | 'current' | 'not_enough' | 'blocked';

const TONE: Record<RowKind, string> = {
  pickable: 'border-2 border-halloween-purple bg-halloween-charcoal',
  current: 'border-2 border-halloween-purple/50 bg-halloween-dark/60 opacity-80',
  not_enough: DASHED,
  blocked: DASHED,
};
const SELECTED = 'border-2 border-halloween-orange bg-halloween-charcoal shadow-[0_0_0_3px_rgba(234,123,41,0.25)]';

function rowKind(round: Round, teamSize: number, current: boolean): RowKind {
  if (current) return 'current';
  const pick = roundPick(round, teamSize);
  if (pick.selectable) return 'pickable';
  return pick.reason === 'not_enough' ? 'not_enough' : 'blocked';
}

function RoundRow({
  round,
  teamSize,
  current,
  selected,
  onSelect,
}: {
  round: Round;
  teamSize: number;
  current: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const kind = rowKind(round, teamSize, current);
  const pickable = kind === 'pickable';
  const hasSeats = round.round_status === 'available' && round.online_left > 0;
  // available + 0 left = Full
  const stamp = round.round_status === 'available' ? 'full' : round.round_status;

  const note =
    kind === 'current' ? (
      <span className="font-bold text-halloween-orange">Current round</span>
    ) : kind === 'not_enough' ? (
      <span className="font-bold text-halloween-error">
        ที่นั่งไม่พอสำหรับ {teamSize} คน (เหลือ {round.online_left})
      </span>
    ) : kind === 'blocked' && (round.closed || round.round_status === 'closed') ? (
      round.closed_reason
    ) : null;

  const right =
    kind === 'not_enough' ? (
      <NotEnoughStamp round={round} />
    ) : hasSeats ? (
      <span className="flex shrink-0 flex-col items-center gap-1">
        <SeatCount round={round} />
        <SeatBars round={round} />
      </span>
    ) : (
      <RoundStamp status={stamp} note={stamp === 'full' ? `0/${round.online_cap} left` : undefined} />
    );

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={!pickable}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-[12px_8px_14px_6px/8px_14px_6px_12px] p-3.5 text-left transition-colors disabled:cursor-not-allowed ${selected ? SELECTED : TONE[kind]}`}
    >
      {pickable && (
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[2.5px] ${selected ? 'border-halloween-orange' : 'border-halloween-gray'}`}
        >
          {selected && <span className="h-3 w-3 rounded-full bg-halloween-orange" />}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className={`text-xl font-bold ${pickable || kind === 'current' ? 'text-halloween-cream' : 'text-halloween-cream/75'}`}>
            {formatTimeRange(round.starts_at, round.ends_at)}
          </span>
          <span className="rounded-[4px_9px_5px_8px] border-[1.5px] border-halloween-purple px-[7px] text-[13px] font-bold text-halloween-gray">
            Round {round.round_no}
          </span>
        </span>
        {note && <span className="text-sm leading-snug text-halloween-gray">{note}</span>}
      </span>
      {right}
    </button>
  );
}

// 3c: fetches rounds on every open
export default function ChangeRoundSheet({ activity, teamSize, currentRoundId, onPick, onClose, bookingClosesAt }: Props) {
  const { data, error, loading, refresh } = useRounds(activity);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rounds = data?.rounds ?? [];
  const selected = rounds.find((r) => r.id === selectedId && r.id !== currentRoundId && roundPick(r, teamSize).selectable) ?? null;

  return (
    <Sheet
      open
      onClose={onClose}
      title="Change round"
      footer={
        <>
          {bookingClosesAt && (
            <p className="text-sm text-halloween-gray">ย้ายรอบได้ถึงเวลาปิดรับจองล่วงหน้า ({formatDayTimeTh(bookingClosesAt)} น.)</p>
          )}
          <Button disabled={!selected} onClick={() => selected && onPick(selected.id)}>
            {selected ? `Move to ${formatTimeRange(selected.starts_at, selected.ends_at)}` : 'เลือกรอบใหม่'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-halloween-gray">
        {data && <>อัปเดตล่าสุด {formatTime(data.updated_at)} · </>}
        สำหรับทีม {teamSize} คน · ข้อมูลผู้เล่นที่กรอกไว้จะไม่หาย
      </p>

      {loading && !data ? (
        <p role="status" className="py-6 text-center text-halloween-gray">กำลังโหลดรอบ…</p>
      ) : error && !data ? (
        <ErrorNotice>
          {error.message}
          <span className="mt-2 block">
            <Button variant="secondary" onClick={() => void refresh()}>ลองใหม่</Button>
          </span>
        </ErrorNotice>
      ) : rounds.length === 0 ? (
        <p className="py-6 text-center text-halloween-gray">ยังไม่มีรอบให้เลือกในขณะนี้</p>
      ) : (
        <>
          <Legend />
          <div role="radiogroup" aria-label="Choose a round" className="flex flex-col gap-2.5">
            {rounds.map((round) => (
              <RoundRow
                key={round.id}
                round={round}
                teamSize={teamSize}
                current={round.id === currentRoundId}
                selected={round.id === selected?.id}
                onSelect={() => setSelectedId(round.id)}
              />
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}
