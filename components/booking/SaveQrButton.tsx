'use client';

import { useEffect, useRef, useState } from 'react';
import { drawTicket, saveImage, themeColors, type TicketImage } from '@/lib/ticketImage';

type Props = {
  /** Builds the ticket; called after mount so it can read icons off the page */
  ticket: () => TicketImage;
  /** Rebuild the image when this changes (code, round, name…) */
  version: string;
  fileName: string;
  className?: string;
};

const DOWNLOAD = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3.5v11" />
    <path d="M7.5 10.5L12 15l4.5-4.5" />
    <path d="M4.5 16.5v2.2a1.8 1.8 0 0 0 1.8 1.8h11.4a1.8 1.8 0 0 0 1.8-1.8v-2.2" />
  </svg>
);
const CHECK = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

// "บันทึก QR CODE" under the ticket's QR (Button variant="secondary" look). The image is drawn
// ahead of time: iPhone only opens the share sheet straight from a tap, not after a long wait.
export default function SaveQrButton({ ticket, version, fileName, className = '' }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const ticketRef = useRef(ticket);
  ticketRef.current = ticket;
  const ready = useRef<{ version: string; blob: Promise<Blob> } | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const build = () => {
    if (ready.current?.version !== version && ref.current) {
      const blob = drawTicket(ticketRef.current(), themeColors(ref.current));
      blob.catch(() => {});
      ready.current = { version, blob };
    }
    return ready.current!.blob;
  };

  useEffect(() => {
    setSaved(false);
    build();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const onClick = async () => {
    setBusy(true);
    try {
      const result = await saveImage(await build(), fileName);
      if (result === 'saved') setSaved(true);
    } catch {
      ready.current = null; // try drawing again next tap
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-busy={busy || undefined}
      className={`inline-flex w-full min-h-[52px] items-center justify-center gap-2.5 rounded-lg border-2 border-halloween-orange bg-transparent px-5 py-3.5 text-[17px] font-bold text-halloween-cream transition-colors hover:bg-halloween-orange/15 ${className}`}
    >
      {saved ? CHECK : DOWNLOAD}
      {busy ? 'กำลังบันทึก…' : saved ? 'บันทึกแล้ว' : 'บันทึก QR CODE'}
    </button>
  );
}
