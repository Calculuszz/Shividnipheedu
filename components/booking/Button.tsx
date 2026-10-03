import Link from 'next/link';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'link';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-halloween-orange text-halloween-dark border-2 border-halloween-orange hover:bg-halloween-moon hover:border-halloween-moon',
  secondary: 'bg-transparent text-halloween-cream border-2 border-halloween-orange hover:bg-halloween-orange/15',
  danger: 'bg-transparent text-halloween-error border-2 border-halloween-error hover:bg-halloween-error/10',
  link: 'bg-transparent text-halloween-orange border-2 border-transparent underline decoration-wavy decoration-halloween-orange/60 underline-offset-4 hover:text-halloween-moon',
};

const DISABLED = 'bg-halloween-purple/30 text-halloween-gray border-2 border-halloween-purple cursor-not-allowed';

type Common = {
  variant?: Variant;
  /** Full width (default) or fit content */
  block?: boolean;
  className?: string;
  children: ReactNode;
};

type AsButton = Common & {
  href?: undefined;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  /** Shows the text and blocks clicks while a request runs */
  loading?: boolean;
  loadingText?: string;
};

type AsLink = Common & { href: string };

// Buttons and button-looking links from the design (52px tall, easy to hit on a phone).
export default function Button(props: AsButton | AsLink) {
  const { variant = 'primary', block = true, className = '', children } = props;
  const base = `inline-flex items-center justify-center gap-2.5 min-h-[52px] px-5 py-3.5 rounded-lg text-[17px] font-bold text-center transition-colors ${block ? 'w-full' : ''}`;

  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={`${base} ${VARIANTS[variant]} ${className}`}>
        {children}
      </Link>
    );
  }

  const off = props.disabled || props.loading;
  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      disabled={off}
      aria-busy={props.loading || undefined}
      className={`${base} ${off ? DISABLED : VARIANTS[variant]} ${className}`}
    >
      {props.loading ? (props.loadingText ?? 'กำลังดำเนินการ…') : children}
    </button>
  );
}
