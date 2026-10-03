import type { ReactNode } from 'react';
import BookingHeader, { type BookingHeaderProps } from './BookingHeader';

type Props = BookingHeaderProps & {
  /** Big orange title, e.g. "Start booking" */
  title?: string;
  /** Small lime line above the title, e.g. "Step 2 of 2" */
  step?: string;
  /** Hide the header entirely (e.g. inside a full-screen sheet) */
  bare?: boolean;
  children: ReactNode;
};

// Page frame for every student booking page: plum night background, mobile-width
// column (the design is drawn at 390px), header with Back + My booking.
export default function BookingPage({ title, step, bare, children, ...header }: Props) {
  return (
    <div className="image-background min-h-screen relative overflow-hidden">
      <div className="relative z-10 mx-auto w-full max-w-md min-h-screen flex flex-col">
        {!bare && <BookingHeader {...header} />}
        <main className="flex-1 flex flex-col gap-4 px-4 pt-1.5 pb-10">
          {(title || step) && (
            <div className="flex flex-col gap-1.5">
              {step && <span className="text-[15px] font-bold text-halloween-moon">{step}</span>}
              {title && (
                <h1 className="display-font text-[34px] leading-[1.05] text-halloween-orange -rotate-2 origin-left">
                  {title}
                </h1>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
