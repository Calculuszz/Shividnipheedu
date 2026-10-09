'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Sponsors from '@/components/Sponsors';
import LoadingScreen from '@/components/LoadingScreen';
import Doodle, { type DoodleName } from '@/components/Doodle';

const MOVIE = {
  title: 'คืนสยองห้องดับจิต',
  original: 'The Mortuary Assistant',
  poster: '/movie/the-mortuary-assistant.jpg',
};

const STAGE: { time: string; title: string; note?: string; movie?: boolean }[] = [
  { time: '17:33', title: 'Intania Music Club', note: 'วงดนตรี' },
  { time: '18:00', title: 'BANdSHI', note: 'วงดนตรี' },
  { time: '18:27', title: 'ตุ้ยนุ้ยโยกเย้ก', note: 'วงดนตรี' },
  { time: '18:48', title: 'Dance Performance', note: 'จาก 3 ชมรม' },
  { time: '19:15', title: 'Dance Collab' },
  { time: '19:30', title: 'ฉายหนังกลางแปลง', note: MOVIE.title, movie: true },
];

const ACTIVITIES: { name: string; note: string; stamp: string; icon: DoodleName; tilt: string }[] = [
  { name: 'Escape Room', note: 'รอบละ 20 นาที · 17:00–21:05 น.', stamp: 'จองก่อน', icon: 'skull', tilt: '-rotate-1' },
  { name: 'บ้านผีสิง', note: 'กล้าก็เข้ามา', stamp: 'หลอน', icon: 'tombstone', tilt: 'rotate-1' },
  { name: 'หนังกลางแปลง', note: `${MOVIE.title} · 19:30 น.`, stamp: 'ฉายคืนนี้', icon: 'moon', tilt: '-rotate-[0.5deg]' },
  { name: 'ดนตรีและการแสดง', note: 'ที่เวทีกลาง ตั้งแต่ 17:33 น.', stamp: 'เวที', icon: 'bat', tilt: 'rotate-[0.5deg]' },
  { name: 'ร้านค้านิสิต', note: 'ของกินของใช้ตลอดงาน', stamp: 'ช้อป', icon: 'potion', tilt: '-rotate-1' },
];

// Strip of masking tape holding a card to the page
function Tape({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`absolute h-5 w-20 bg-halloween-cream/60 ${className}`} />;
}

export default function SchedulePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPoster, setShowPoster] = useState(false);

  useEffect(() => {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) {
      router.push('/');
      return;
    }
    setIsLoggedIn(true);
  }, [router]);

  useEffect(() => {
    if (!showPoster) return;
    const close = (e: KeyboardEvent) => e.key === 'Escape' && setShowPoster(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [showPoster]);

  if (!isLoggedIn) {
    return (
      <LoadingScreen message="กำลังเปิดตารางเวลาผีออกอาละวาด..." />
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
          className="self-start mb-4 sm:mb-6 flex items-center gap-2 min-h-11 text-halloween-orange hover:text-halloween-red transition-colors"
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

        <div className="flex-1 flex justify-center pb-8">
          <div className="w-full max-w-5xl">
            {/* Page Title */}
            <div className="relative text-center mb-8">
              <Doodle name="bat-small" className="absolute right-[8%] -top-2 w-12 rotate-12" />
              <h1 className="title-font text-4xl sm:text-5xl text-halloween-orange -rotate-2">
                Event Schedule
              </h1>
              <p className="inline-block mt-4 px-4 py-1.5 bg-halloween-cream text-halloween-charcoal font-bold text-base sm:text-lg hand-cut rotate-1">
                พฤหัสฯ 22 ตุลาคม 2569 · 16:00–21:00 น.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-6 items-start">
              {/* Main stage */}
              <section className="relative bg-halloween-charcoal/90 border-2 border-halloween-orange hand-cut px-5 pt-7 pb-5 -rotate-[0.5deg] shadow-[0_16px_32px_-12px_rgba(0,0,0,0.6)]">
                <Tape className="-top-2.5 left-1/2 -translate-x-1/2 rotate-3" />
                <div className="flex items-end justify-between gap-3 mb-5">
                  <div>
                    <h2 className="display-font text-3xl text-halloween-cream leading-none">Main Stage</h2>
                    <p className="text-halloween-gray text-sm mt-1">เวทีกลาง</p>
                  </div>
                  <Doodle name="pumpkin" className="w-12 -rotate-6 shrink-0" />
                </div>

                <ol className="relative">
                  {/* Hand-drawn-ish dashed line down the timeline */}
                  <span aria-hidden="true" className="absolute left-[calc(4.5rem+0.4375rem-1px)] top-2 bottom-2 border-l-2 border-dashed border-halloween-purple" />
                  {STAGE.map((item) => (
                    <li key={item.time} className="relative flex gap-4 py-2.5">
                      <time className="w-14 shrink-0 text-right display-font text-xl text-halloween-orange leading-tight">
                        {item.time}
                      </time>
                      <span
                        aria-hidden="true"
                        className={`relative z-10 mt-1.5 w-3.5 h-3.5 shrink-0 rounded-full border-2 ${
                          item.movie ? 'bg-halloween-moon border-halloween-moon' : 'bg-halloween-charcoal border-halloween-orange'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className={`font-bold text-base leading-snug ${item.movie ? 'text-halloween-moon' : 'text-halloween-cream'}`}>
                          {item.title}
                        </p>
                        {item.note && <p className="text-halloween-gray text-sm">{item.note}</p>}
                        {item.movie && (
                          <button
                            type="button"
                            onClick={() => setShowPoster(true)}
                            className="mt-1.5 min-h-11 inline-flex items-center gap-1.5 text-halloween-orange font-bold text-sm underline decoration-wavy decoration-halloween-orange/60 underline-offset-4 hover:text-halloween-moon"
                          >
                            ดูโปสเตอร์หนัง
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <div className="flex flex-col gap-8">
                {/* Tonight's movie, taped up like a printed poster */}
                <section className="relative self-center md:self-stretch flex gap-4 items-center bg-halloween-cream text-halloween-charcoal p-3 pr-4 hand-cut rotate-1 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.6)]">
                  <Tape className="-top-2.5 left-6 -rotate-6 bg-halloween-moon/70" />
                  <button
                    type="button"
                    onClick={() => setShowPoster(true)}
                    aria-label={`ดูโปสเตอร์ ${MOVIE.title} ขนาดเต็ม`}
                    className="shrink-0 -rotate-2 hover:rotate-0 transition-transform"
                  >
                    <Image
                      src={MOVIE.poster}
                      alt=""
                      width={108}
                      height={151}
                      className="w-24 sm:w-28 h-auto border-4 border-white shadow-md"
                      quality={75}
                    />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-halloween-orange">หนังกลางแปลง · 19:30 น.</p>
                    <h2 className="text-2xl font-bold leading-tight mt-0.5">{MOVIE.title}</h2>
                    <p className="text-sm text-halloween-purple">{MOVIE.original}</p>
                    <p className="text-sm mt-2">ปูเสื่อหน้าจอรอได้เลย</p>
                  </div>
                </section>

                {/* Activities */}
                <section className="relative bg-halloween-charcoal/90 border-2 border-halloween-purple hand-cut px-5 pt-6 pb-5 rotate-[0.5deg] shadow-[0_16px_32px_-12px_rgba(0,0,0,0.6)]">
                  <Doodle name="web" className="absolute -top-4 -right-4 w-16 opacity-80 rotate-6" />
                  <h2 className="text-2xl font-bold text-halloween-cream">กิจกรรมภายในงาน</h2>
                  <p className="text-halloween-gray text-sm mb-4">เดินเล่นได้ทั้งคืน</p>

                  <ul className="space-y-3">
                    {ACTIVITIES.map((a) => (
                      <li
                        key={a.name}
                        className={`flex items-center gap-3 bg-halloween-dark/60 border-2 border-halloween-purple/70 hand-cut p-3 ${a.tilt}`}
                      >
                        <span className="w-10 h-10 shrink-0 flex items-center justify-center">
                          <Doodle name={a.icon} className="max-w-full max-h-full w-auto h-auto" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-halloween-cream leading-snug">{a.name}</p>
                          <p className="text-sm text-halloween-gray">{a.note}</p>
                        </div>
                        {/* Rubber-stamp label */}
                        <span className="shrink-0 px-2 py-0.5 border-2 border-halloween-orange text-halloween-orange text-xs font-bold -rotate-6 rounded-[6px_10px_5px_9px]">
                          {a.stamp}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Sponsors */}
        <Sponsors className="shrink-0 pb-5 pt-3" />
      </div>

      {/* Full poster */}
      {showPoster && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={MOVIE.title}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85"
          onClick={() => setShowPoster(false)}
        >
          <div className="relative -rotate-1" onClick={(e) => e.stopPropagation()}>
            <Tape className="-top-2.5 left-1/2 -translate-x-1/2 rotate-2 z-10" />
            <Image
              src={MOVIE.poster}
              alt={`โปสเตอร์ ${MOVIE.title} (${MOVIE.original})`}
              width={1081}
              height={1513}
              // As wide as the screen allows while the whole poster still fits in 78vh
              className="w-[min(86vw,calc(78vh*1081/1513))] h-auto border-8 border-halloween-cream shadow-2xl"
              quality={80}
            />
            <button
              onClick={() => setShowPoster(false)}
              className="absolute -top-4 -right-4 w-11 h-11 flex items-center justify-center rounded-full bg-halloween-orange text-halloween-dark border-2 border-halloween-cream"
              type="button"
              aria-label="ปิดโปสเตอร์"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
