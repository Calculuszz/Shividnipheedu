'use client';

import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Read out by screen readers and shown at the top */
  title: string;
  children: ReactNode;
  /** Buttons pinned to the bottom of the sheet */
  footer?: ReactNode;
};

// Bottom sheet used for the design's dialogs: change round (3c), seats ran out (3d),
// cancel / remove (5c, 5e, 5f). Closes on Escape or a tap on the dimmed page.
export default function Sheet({ open, onClose, title, children, footer }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[88vh] flex flex-col bg-halloween-charcoal text-halloween-cream rounded-t-[26px] border-t-2 border-halloween-orange shadow-[0_-10px_30px_rgba(0,0,0,0.35)] outline-none"
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-halloween-cream hover:bg-halloween-purple/40"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">{children}</div>
        {footer && <div className="flex flex-col gap-2.5 px-4 pt-3 pb-6 border-t border-halloween-purple/60">{footer}</div>}
      </div>
    </div>
  );
}
