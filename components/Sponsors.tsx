/* eslint-disable @next/next/no-img-element */

// This year's sponsors, shown on every page that thanks them. Change the list here only.
// One white strip, edge to edge, all logos in one row (sizes and order from the sponsor
// artwork แม็ค approved). w × h is the display size; files are 3× that for sharp screens.
const SPONSORS = [
  { id: 'codec', name: 'Codec Creation', w: 24, h: 23 },
  { id: 'merge-clinic', name: 'Merge Clinic', w: 23, h: 24 },
  // Supplied white-only; recoloured lavender so it shows on the white strip
  { id: 'jejuvita', name: 'Jejuvita', w: 39, h: 10 },
  { id: 'cunex', name: 'CUNEX', w: 23, h: 16 },
  { id: 'major', name: 'Major Cineplex', w: 16, h: 26 },
  { id: 'ice-house', name: 'ICE HOUSE Ice Bath & Sauna', w: 24, h: 23 },
  { id: 'nk-boardgame', name: 'NK Board Game', w: 29, h: 20 },
  { id: 'escape-room-thailand', name: 'Escape Room Thailand', w: 43, h: 14 },
  { id: 'hand-wrap', name: 'Hand Wrap', w: 25, h: 25 },
  { id: 'lesgo', name: 'LesGO Clothing', w: 24, h: 25 },
] as const;

type SponsorsProps = {
  /** "fixed" pins it to the bottom of the screen (admin QR scanner) */
  placement?: 'inline' | 'fixed';
  className?: string;
};

/** "ขอบคุณผู้สนับสนุน" + a full-width white strip with every logo in one row */
export default function Sponsors({ placement = 'inline', className = '' }: SponsorsProps) {
  // Inline, the strip breaks out of the page's padded column to reach both screen edges
  const position = placement === 'fixed' ? 'fixed inset-x-0 bottom-0 z-40' : 'ml-[calc(50%-50vw)] w-screen';
  return (
    <section aria-label="ผู้สนับสนุน" className={`${position} ${className}`}>
      <p className="mb-2 text-center text-xs font-bold tracking-[0.08em] text-halloween-orange">ขอบคุณผู้สนับสนุน</p>
      <div className="bg-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.6)]">
        <ul className="mx-auto flex h-10 max-w-[560px] items-center justify-between gap-1 px-3.5">
          {SPONSORS.map(({ id, name, w, h }) => (
            <li key={id} className="flex shrink-0 items-center justify-center">
              <img src={`/sponsors/${id}.webp`} alt={name} width={w} height={h} loading="lazy" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
