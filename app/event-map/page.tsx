'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Sponsors from '@/components/Sponsors';
import LoadingScreen from '@/components/LoadingScreen';

export default function EventMapPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) {
      router.push('/');
      return;
    }
    setIsLoggedIn(true);
  }, [router]);

  if (!isLoggedIn) {
    return (
      <LoadingScreen message="กำลังกางแผนที่ป่าช้า..." />
    );
  }

  return (
    <div className="image-background min-h-screen relative overflow-hidden">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" aria-hidden="true"></div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col p-4 sm:p-6">
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

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
          <h2 className="title-font text-3xl sm:text-4xl md:text-5xl font-bold text-halloween-cream mb-6 text-center -rotate-2">
            The Haunted Carnival Map
          </h2>

          {/* Event Information */}
          <div className="w-full max-w-6xl lg:max-w-4xl mb-4 sm:mb-6">
            <div className="bg-linear-to-br from-halloween-charcoal/90 to-halloween-dark/90 hand-cut p-5 sm:p-7 border-2 border-halloween-orange/30 shadow-lg shadow-halloween-orange/10">
              <div className="text-halloween-cream flex flex-col md:flex-row gap-5 md:gap-8 lg:gap-10 justify-center items-center md:items-start">
                <div className="flex items-start gap-3 w-full md:w-auto md:flex-1 md:justify-end">
                  <div className="bg-halloween-orange/20 p-2.5 rounded-lg shrink-0">
                    <svg className="w-6 h-6 text-halloween-orange" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-halloween-orange mb-2 text-base sm:text-lg font-iannnnn-owl">สถานที่จัดงาน</h3>
                    <p className="text-sm sm:text-base">Larngear, Faculty of Engineering</p>
                    <p className="text-sm sm:text-base">Chulalongkorn University</p>
                  </div>
                </div>

                <div className="hidden md:block w-px h-16 bg-halloween-orange/30"></div>

                <div className="flex items-start gap-3 w-full md:w-auto md:flex-1 md:justify-start">
                  <div className="bg-halloween-orange/20 p-2.5 rounded-lg shrink-0">
                    <svg className="w-6 h-6 text-halloween-orange" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-halloween-orange mb-2 text-base sm:text-lg font-iannnnn-owl">วันและเวลา</h3>
                    <p className="text-sm sm:text-base font-iannnnn-owl">22 ตุลาคม 2569</p>
                    <p className="text-sm sm:text-base font-iannnnn-owl">เวลา 16:00 - 21:00 น.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Image - Full width */}
          <div className="relative w-full max-w-6xl lg:max-w-4xl mb-4 sm:mb-6">
            <Image
              src="/event-map.png"
              alt="Event Map"
              width={1200}
              height={1200}
              className="w-full h-auto rounded-lg"
              quality={75}
              priority
              unoptimized
            />
          </div>

          {/* Student Vendor Booths */}
          <div className="w-full max-w-6xl lg:max-w-4xl">
            <div className="bg-halloween-purple/40 border-2 border-halloween-purple/80 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <svg className="w-5 h-5 text-halloween-cream" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 7h-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 5h4v2h-4V5zm10 14H4V9h16v10z"/>
                </svg>
                <h3 className="font-bold text-halloween-cream text-base sm:text-lg text-center">Student Vendor Booths</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-halloween-orange font-iannnnn-owl">
                <div className="text-sm sm:text-base whitespace-nowrap px-2 py-1.5 bg-halloween-dark/70 rounded"><span className="font-bold text-halloween-cream">A01</span> - ปุ๊กปิ๊กจิ๊กมัน</div>
                <div className="text-sm sm:text-base whitespace-nowrap px-2 py-1.5 bg-halloween-dark/70 rounded"><span className="font-bold text-halloween-cream">A02</span> - BOO-Bap 부 밥</div>
                <div className="text-sm sm:text-base whitespace-nowrap px-2 py-1.5 bg-halloween-dark/70 rounded"><span className="font-bold text-halloween-cream">A03</span> - KINTIEKYEROT</div>
                <div className="text-sm sm:text-base whitespace-nowrap px-2 py-1.5 bg-halloween-dark/70 rounded"><span className="font-bold text-halloween-cream">A04</span> - พาสต้าเดบิต เครดิตเรเวนิว</div>
                <div className="text-sm sm:text-base whitespace-nowrap px-2 py-1.5 bg-halloween-dark/70 rounded"><span className="font-bold text-halloween-cream">A05</span> - ราชาหิมะ</div>
                <div className="text-sm sm:text-base whitespace-nowrap px-2 py-1.5 bg-halloween-dark/70 rounded"><span className="font-bold text-halloween-cream">A06</span> - bro_ok (โบร - โอ - เค)</div>
                <div className="text-sm sm:text-base whitespace-nowrap px-2 py-1.5 bg-halloween-dark/70 rounded"><span className="font-bold text-halloween-cream">A07</span> - กรี้ก ! โยเกิร์ต</div>
                <div className="text-sm sm:text-base whitespace-nowrap px-2 py-1.5 bg-halloween-dark/70 rounded"><span className="font-bold text-halloween-cream">A08</span> - ละครวิดวะ</div>
                <div className="text-sm sm:text-base whitespace-nowrap px-2 py-1.5 bg-halloween-dark/70 rounded"><span className="font-bold text-halloween-cream">A09</span> - บาร์ลับต้องมนต์</div>
                <div className="text-sm sm:text-base whitespace-nowrap px-2 py-1.5 bg-halloween-dark/70 rounded"><span className="font-bold text-halloween-cream">A10</span> - Milk & Tea</div>
                <div className="text-sm sm:text-base whitespace-nowrap px-2 py-1.5 bg-halloween-dark/70 rounded"><span className="font-bold text-halloween-cream">A11</span> - Disney villain soda</div>
                <div className="text-sm sm:text-base whitespace-nowrap px-2 py-1.5 bg-halloween-dark/70 rounded"><span className="font-bold text-halloween-cream">A12</span> - MILOWEEN</div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Sponsors */}
        <Sponsors className="shrink-0 px-4 pb-5 pt-3" />
      </div>
    </div>
  );
}
