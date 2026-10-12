'use client';

import { useRef } from 'react';
import BookingIcon from './Icons';
import BookingQR from './BookingQR';
import SaveQrButton from './SaveQrButton';
import { svgMarkup } from '@/lib/ticketImage';

type Props = {
  code: string;
  fullName: string;
  /** "ยื่น QR นี้ที่จุดเช็กอิน" */
  hint: string;
  round: { label: string; value: string };
  checkin: { label: string; value: string };
  place: { label: string; value: string };
};

const MAP_HREF = '/event-map.png';

// The personal ticket on My booking, in the My Ticket design: big QR on a dark tile,
// then name, booking code, round, check-in time and where to go.
export default function BookingTicket({ code, fullName, hint, round, checkin, place }: Props) {
  const ref = useRef<HTMLElement>(null);
  const icon = (name: string) => svgMarkup(ref.current?.querySelector(`[data-icon="${name}"] svg`));
  const footer = 'QR นี้ใช้ได้คนเดียว ห้ามส่งต่อ';

  return (
    <section ref={ref} className="hand-cut flex flex-col items-center border-2 border-halloween-orange bg-halloween-charcoal/95 px-5 pt-6 pb-[22px] text-center">
      <h1 className="display-font text-[38px] leading-none text-halloween-orange">My Booking</h1>
      <p className="mt-3 text-[15px]">{hint}</p>
      <div className="mt-4 rounded-[10px] bg-halloween-dark p-3.5">
        <BookingQR code={code} size={236} className="border-4 border-halloween-orange" />
      </div>
      <SaveQrButton
        className="mt-3.5"
        fileName={`${code}.png`}
        version={[code, fullName, round.label, round.value, checkin.value, place.value].join('|')}
        ticket={() => ({
          title: 'My Booking',
          hint,
          // Same colours as BookingQR and the confirmation email
          qr: { text: code, dark: '#24033a', light: '#f5eee6' },
          name: { label: 'ชื่อ-นามสกุล', value: fullName },
          code: { label: 'รหัสการจอง', value: code },
          pairs: [
            { ...round, icon: icon('round') },
            { ...checkin, icon: icon('clock') },
          ],
          place: { ...place, icon: icon('location') },
          footer,
        })}
      />

      <div className="mt-[18px] flex w-full flex-col gap-3 rounded-md border border-halloween-purple bg-halloween-dark p-4">
        <div>
          <p className="text-[13px] text-halloween-gray">ชื่อ-นามสกุล</p>
          <p className="text-xl font-bold">{fullName}</p>
        </div>
        <div>
          <p className="text-[13px] text-halloween-gray">รหัสการจอง</p>
          <p className="font-mono text-2xl font-bold tracking-[0.06em] text-halloween-orange">{code}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-halloween-purple/80 pt-3 text-left">
          {[
            { icon: 'round' as const, ...round },
            { icon: 'clock' as const, ...checkin },
          ].map((row) => (
            <div key={row.label} data-icon={row.icon} className="flex items-center gap-2.5">
              <BookingIcon name={row.icon} size={26} />
              <div>
                <p className="text-[13px] text-halloween-gray">{row.label}</p>
                <p className="text-lg font-bold">{row.value}</p>
              </div>
            </div>
          ))}
        </div>
        <div data-icon="location" className="flex items-center gap-3 text-left">
          <BookingIcon name="location" size={26} />
          <div className="flex-1">
            <p className="text-[13px] text-halloween-gray">{place.label}</p>
            <p className="text-base font-bold">{place.value}</p>
          </div>
          <a
            href={MAP_HREF}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center text-sm font-bold text-halloween-orange underline underline-offset-4"
          >
            ดูแผนที่
          </a>
        </div>
      </div>
      <p className="mt-3 text-[13px] text-halloween-gray">{footer}</p>
    </section>
  );
}
