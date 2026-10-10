'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import FieldError from '@/components/FieldError';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  id: string;
  label: string;
  required?: boolean;
  /** Grey help line under the box, e.g. "รหัสนิสิต 10 หลัก" */
  hint?: string;
  /** Red message under the box; also turns the border red */
  error?: string;
  /** Digits look better spaced out (student ID, booking code) */
  mono?: boolean;
  /** Small icon before the label */
  icon?: ReactNode;
};

// Text box from the booking design: 52px tall, purple border, orange on focus.
export function TextField({ id, label, required, hint, error, mono, icon, ...input }: TextFieldProps) {
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={`text-[15px] font-bold text-halloween-cream ${icon ? 'flex items-center gap-1.5' : ''}`}>
        {icon}
        {label} {required && <span className="text-halloween-error" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        className={`w-full min-h-[52px] px-3.5 py-3 rounded-lg border-2 bg-halloween-dark text-halloween-cream text-[17px] outline-none focus:border-halloween-orange ${
          error ? 'border-halloween-error' : 'border-halloween-purple'
        } ${mono ? 'tracking-[1px]' : ''}`}
        {...input}
      />
      {error ? (
        <div id={`${id}-err`} className="-mt-1.5">
          <FieldError message={error} />
        </div>
      ) : (
        hint && (
          <span id={`${id}-hint`} className="text-sm text-halloween-gray">
            {hint}
          </span>
        )
      )}
    </div>
  );
}

type CheckFieldProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  error?: string;
};

/** Tick box with a wrapping label (PDPA consent, "I've read the room rules") */
export function CheckField({ id, checked, onChange, children, error }: CheckFieldProps) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="flex items-start gap-3 min-h-11 py-1 cursor-pointer">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={!!error || undefined}
          className="mt-0.5 w-6 h-6 shrink-0 accent-halloween-orange cursor-pointer"
        />
        <span className="text-[15px] leading-normal text-halloween-cream">{children}</span>
      </label>
      {error && <FieldError message={error} />}
    </div>
  );
}
