'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

type Props = {
  /** Personal booking code, e.g. "SVP-7K3QX9". The QR holds exactly this text. */
  code: string;
  size?: number;
  className?: string;
};

// The check-in QR. Staff scan it at the booth (/api/staff/check-in reads the code).
// Same colours as the QR in the confirmation email.
export default function BookingQR({ code, size = 220, className = '' }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(code, { width: size * 2, margin: 2, color: { dark: '#24033a', light: '#f5eee6' } })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [code, size]);

  return (
    <div
      className={`inline-flex items-center justify-center bg-halloween-cream p-2 rounded-lg ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`QR สำหรับเช็กอิน รหัส ${code}`} width={size - 16} height={size - 16} />
      ) : (
        <span className="text-halloween-charcoal text-sm" role="status">
          กำลังสร้าง QR…
        </span>
      )}
    </div>
  );
}
