'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { BookingApiError } from '@/lib/bookingClient';
import { formatTime } from '@/lib/bookingTime';

// ชิ้นส่วนของ dialog 5e / 5c / 5f ที่ต้องตรงดีไซน์ (แถบลาก, ไม่มีปุ่ม X, ปุ่มตัวหนังสือ 15px)
// ทำแยกไว้ในไฟล์นี้เพราะ Sheet / Button ของ kit หน้าตาต่างจากดีไซน์ของ 3 หน้าจอนี้

export type DialogRound = {
  starts_at: string;
  ends_at: string;
  checkin_closes_at: string;
};

/** " · ยกเลิกได้ถึงเวลาปิดเช็กอินของรอบ (17:35 น.)" หรือข้อความว่างถ้าไม่ส่ง round มา */
export function closesNote(round?: DialogRound) {
  if (!round) return '';
  return ` · ยกเลิกได้ถึงเวลาปิดเช็กอินของรอบ (${formatTime(round.checkin_closes_at)} น.)`;
}

// ข้อมูลของหน้าเก่าแล้ว (เลยเวลา / สถานะเปลี่ยนไปแล้ว / ไม่ใช่หัวหน้า) → หน้าควรเรียก find ใหม่
const STALE_CODES = new Set(['TOO_LATE', 'NOT_CANCELLABLE', 'NOT_LEADER']);

export function isStaleError(e: unknown) {
  return e instanceof BookingApiError && STALE_CODES.has(e.code);
}

type SheetProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  /** กำลังเรียก API: ไม่ปิดด้วย Esc / แตะพื้นหลัง กันกดปิดแล้วรายการสำเร็จทีหลัง */
  busy?: boolean;
  /** 5e ใช้หัวข้อเล็กกว่า 5c/5f เล็กน้อยตามดีไซน์ */
  compactTitle?: boolean;
};

export function DialogSheet({ title, onClose, children, footer, busy, compactTitle }: SheetProps) {
  const panel = useRef<HTMLDivElement>(null);
  // เก็บ onClose / busy ล่าสุดไว้ใน ref เพื่อให้หน้าที่ส่ง arrow function ใหม่ทุก render ไม่ทำให้โฟกัสรีเซ็ต
  const closeRef = useRef(onClose);
  const busyRef = useRef(!!busy);
  useEffect(() => {
    closeRef.current = onClose;
    busyRef.current = !!busy;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busyRef.current) closeRef.current();
    };
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
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-busy={busy || undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-halloween-charcoal text-halloween-cream rounded-t-[26px] border-t-2 border-halloween-orange shadow-[0_-10px_30px_rgba(0,0,0,0.35)] outline-none px-4 pt-[18px] pb-[max(24px,env(safe-area-inset-bottom))]"
      >
        <div aria-hidden="true" className="mx-auto h-1 w-11 rounded-full bg-halloween-gray/40" />
        <h2 className={`mt-3 font-bold leading-7 ${compactTitle ? 'text-[18.3px]' : 'text-xl'}`}>{title}</h2>
        <div className="mt-3 flex flex-col gap-3.5">{children}</div>
        <div className="mt-3.5 flex flex-col gap-3.5">{footer}</div>
      </div>
    </div>
  );
}

type ButtonVariant = 'primary' | 'coral' | 'coral-outline' | 'muted';

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-halloween-orange border-halloween-orange text-halloween-dark hover:brightness-110',
  coral: 'bg-halloween-error border-halloween-error text-halloween-dark hover:brightness-105',
  'coral-outline': 'bg-halloween-purple/30 border-halloween-error text-halloween-error hover:bg-halloween-error/10',
  muted: 'bg-halloween-purple/30 border-halloween-purple text-halloween-cream hover:bg-halloween-purple/50',
};

type ButtonProps = {
  variant: ButtonVariant;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
};

export function DialogButton({ variant, onClick, disabled, loading, loadingText, children }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex w-full min-h-[52px] items-center justify-center rounded-lg border-2 px-5 py-3 text-[15px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_STYLES[variant]}`}
    >
      {loading ? (loadingText ?? 'กำลังดำเนินการ…') : children}
    </button>
  );
}

export function DialogError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm font-bold text-halloween-error">
      {children}
    </p>
  );
}
