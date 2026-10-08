/* eslint-disable @next/next/no-img-element */
import type { CSSProperties, ReactNode } from 'react';
import type { Boo } from '@/app/what-ghost/quiz';

// The Figma start screen (Main › iPhone 16 - 1) drawn inside the menu's quiz card.
// Positions are the design's own, taken from the slice x 0–393, y 300–690 and
// turned into percentages so the art scales with the card instead of the phone.
const W = 393;
const H = 390;
const Y0 = 300;

const at = (x: number, y: number, w: number, h: number): CSSProperties => ({
  position: 'absolute',
  left: `${(x / W) * 100}%`,
  top: `${((y - Y0) / H) * 100}%`,
  width: `${(w / W) * 100}%`,
  height: `${(h / H) * 100}%`,
});

/** A Figma "rotated child inside a bounding box": inner size + transform, centred in the box */
function Piece({ box, inner, transform, children }: { box: CSSProperties; inner: [number, number, number, number]; transform: string; children: ReactNode }) {
  const [iw, ih, bw, bh] = inner;
  return (
    <div style={box} aria-hidden="true">
      <div
        className="absolute left-1/2 top-1/2"
        style={{ width: `${(iw / bw) * 100}%`, height: `${(ih / bh) * 100}%`, transform: `translate(-50%, -50%) ${transform}` }}
      >
        {children}
      </div>
    </div>
  );
}

/** One character cut from the shared art-direction sheet */
function Character({ left, width }: { left: string; width: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <img src="/pick-a-boo/characters.webp" alt="" className="absolute max-w-none" style={{ left, top: '-0.15%', width, height: '100.29%' }} />
    </div>
  );
}

function img(src: string) {
  return <img src={src} alt="" className="size-full object-cover" />;
}

const FRAME =
  'w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[340px] relative overflow-hidden bg-halloween-charcoal/90 border-2 border-halloween-orange hand-cut';

function StartArt({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative w-full @container" style={{ aspectRatio: `${W} / ${H}` }}>
      <Piece box={at(-20.06, 400.66, 217.022, 224.758)} inner={[146, 173, 217.022, 224.758]} transform="rotate(146.69deg) scaleY(-1)">
        <img src="/pick-a-boo/smoke.webp" alt="" className="size-full object-cover opacity-[0.23]" />
      </Piece>
      <Piece box={at(199.84, 346.08, 211.228, 221.906)} inner={[146, 173, 211.228, 221.906]} transform="rotate(28.76deg)">
        <img src="/pick-a-boo/smoke.webp" alt="" className="size-full object-cover opacity-[0.23]" />
      </Piece>

      <h2
        className="display-font boo-stroke absolute left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-white text-[8.1cqw] leading-none"
        style={{ top: `${((333.5 - Y0) / H) * 100}%` }}
      >
        Pick&nbsp; a&nbsp; boo
      </h2>

      {/* Ghost sits behind the witch and the vampire, as in the design */}
      <Piece box={at(124.81, 378.85, 121.891, 187.323)} inner={[120.046, 186.139, 121.891, 187.323]} transform="rotate(0.57deg)">
        <Character left="-253.93%" width="357.3%" />
      </Piece>
      <Piece box={at(18, 391.9, 136.465, 196.664)} inner={[124.718, 189.133, 136.465, 196.664]} transform="rotate(-3.64deg)">
        <Character left="-10.99%" width="349.45%" />
      </Piece>
      <Piece box={at(235.16, 401.91, 150.957, 183.321)} inner={[138.111, 173.267, 150.957, 183.321]} transform="rotate(-175.61deg) scaleY(-1)">
        <Character left="-92.73%" width="289.09%" />
      </Piece>

      <button
        type="button"
        onClick={onStart}
        style={at(120, 616.19, 156, 39)}
        className="flex items-center justify-center rounded-full bg-[#fe7700] transition-transform hover:scale-105 active:scale-95"
      >
        <span className="display-font boo-stroke-dark text-white text-[5.6cqw] leading-none">START QUIZ</span>
      </button>

      <Piece box={at(98, 642.49, 47.245, 33.086)} inner={[43.026, 24.534, 47.245, 33.086]} transform="rotate(12.22deg)">
        {img('/pick-a-boo/candy-a.webp')}
      </Piece>
      <Piece box={at(101.66, 627.86, 49.908, 40.021)} inner={[43.643, 24.886, 49.908, 40.021]} transform="rotate(-156.88deg) scaleY(-1)">
        {img('/pick-a-boo/candy-b.webp')}
      </Piece>
      <Piece box={at(256.54, 601, 40.456, 53.022)} inner={[30.828, 47.427, 40.456, 53.022]} transform="rotate(12.64deg)">
        {img('/pick-a-boo/ghost.webp')}
      </Piece>
    </div>
  );
}

function Result({ boo, onStart }: { boo: Boo; onStart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 px-4 pb-5 pt-6 text-center">
      <span className="display-font text-sm sm:text-base text-halloween-orange tracking-wider">✦ YOUR boo ✦</span>
      <img src={boo.card} alt={boo.name} width={170} height={255} className="h-44 sm:h-52 md:h-60 w-auto rounded-[13px] shadow-[0_10px_24px_rgba(0,0,0,0.45)]" />
      <p className="display-font boo-stroke text-white text-2xl sm:text-3xl leading-none">{boo.name}</p>
      <button
        type="button"
        onClick={onStart}
        className="mt-1 bg-[#fe7700] hover:bg-halloween-orange text-white font-bold text-sm sm:text-base px-5 py-2 rounded-full transition-all active:scale-95 shadow-lg"
      >
        เล่นอีกครั้ง
      </button>
    </div>
  );
}

/** Menu entry to the quiz: the Pick a boo start art, or the boo you got last time */
export default function PickABooCard({ result, onStart }: { result: Boo | null; onStart: () => void }) {
  return (
    <div className={FRAME}>
      <img src="/pick-a-boo/web.webp" alt="" aria-hidden="true" className="pointer-events-none absolute -right-4 -top-4 w-20 sm:w-24 rotate-6 opacity-90" />
      <img src="/pick-a-boo/spider.webp" alt="" aria-hidden="true" className="pointer-events-none absolute left-4 -top-2 w-4 sm:w-5" />
      {result ? <Result boo={result} onStart={onStart} /> : <StartArt onStart={onStart} />}
    </div>
  );
}
