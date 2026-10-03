'use client';

import Link from 'next/link';
import Doodle from '@/components/Doodle';
import { bookingPaths, DEFAULT_ACTIVITY } from '@/lib/bookingRules';
import type { ActivityId } from '@/lib/bookingTypes';

export type BookingHeaderProps = {
  activity?: ActivityId;
  /** Where Back goes. Leave out to hide Back. */
  backHref?: string;
  /** Use instead of backHref when Back should run code (e.g. close a step) */
  onBack?: () => void;
  /** The design shows My booking on every page; hide it on the My booking page itself */
  showMyBooking?: boolean;
};

const backClass =
  'flex items-center gap-1.5 min-h-11 pr-2 text-halloween-orange hover:text-halloween-moon font-bold text-base transition-colors';

function BackContent() {
  return (
    <>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" />
      </svg>
      Back
    </>
  );
}

export default function BookingHeader({ activity = DEFAULT_ACTIVITY, backHref, onBack, showMyBooking = true }: BookingHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2.5 px-4 py-3.5">
      {onBack ? (
        <button type="button" onClick={onBack} className={backClass}>
          <BackContent />
        </button>
      ) : backHref ? (
        <Link href={backHref} className={backClass}>
          <BackContent />
        </Link>
      ) : (
        <span />
      )}

      {showMyBooking && (
        <Link
          href={bookingPaths(activity).myBooking}
          className="flex items-center gap-2 min-h-11 pl-2 pr-3.5 py-1 hand-cut border-2 border-halloween-orange bg-halloween-charcoal/90 text-halloween-cream text-[15px] font-bold whitespace-nowrap -rotate-1 hover:rotate-0 transition-transform"
        >
          <Doodle name="ghost" className="w-7 h-auto" />
          My booking
        </Link>
      )}
    </header>
  );
}
