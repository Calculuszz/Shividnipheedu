import type { ReactNode } from 'react';
import type { StaffRound } from '@/lib/bookingTypes';

// Small building blocks for the staff pages (drawn at phone width, stretched on a laptop).

export const card = 'rounded-xl border-2 border-halloween-purple bg-halloween-charcoal p-3.5';
export const meta = 'text-sm leading-relaxed text-halloween-gray';

const BTN = {
  primary: 'border-halloween-orange bg-halloween-orange text-halloween-dark hover:brightness-110',
  lime: 'border-halloween-moon bg-halloween-moon text-halloween-dark hover:brightness-105',
  ghost: 'border-halloween-purple bg-transparent text-halloween-cream hover:bg-halloween-purple/40',
  danger: 'border-halloween-error bg-transparent text-halloween-error hover:bg-halloween-error/10',
};
const BTN_OFF = 'border-halloween-purple bg-halloween-purple/30 text-halloween-gray cursor-not-allowed';

export function btn(kind: keyof typeof BTN = 'primary', off = false) {
  return `inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border-2 px-4 text-center text-base font-bold leading-tight transition ${
    off ? BTN_OFF : BTN[kind]
  }`;
}

export function Chip({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold leading-[18px] ${className}`}>
      {children}
    </span>
  );
}

export const LeaderChip = () => <Chip className="bg-halloween-moon/15 text-halloween-moon">หัวหน้าทีม</Chip>;

export function Notice({ tone = 'error', children }: { tone?: 'error' | 'ok' | 'info'; children: ReactNode }) {
  const tones = {
    error: 'border-halloween-error bg-halloween-error/10 text-halloween-error',
    ok: 'border-halloween-moon bg-halloween-moon/10 text-halloween-moon',
    info: 'border-halloween-purple bg-halloween-purple/20 text-halloween-cream',
  };
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-[10px] border-2 px-3 py-2.5 text-[15px] font-bold leading-relaxed ${tones[tone]}`}>
      {children}
    </p>
  );
}

/** Round picker: "รอบที่" + big number + a short status under it. Scrolls sideways on a phone. */
export function RoundPicker({
  rounds,
  selected,
  onSelect,
  sub,
  accent = 'moon',
}: {
  rounds: StaffRound[];
  selected: string | null;
  onSelect: (id: string) => void;
  sub: (r: StaffRound) => { text: string; tone?: 'moon' | 'gray' | 'error' };
  accent?: 'moon' | 'orange';
}) {
  const on = accent === 'moon' ? 'border-halloween-moon bg-halloween-moon/10' : 'border-halloween-orange bg-halloween-orange/15';
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-2 md:flex-wrap" role="radiogroup" aria-label="เลือกรอบ">
        {rounds.map((r) => {
          const s = sub(r);
          const tone = s.tone === 'moon' ? 'text-halloween-moon' : s.tone === 'error' ? 'text-halloween-error' : 'text-halloween-gray';
          return (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={r.id === selected}
              onClick={() => onSelect(r.id)}
              className={`flex h-[68px] min-w-[74px] shrink-0 flex-col items-center justify-center rounded-[10px] border-2 px-2 leading-tight ${
                r.id === selected ? on : 'border-halloween-purple'
              }`}
            >
              <span className="text-[11px] text-halloween-gray">รอบที่</span>
              <span className="text-[22px] font-bold">{r.round_no}</span>
              <span className={`text-[11px] ${tone}`}>{s.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** "0812345678" → "081-234-5678" (easier to read out over the phone) */
export function formatPhone(phone: string) {
  const d = phone.replace(/[^0-9]/g, '');
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
  return phone;
}

export function PhoneLink({ phone }: { phone: string }) {
  return (
    <a
      href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
      className="inline-flex min-h-8 items-center gap-1.5 text-sm font-bold text-halloween-orange hover:text-halloween-moon"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
      </svg>
      {formatPhone(phone)}
    </a>
  );
}

export const Icon = {
  scan: (
    <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" />
  ),
  list: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
  grid: <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" />,
  walkin: <path d="M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M16 11h6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  logout: <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
};

export function Svg({ children, size = 22, className = '' }: { children: ReactNode; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}
