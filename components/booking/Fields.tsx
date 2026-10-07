'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import Image from 'next/image';
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
};

// Text box from the booking design: 52px tall, purple border, orange on focus.
export function TextField({ id, label, required, hint, error, mono, ...input }: TextFieldProps) {
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-bold text-halloween-cream">
        {label} {required && <span className="text-halloween-error" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        className={`w-full min-h-[52px] px-3.5 py-3 rounded-lg border-2 text-halloween-cream text-[17px] outline-none focus:border-halloween-orange ${
          error ? 'border-halloween-error bg-halloween-error/10' : 'border-halloween-purple bg-halloween-dark'
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
  /** Red box only; caller shows the message with id `${id}-err` */
  invalid?: boolean;
};

/** Tick box with a wrapping label (PDPA consent, "I've read the room rules") */
export function CheckField({ id, checked, onChange, children, error, invalid = !!error }: CheckFieldProps) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="flex items-start gap-3 min-h-11 py-1 cursor-pointer">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-err` : undefined}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={`mt-px flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg border-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-halloween-moon ${
            checked ? 'border-halloween-moon bg-halloween-moon' : `bg-halloween-purple/30 ${invalid ? 'border-halloween-error' : 'border-halloween-gray/80'}`
          }`}
        >
          {checked && <Image src="/icons/check.svg" alt="" width={16} height={16} />}
        </span>
        <span className="text-[15px] leading-normal text-halloween-cream">{children}</span>
      </label>
      {error && (
        <div id={`${id}-err`}>
          <FieldError message={error} />
        </div>
      )}
    </div>
  );
}
