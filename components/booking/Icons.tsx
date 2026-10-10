// Two-tone icons in the style of public/icons/*.svg, drawn with the theme colours so
// they turn bone + blood red inside .theme-haunted by themselves.

export type BookingIconName = 'round' | 'clock' | 'location' | 'players' | 'leave' | 'cancel' | 'phone';

const LIGHT = 'var(--halloween-moon)';
const ACCENT = 'var(--halloween-dusty-orange)';
const DARK = 'var(--halloween-dark)';

type Props = {
  name: BookingIconName;
  size?: number;
  /** Override the light / accent colours, e.g. red for "cancel" */
  light?: string;
  accent?: string;
  className?: string;
};

export default function BookingIcon({ name, size = 24, light = LIGHT, accent = ACCENT, className = '' }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={`shrink-0 ${className}`}>
      {name === 'round' && (
        <>
          <path d="M19.2 12.5a7.2 7.2 0 1 1-2.3-5.6" fill="none" stroke={light} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M18.4 3l.5 4.6-4.6.4" fill="none" stroke={light} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12.3" r="2.4" fill={accent} />
        </>
      )}
      {name === 'clock' && (
        <>
          <circle cx="12" cy="12" r="9.2" fill={light} />
          <path d="M12 6.8V12l3.4 2.2" fill="none" stroke={DARK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="1.5" fill={accent} />
        </>
      )}
      {name === 'location' && (
        <>
          <path d="M12 22.2s-7.2-6.6-7.2-12.2a7.2 7.2 0 0 1 14.4 0c0 5.6-7.2 12.2-7.2 12.2z" fill={light} />
          <circle cx="12" cy="10" r="2.9" fill={accent} />
        </>
      )}
      {name === 'players' && (
        <>
          <path d="M13.4 20.6v-7.1a4.2 4.2 0 0 1 8.4 0v7.1l-1.4-1.1-1.4 1.1-1.4-1.1-1.4 1.1-1.4-1.1z" fill={accent} />
          <path d="M2.4 21.6V13a5 5 0 0 1 10 0v8.6l-1.7-1.3-1.6 1.3-1.7-1.3-1.6 1.3-1.7-1.3z" fill={light} />
          <circle cx="5.9" cy="12.7" r="1.05" fill={DARK} />
          <circle cx="8.9" cy="12.7" r="1.05" fill={DARK} />
        </>
      )}
      {name === 'leave' && (
        <>
          <path d="M4 21.6V12a6 6 0 0 1 12 0v9.6l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z" fill={light} />
          <circle cx="8" cy="11.6" r="1.1" fill={DARK} />
          <circle cx="12" cy="11.6" r="1.1" fill={DARK} />
          <path d="M17 5.5h5" stroke={accent} strokeWidth="2.6" strokeLinecap="round" />
        </>
      )}
      {name === 'cancel' && (
        <>
          <circle cx="12" cy="12" r="9.2" fill={light} />
          <path d="M8.6 8.6l6.8 6.8M15.4 8.6l-6.8 6.8" stroke={DARK} strokeWidth="2.6" strokeLinecap="round" />
        </>
      )}
      {name === 'phone' && (
        <>
          <rect x="6" y="2.4" width="12" height="19.2" rx="2.6" fill={light} />
          <rect x="8.3" y="5" width="7.4" height="11" rx="1" fill={DARK} />
          <circle cx="12" cy="18.7" r="1.25" fill={accent} />
        </>
      )}
    </svg>
  );
}

/** Right arrow at the end of a main button ("Book a slot →") */
export function ArrowRight({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
