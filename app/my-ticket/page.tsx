'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import LoadingScreen from '@/components/LoadingScreen';

export default function MyTicketPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      // Check if user is logged in
      const studentId = localStorage.getItem('studentId');

      if (!studentId) {
        router.push('/');
        return;
      }

      // Fetch fresh data (via the server) to get latest attended status
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      }).catch(() => null);
      const data = response && response.ok ? (await response.json()).user : null;

      if (!data) {
        console.error('Error fetching user data');
        router.push('/');
        return;
      }

      setUserData(data);

      // Update localStorage with fresh data
      localStorage.setItem('userData', JSON.stringify(data));

      // Generate QR code
      QRCode.toDataURL(data.qr_code, {
        width: 400,
        margin: 2,
        color: {
          dark: '#ea7b29',
          light: '#1a0229',
        },
      }).then((url) => setQrCodeUrl(url));
    };

    fetchUserData();
  }, [router]);

  if (!userData) {
    return (
      <LoadingScreen message="กำลังพิมพ์ตั๋วเข้างานให้..." />
    );
  }

  return (
    <div className="image-background min-h-screen relative overflow-hidden">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" aria-hidden="true"></div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col p-4 sm:p-6">
        {/* Back Button */}
        <button
          onClick={() => router.push('/menu')}
          className="self-start mb-4 sm:mb-6 flex items-center gap-2 text-halloween-orange hover:text-halloween-red transition-colors"
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm sm:text-base font-semibold">Back</span>
        </button>

        {/* Centered Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="bg-halloween-charcoal/95 border-2 border-halloween-orange hand-cut p-6 sm:p-8 text-center relative">
              {/* Check-in Status Badge */}
              {userData.attended && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-halloween-red text-halloween-dark px-6 py-2 rounded-full border-4 border-halloween-charcoal shadow-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <span className="font-bold text-sm sm:text-base">เช็คอินแล้ว</span>
                  </div>
                </div>
              )}

              <h2 className="display-font text-3xl sm:text-4xl md:text-5xl text-halloween-orange mb-4 sm:mb-6">
                My Ticket
              </h2>

              <p className="text-sm sm:text-base text-halloween-bone mb-6 font-iannnnn-owl">
                แสดง QR Code นี้เมื่อเข้างาน
              </p>

              {qrCodeUrl && (
                <div className="bg-halloween-dark p-4 sm:p-6 rounded-lg inline-block mb-6">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="border-4 border-halloween-orange rounded w-full max-w-xs mx-auto"
                  />
                </div>
              )}

              <div className="bg-halloween-dark p-4 sm:p-5 rounded border border-halloween-purple space-y-3">
                <div>
                  <p className="text-halloween-gray text-xs sm:text-sm mb-1 font-iannnnn-owl">ชื่อ-นามสกุล</p>
                  <p className="text-halloween-cream text-lg sm:text-xl font-semibold">
                    {userData.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-halloween-gray text-xs sm:text-sm mb-1 font-iannnnn-owl">รหัสนิสิต</p>
                  <p className="text-halloween-orange text-xl sm:text-2xl font-mono font-bold tracking-wide">
                    {userData.student_id}
                  </p>
                </div>
                {userData.attended && userData.attended_at && (
                  <div className="pt-3 border-t border-halloween-purple/50">
                    <p className="text-halloween-gray text-xs sm:text-sm mb-1 font-iannnnn-owl">เวลาเช็คอิน</p>
                    <p className="text-green-400 text-base sm:text-lg font-semibold font-iannnnn-owl">
                      {new Date(userData.attended_at).toLocaleString('th-TH', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
