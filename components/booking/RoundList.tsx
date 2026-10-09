'use client';

import { RoundStamp, SeatCount } from '@/components/booking/Status';
import { roundPick } from '@/lib/bookingRules';
import { ROUND_STATUS_LABEL } from '@/lib/bookingText';
import { formatTimeRange } from '@/lib/bookingTime';
import type { Round, RoundStatus } from '@/lib/bookingTypes';

export const ALMOST_FULL_THRESHOLD = 3;

type RoundListMode = 'online' | 'walkin';

type RoundListProps = {
  rounds: Round[];
  teamSize: number;
  selectedId: string | null;
  onSelect: (round: Round) => void;
  readOnly?: boolean;
  mode?: RoundListMode;
  /** Wording per activity (Escape Room: "Round 3" / "Check-in … at the booth") */
  labels?: RoundLabels;
};

export type RoundLabels = {
  round: (roundNo: number) => string;
  checkin: (timeRange: string) => string;
};

const DEFAULT_LABELS: RoundLabels = {
  round: (n) => `Round ${n}`,
  checkin: (range) => `Check-in ${range} at the booth`,
};

export function SeatBars({ round }: { round: Round }) {
  const total = Math.max(0, round.online_cap);
  const remaining = Math.max(0, Math.min(round.online_left, total));
  const almostFull = remaining > 0 && remaining <= ALMOST_FULL_THRESHOLD;
  const fillColor = almostFull ? 'bg-halloween-orange' : 'bg-halloween-moon';

  return (
    <span
      className="grid w-[84px] shrink-0 gap-0.5"
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`h-2.5 w-full rounded-[2px] ${index < remaining ? fillColor : 'bg-halloween-purple/70'}`}
        />
      ))}
    </span>
  );
}

function RoundDetails({ round, mode, labels }: { round: Round; mode: RoundListMode; labels: RoundLabels }) {
  const isWalkin = mode === 'walkin';
  const showWalkinInfo = round.round_status === 'walkin_available';
  const hideCheckin = isWalkin && ['ended', 'in_progress', 'closed'].includes(round.round_status);

  return (
    <span className="flex min-w-0 flex-1 flex-col justify-center">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[17px] font-bold leading-tight text-halloween-cream">
          {formatTimeRange(round.starts_at, round.ends_at)}
        </span>
        <span className="rounded-md border border-halloween-purple px-1.5 py-0.5 text-[11px] font-bold leading-none text-halloween-gray">
          {labels.round(round.round_no)}
        </span>
      </span>

      {round.round_status === 'closed' ? (
        <span className="mt-1.5 text-xs leading-snug text-halloween-gray">{round.closed_reason || 'Closed'}</span>
      ) : isWalkin && round.round_status === 'ended' ? null : (
        <>
          {showWalkinInfo && <span className="mt-1.5 text-xs leading-snug text-halloween-gray">Walk-in seats at the booth</span>}
          {!hideCheckin && (
            <span className={`${showWalkinInfo ? 'mt-0.5' : 'mt-1.5'} text-xs leading-snug text-halloween-gray`}>
              {labels.checkin(formatTimeRange(round.checkin_opens_at, round.checkin_closes_at))}
            </span>
          )}
        </>
      )}
    </span>
  );
}

function isKnownStatus(status: RoundStatus) {
  return Object.prototype.hasOwnProperty.call(ROUND_STATUS_LABEL, status);
}

function fallbackStatus(status: RoundStatus) {
  return ROUND_STATUS_LABEL[status] ?? String(status);
}

export default function RoundList({
  rounds,
  teamSize,
  selectedId,
  onSelect,
  readOnly = false,
  mode = 'online',
  labels = DEFAULT_LABELS,
}: RoundListProps) {
  return (
    <div
      role={mode === 'online' ? 'radiogroup' : undefined}
      aria-label={mode === 'online' ? 'Choose a round' : undefined}
      className="flex flex-col gap-2.5"
    >
      {rounds.map((round) => {
        const isClosed = round.round_status === 'closed';
        const isFull = !isClosed && (
          round.round_status === 'full' ||
          (mode === 'online' && round.round_status === 'available' && round.online_left <= 0)
        );
        const selectable = mode === 'online' && roundPick(round, teamSize).selectable && !readOnly;
        const isSelected = selectable && selectedId === round.id;
        const hasSeats = mode === 'online' && round.round_status === 'available' && !isFull;
        const hasNormalAvailability = round.online_left > ALMOST_FULL_THRESHOLD;
        const disabled = !selectable;

        const borderStyle = mode === 'walkin'
          ? round.round_status === 'ended'
            ? 'border-2 border-halloween-purple bg-halloween-charcoal opacity-55'
            : round.round_status === 'closed' || isFull
              ? 'border-2 border-dashed border-halloween-error/80 bg-halloween-error/10'
            : round.round_status === 'in_progress'
                ? 'border-2 border-halloween-purple bg-halloween-charcoal'
                : 'border-2 border-halloween-purple bg-halloween-charcoal'
          : isClosed || isFull
            ? 'border-2 border-dashed border-halloween-error/80 bg-halloween-error/10'
            : isSelected
              ? 'border-2 border-halloween-orange bg-halloween-charcoal shadow-[0_0_0_2px_rgba(234,123,41,0.2)]'
              : 'border-2 border-halloween-purple bg-halloween-charcoal';

        const rightSide = hasSeats ? (
          <span className={`flex shrink-0 flex-col items-center gap-1 ${hasNormalAvailability ? '[&>span:first-child>span:first-child>span:first-child]:text-halloween-moon [&>span:first-child>span:last-child]:text-halloween-moon' : ''}`}>
            <SeatCount round={round} />
            <SeatBars round={round} />
          </span>
        ) : mode === 'walkin' && (round.round_status === 'available' || !isKnownStatus(round.round_status)) ? (
          <span className="w-[84px] shrink-0 text-center text-xs font-bold text-halloween-gray">
            {fallbackStatus(round.round_status)}
          </span>
        ) : !isKnownStatus(round.round_status) ? (
          <span className="w-[84px] shrink-0 text-center text-xs font-bold text-halloween-gray">
            {fallbackStatus(round.round_status)}
          </span>
        ) : (
          <span className={mode === 'walkin' && round.round_status === 'full' ? '[&>span>span:last-child]:whitespace-nowrap [&>span>span:last-child]:text-[11px]' : ''}>
            <RoundStamp
              status={isFull ? 'full' : round.round_status}
              note={
                mode === 'walkin' && round.round_status === 'full'
                  ? 'no walk-in seats'
                  : mode === 'online' && isFull
                    ? `0/${round.online_cap} left`
                    : undefined
              }
            />
          </span>
        );

        const compactWalkinStatus = mode === 'walkin' && ['ended', 'in_progress'].includes(round.round_status);
        const cardHeight = compactWalkinStatus ? 'min-h-14' : 'min-h-[88px]';
        const cardClassName = `flex ${cardHeight} w-full items-center gap-3 rounded-[12px_8px_14px_7px] px-3 py-3 text-left ${borderStyle}`;
        const contents = (
          <>
            {selectable && (
              <span
                aria-hidden="true"
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[2.5px] ${isSelected ? 'border-halloween-orange' : 'border-halloween-gray'}`}
              >
                {isSelected && <span className="h-3.5 w-3.5 rounded-full bg-halloween-orange" />}
              </span>
            )}
            <RoundDetails round={round} mode={mode} labels={labels} />
            {rightSide}
          </>
        );

        return mode === 'walkin' ? (
          <div key={round.id} className={cardClassName}>
            {contents}
          </div>
        ) : (
          <button
            key={round.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={() => onSelect(round)}
            className={`${cardClassName} transition-colors ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-halloween-orange'} disabled:opacity-100`}
          >
            {contents}
          </button>
        );
      })}
    </div>
  );
}
