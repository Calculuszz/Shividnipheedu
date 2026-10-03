import type { ReactNode } from 'react';

type Tone = 'orange' | 'purple' | 'danger' | 'cream';

const TONES: Record<Tone, string> = {
  orange: 'bg-halloween-charcoal text-halloween-cream border-2 border-halloween-orange',
  purple: 'bg-halloween-charcoal text-halloween-cream border-2 border-halloween-purple',
  danger: 'bg-halloween-error/10 text-halloween-cream border-2 border-dashed border-halloween-error/70',
  cream: 'bg-halloween-cream text-halloween-charcoal',
};

type Props = {
  tone?: Tone;
  /** Strip of masking tape across the top edge */
  tape?: boolean;
  /** Slight hand-placed tilt, as in the design */
  tilt?: 'left' | 'right';
  className?: string;
  children: ReactNode;
  as?: 'section' | 'div' | 'article';
};

// The hand-cut card used for every box in the booking design.
export default function Card({ tone = 'orange', tape, tilt, className = '', children, as: Tag = 'section' }: Props) {
  const rotate = tilt === 'left' ? '-rotate-1' : tilt === 'right' ? 'rotate-1' : '';
  return (
    <Tag className={`relative hand-cut p-4 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.5)] ${TONES[tone]} ${rotate} ${className}`}>
      {tape && <Tape />}
      {children}
    </Tag>
  );
}

export function Tape({ className = 'left-1/2 -translate-x-1/2 rotate-3' }: { className?: string }) {
  return <span aria-hidden="true" className={`absolute -top-2.5 h-[18px] w-16 bg-halloween-cream/60 ${className}`} />;
}

/** Lime sticky note, e.g. "Chula students only" */
export function StickyNote({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div role="note" className={`relative flex flex-col gap-0.5 p-4 bg-halloween-moon text-halloween-charcoal rounded-[6px_14px_8px_16px] -rotate-1 shadow-[0_10px_20px_-8px_rgba(0,0,0,0.5)] ${className}`}>
      <Tape />
      {title && <span className="text-[17px] font-bold">{title}</span>}
      <div className="text-base leading-snug">{children}</div>
    </div>
  );
}

/** Red box for a problem the user must deal with (seat ran out, too late…) */
export function ErrorNotice({ title, children, className = '' }: { title?: string; children?: ReactNode; className?: string }) {
  return (
    <div role="alert" className={`flex flex-col gap-1 px-3.5 py-3 rounded-[14px] bg-halloween-error/10 border-2 border-halloween-error text-halloween-error text-[15px] leading-normal ${className}`}>
      {title && <b>{title}</b>}
      {children}
    </div>
  );
}

/** Orange-bordered info line, e.g. "Online booking closed — walk in at the booth" */
export function InfoNotice({ title, children, className = '' }: { title?: string; children?: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 px-4 py-3.5 rounded-[12px_8px_14px_6px/8px_14px_6px_12px] bg-halloween-dark border-[1.5px] border-halloween-orange text-halloween-cream ${className}`}>
      {title && <span className="text-[17px] font-bold text-halloween-orange">{title}</span>}
      {children && <div className="text-[15px] leading-relaxed">{children}</div>}
    </div>
  );
}
