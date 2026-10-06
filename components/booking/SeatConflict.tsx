'use client';

import { useState } from 'react';
import Button from '@/components/booking/Button';
import Sheet from '@/components/booking/Sheet';
import { LeaderBadge } from '@/components/booking/Status';
import { formatTimeRange } from '@/lib/bookingTime';
import type { Round } from '@/lib/bookingTypes';

type Props = {
  /** NOT_ENOUGH_SEATS detail */
  seatsLeft: number;
  players: { full_name: string; is_leader: boolean }[];
  /** Kept indexes, ascending, leader included */
  onConfirm: (keepIndexes: number[]) => void;
  onPickRound: () => void;
  onCancel: () => void;
  /** Optional, for the round time in the text */
  round?: Pick<Round, 'starts_at' | 'ends_at'>;
};

const playersLabel = (n: number) => `${n} ${n === 1 ? 'player' : 'players'}`;

// 3d: remove players down to seatsLeft (leader stays) or change round
export default function SeatConflict({ seatsLeft, players, onConfirm, onPickRound, onCancel, round }: Props) {
  const [removed, setRemoved] = useState<Set<number>>(() => new Set());

  const found = players.findIndex((p) => p.is_leader);
  const leader = found === -1 ? 0 : found;
  const keep = Math.max(0, Math.min(seatsLeft, players.length));
  const toRemove = players.length - keep;
  // 0 seats: only change round
  const canReduce = keep >= 1;
  const ready = removed.size === toRemove;
  const roundText = round ? `รอบ ${formatTimeRange(round.starts_at, round.ends_at)}` : 'รอบนี้';

  const toggle = (index: number) =>
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const confirm = () => onConfirm(players.map((_, i) => i).filter((i) => !removed.has(i)));

  return (
    <Sheet
      open
      onClose={onCancel}
      title="ที่นั่งเต็มระหว่างที่คุณกรอกข้อมูล"
      footer={
        <>
          <Button variant="secondary" onClick={onPickRound}>Pick another round</Button>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        </>
      }
    >
      <p className="text-base leading-relaxed text-halloween-gray">
        {keep > 0 ? (
          <>
            {roundText} ตอนนี้เหลือ <b className="text-halloween-cream">{keep} ที่นั่ง</b> แต่ทีมของคุณมี {players.length} คน
          </>
        ) : (
          <>{roundText} ที่นั่งเต็มแล้ว</>
        )}{' '}
        ข้อมูลที่กรอกไว้ยังอยู่ครบ เลือกวิธีไปต่อ:
      </p>

      {canReduce && (
        <section className="flex flex-col gap-2.5 rounded-[18px] border-[2.5px] border-halloween-moon bg-halloween-purple/30 p-3.5">
          <h3 className="text-[17px] font-bold">Reduce to {playersLabel(keep)}</h3>
          {toRemove > 0 && <p className="text-sm text-halloween-gray">เลือกผู้เล่นที่จะนำออก {toRemove} คน</p>}
          <ul className="flex flex-col">
            {players.map((player, index) => {
              const last = index === players.length - 1 ? '' : 'border-b-[1.5px] border-dashed border-halloween-purple';
              if (index === leader) {
                return (
                  <li key={index} className={`flex items-center gap-3 py-2.5 ${last}`}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-halloween-moon font-bold text-halloween-dark">
                      {index + 1}
                    </span>
                    <span className="flex-1 font-bold">
                      {player.full_name} <LeaderBadge />
                    </span>
                    <span className="text-[13px] text-halloween-gray">อยู่ต่อเสมอ</span>
                  </li>
                );
              }
              const checked = removed.has(index);
              // Lock the rest once enough are ticked
              const locked = !checked && removed.size >= toRemove;
              return (
                <li key={index} className={`py-1 ${last}`}>
                  <label
                    className={`flex min-h-11 items-center gap-3 py-1 ${locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={locked}
                      onChange={() => toggle(index)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg border-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-halloween-moon ${checked ? 'border-halloween-moon bg-halloween-moon' : 'border-halloween-gray/80 bg-halloween-purple/30'}`}
                    >
                      {checked && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-halloween-dark">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      )}
                    </span>
                    <span className="text-[15px] leading-normal">
                      <b>Remove</b> {player.full_name}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <Button disabled={!ready} onClick={confirm}>
            Confirm with {playersLabel(keep)}
          </Button>
        </section>
      )}
    </Sheet>
  );
}
