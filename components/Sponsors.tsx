/* eslint-disable @next/next/no-img-element */

// This year's sponsors, shown on every page that thanks them. Change the list here only.
// w × h is the display size: each logo gets the same area (wide ones shorter, tall ones
// taller) so none of them shouts louder than the rest. Files are 3× that for sharp screens.
const SPONSORS = [
  { id: 'escape-room-thailand', name: 'Escape Room Thailand', w: 50, h: 15 },
  { id: 'major', name: 'Major Cineplex', w: 19, h: 30 },
  { id: 'cunex', name: 'CUNEX', w: 58, h: 11 },
  { id: 'ice-house', name: 'ICE HOUSE Ice Bath & Sauna', w: 53, h: 14 },
  { id: 'nk-boardgame', name: 'NK Board Game', w: 34, h: 22 },
  { id: 'codec', name: 'Codec Creation', w: 28, h: 27 },
  { id: 'merge-clinic', name: 'Merge Clinic', w: 21, h: 30 },
  { id: 'hand-wrap', name: 'Hand Wrap', w: 35, h: 22 },
  { id: 'lesgo', name: 'LesGO Clothing', w: 58, h: 10 },
  // Supplied white-only; recoloured to the site's plum so it shows on the cream ribbon
  { id: 'jejuvita', name: 'Jejuvita', w: 56, h: 14 },
] as const;

type SponsorsProps = {
  /** "fixed" pins it to the bottom of the screen (admin QR scanner) */
  placement?: 'inline' | 'fixed';
  className?: string;
};

/** "ขอบคุณผู้สนับสนุน" + one cream ribbon of logos, 5 × 2 with thin dividers */
export default function Sponsors({ placement = 'inline', className = '' }: SponsorsProps) {
  const position = placement === 'fixed' ? 'fixed bottom-3 left-1/2 z-40 -translate-x-1/2 lg:bottom-5' : '';
  return (
    <section aria-label="ผู้สนับสนุน" className={`mx-auto w-full max-w-[420px] ${position} ${className}`}>
      <p className="mb-2.5 text-center text-xs font-bold tracking-[0.08em] text-halloween-orange">ขอบคุณผู้สนับสนุน</p>
      <ul className="grid grid-cols-5 gap-y-2 rounded-[18px] bg-halloween-cream px-2 py-2.5 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.6)]">
        {SPONSORS.map(({ id, name, w, h }) => (
          <li key={id} className="flex h-[34px] items-center justify-center [&:not(:nth-child(5n))]:border-r [&:not(:nth-child(5n))]:border-halloween-purple/20">
            <img src={`/sponsors/${id}.webp`} alt={name} width={w} height={h} loading="lazy" />
          </li>
        ))}
      </ul>
    </section>
  );
}
