import { ALMOST_FULL } from '@/lib/bookingRules';
import { PLAYER_STATUS_LABEL, ROUND_STATUS_LABEL } from '@/lib/bookingText';
import type { PlayerStatus, Round, RoundStatus } from '@/lib/bookingTypes';

const PLAYER_STYLE: Record<PlayerStatus, string> = {
  booked: 'bg-halloween-purple/40 text-halloween-cream border-halloween-purple',
  checked_in: 'bg-halloween-moon text-halloween-dark border-halloween-moon',
  released: 'bg-halloween-error/10 text-halloween-error border-halloween-error',
  cancelled: 'bg-transparent text-halloween-gray border-halloween-gray/60',
  removed: 'bg-transparent text-halloween-gray border-halloween-gray/60',
};

/** Booked / Checked in / Released / Cancelled / Removed */
export function PlayerStatusChip({ status, className = '' }: { status: PlayerStatus; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-[4px_9px_5px_8px] border-[1.5px] text-[13px] font-bold whitespace-nowrap ${PLAYER_STYLE[status]} ${className}`}>
      {PLAYER_STATUS_LABEL[status]}
    </span>
  );
}

/** Small lime "Leader" tag next to a name */
export function LeaderBadge({ you }: { you?: boolean }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px_9px_5px_8px] bg-halloween-charcoal text-halloween-moon text-xs font-bold whitespace-nowrap align-middle">
      Leader{you ? ' (you)' : ''}
    </span>
  );
}

/**
 * Right-hand side of a round card when there is no seat number to show:
 * rubber stamps for Walk-in available / Full / Closed, a pill for In progress,
 * grey text for Ended. Returns null for 'available' (show <SeatCount> instead).
 */
export function RoundStamp({ status, note }: { status: RoundStatus; note?: string }) {
  if (status === 'available') return null;
  if (status === 'ended') {
    return <span className="w-[84px] self-center text-center text-[15px] font-bold text-halloween-gray">{ROUND_STATUS_LABEL.ended}</span>;
  }
  if (status === 'in_progress') {
    return (
      <span className="w-[84px] self-center flex items-center justify-center">
        <span className="px-2.5 py-0.5 rounded-[4px_9px_5px_8px] bg-halloween-orange text-halloween-dark text-sm font-bold whitespace-nowrap">
          {ROUND_STATUS_LABEL.in_progress}
        </span>
      </span>
    );
  }
  const lime = status === 'walkin_available';
  const color = lime ? 'text-halloween-moon border-halloween-moon' : 'text-halloween-error border-halloween-error';
  return (
    <span className="w-[84px] shrink-0 self-center flex flex-col items-center gap-1">
      <span className={`display-font px-2 py-0.5 border-[2.5px] rounded-[6px_10px_5px_9px] text-xl leading-tight tracking-wider -rotate-[8deg] whitespace-nowrap ${color}`}>
        {lime ? 'Walk-in' : ROUND_STATUS_LABEL[status]}
      </span>
      {(lime || note) && <span className={`text-[13px] font-bold ${lime ? 'text-halloween-moon' : 'text-halloween-error'}`}>{lime ? 'available' : note}</span>}
    </span>
  );
}

/** "6 /12 seats left" — orange "Almost full" at 3 or fewer, red "Full" at 0. */
export function SeatCount({ round, notEnoughFor }: { round: Pick<Round, 'online_left' | 'online_cap'>; notEnoughFor?: number }) {
  const left = Math.max(round.online_left, 0);
  const full = left === 0;
  const short = !full && notEnoughFor !== undefined && left < notEnoughFor;
  const almost = !full && left <= ALMOST_FULL;
  const tone = full || short ? 'text-halloween-error' : almost ? 'text-halloween-orange' : 'text-halloween-cream';
  const label = full ? 'Full' : short ? 'Not enough' : almost ? 'Almost full' : 'seats left';
  return (
    <span className="w-[84px] shrink-0 self-center flex flex-col items-center gap-0.5">
      <span className="flex items-baseline gap-0.5 leading-none">
        <span className={`text-[32px] font-bold ${tone}`}>{left}</span>
        <span className="text-[15px] font-bold text-halloween-gray">/{round.online_cap}</span>
      </span>
      <span className={`text-[13px] font-bold whitespace-nowrap ${full || short || almost ? tone : 'text-halloween-gray'}`}>{label}</span>
    </span>
  );
}
