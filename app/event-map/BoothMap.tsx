import { BINS, DOTS, EMPTY_BOOTHS, KINDS, SHOPS, VIEWBOX } from './booths';

const BUILDING = '#4a3167';
const BLOCK = '#3a1f55';
const GROUND = '#1a0229';
const EDGE = '#6b4f8f';
const INK = '#f5eee6';
const FONT = "'FC Iconic', sans-serif";

function Label({ x, y, size, children, rotate }: { x: number; y: number; size: number; children: string; rotate?: number }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={size}
      fontWeight={700}
      fill={INK}
      fontFamily={FONT}
      dominantBaseline={rotate ? 'middle' : undefined}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
    >
      {children}
    </text>
  );
}

/** The shop plan, redrawn in the event colours. `selected` rings one booth and fades the rest. */
export default function BoothMap({ selected, onSelect }: { selected: number | null; onSelect: (no: number) => void }) {
  return (
    <svg viewBox={VIEWBOX} role="img" aria-label="แผนผังร้านค้า" className="block h-auto w-full">
      <rect x="230" y="210" width="1060" height="705" rx="54" fill={GROUND} stroke="#ea7b29" strokeWidth="4" />

      {/* Buildings */}
      <rect x="303" y="263" width="169" height="121" rx="6" fill={BUILDING} stroke={EDGE} strokeWidth="2" />
      <Label x={387} y={335} size={30}>ตึก 100</Label>
      <path d="M489 263H1216V417H1077V335H890V368H814V335H628V417H489Z" fill={BUILDING} stroke={EDGE} strokeWidth="2" />
      <Label x={852} y={312} size={34}>ตึก 2</Label>
      <rect x="934" y="545" width="282" height="218" rx="6" fill={BUILDING} stroke={EDGE} strokeWidth="2" />
      <Label x={1075} y={666} size={34}>ตึก 3</Label>

      {/* ลานเกียร์ with its stage and pillars */}
      <rect x="303" y="502" width="492" height="308" rx="6" fill={BLOCK} />
      <Label x={508} y={655} size={34}>ลานเกียร์</Label>
      <rect x="783" y="502" width="151" height="40" rx="4" fill={BUILDING} />
      <rect x="715" y="563" width="68" height="137" rx="6" fill="#5a3d80" />
      <Label x={749} y={632} size={26} rotate={90}>เวที</Label>
      {[[313, 535], [419, 535], [525, 535], [632, 535], [341, 715], [472, 715], [601, 715]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="31" height="31" rx="3" fill="none" stroke={EDGE} strokeWidth="3" />
      ))}
      {[[303, 795, 90], [783, 798, 59], [905, 798, 214], [1182, 798, 34]].map(([x, y, w]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height="65" rx="6" fill={BLOCK} />
      ))}

      {EMPTY_BOOTHS.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="36" height="36" rx="4" fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth="2.5" strokeDasharray="5 4" />
      ))}
      {BINS.map(([x, y]) =>
        ['#ff4b3e', '#ffd34d', '#3ccf7a'].map((fill, i) => <circle key={`${x}-${i}`} cx={x + i * 25} cy={y} r="10.5" fill={fill} />)
      )}
      {DOTS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="10.5" fill="#3ccf7a" />
      ))}

      {/* Booths: tap one to show its name in the list */}
      {SHOPS.map((s) => {
        const on = selected === s.no;
        const dim = selected !== null && !on;
        return (
          <g
            key={s.no}
            role="button"
            tabIndex={0}
            aria-label={`ร้านที่ ${s.no} ${s.name}`}
            onClick={() => onSelect(s.no)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(s.no)}
            className="cursor-pointer outline-none"
            opacity={dim ? 0.35 : 1}
          >
            {on && <rect x={s.x - 7} y={s.y - 7} width="50" height="50" rx="9" fill="none" stroke="#fff" strokeWidth="4" />}
            <rect x={s.x} y={s.y} width="36" height="36" rx="5" fill={KINDS[s.kind].fill} />
            <text x={s.x + 18} y={s.y + 26} textAnchor="middle" fontSize="21" fontWeight={700} fill={GROUND} fontFamily={FONT}>
              {s.no}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
