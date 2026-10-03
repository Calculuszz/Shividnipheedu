'use client';

import { RoundStamp, SeatCount } from '@/components/booking/Status';
import { roundPick } from '@/lib/bookingRules';
import { formatTimeRange } from '@/lib/bookingTime';
import type { Round } from '@/lib/bookingTypes';

const ALMOST_FULL_THRESHOLD = 3;

type RoundListProps = {
  rounds: Round[];
  teamSize: number;
  selectedId: string | null;
  onSelect: (round: Round) => void;
  readOnly?: boolean;
};

function SeatBars({ round }: { round: Round }) {
  const total = Math.max(0, round.online_cap);
  const remaining = Math.max(0, Math.min(round.online_left, total));
  const almostFull = remaining > 0 && remaining <= ALMOST_FULL_THRESHOLD;
  const fillColor = almostFull ? 'bg-halloween-orange' : 'bg-halloween-moon';

  return (
    <span className="flex w-[84px] shrink-0 justify-center gap-0.5" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`h-2.5 min-w-0 flex-1 rounded-[2px] ${index < remaining ? fillColor : 'bg-halloween-purple/70'}`}
        />
      ))}
    </span>
  );
}

function RoundDetails({ round }: { round: Round }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col justify-center">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[17px] font-bold leading-tight text-halloween-cream">
          {formatTimeRange(round.starts_at, round.ends_at)}
        </span>
        <span className="rounded-md border border-halloween-purple px-1.5 py-0.5 text-[11px] font-bold leading-none text-halloween-gray">
          Round {round.round_no}
        </span>
      </span>
      <span className="mt-1.5 text-xs leading-snug text-halloween-gray">
        {round.round_status === 'closed'
          ? round.closed_reason || 'Closed'
          : `Check-in ${formatTimeRange(round.checkin_opens_at, round.checkin_closes_at)} at the booth`}
      </span>
    </span>
  );
}

export default function RoundList({ rounds, teamSize, selectedId, onSelect, readOnly = false }: RoundListProps) {
  return (
    <div role="radiogroup" aria-label="Choose a round" className="flex flex-col gap-2.5">
      {rounds.map((round) => {
        const isClosed = round.round_status === 'closed';
        const isFull = !isClosed && (round.round_status === 'full' || round.online_left <= 0);
        const selectable = roundPick(round, teamSize).selectable && !readOnly;
        const isSelected = selectable && selectedId === round.id;
        const hasSeats = round.round_status === 'available' && !isFull;
        const disabled = !selectable;

        const borderStyle = isClosed || isFull
          ? 'border-2 border-dashed border-halloween-error/80 bg-halloween-error/10'
          : isSelected
            ? 'border-2 border-halloween-orange bg-halloween-charcoal shadow-[0_0_0_2px_rgba(234,123,41,0.2)]'
            : 'border-2 border-halloween-purple bg-halloween-charcoal';

        return (
          <button
            key={round.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={() => onSelect(round)}
            className={`flex min-h-[88px] w-full items-center gap-3 rounded-[12px_8px_14px_7px] px-3 py-3 text-left transition-colors ${borderStyle} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-halloween-orange'} disabled:opacity-100`}
          >
            {selectable && (
              <span
                aria-hidden="true"
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[2.5px] ${isSelected ? 'border-halloween-orange' : 'border-halloween-gray'}`}
              >
                {isSelected && <span className="h-3.5 w-3.5 rounded-full bg-halloween-orange" />}
              </span>
            )}

            <RoundDetails round={round} />

            {hasSeats ? (
              <span className="flex shrink-0 flex-col items-center gap-1">
                <SeatCount round={round} />
                <SeatBars round={round} />
              </span>
            ) : (
              <RoundStamp
                status={isFull ? 'full' : round.round_status}
                note={isFull ? `0/${round.online_cap} left` : undefined}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
