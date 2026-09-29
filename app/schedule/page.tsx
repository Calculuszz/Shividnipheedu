'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SchedulePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMovieModal, setShowMovieModal] = useState(false);

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
      <div className="fixed inset-0 flex items-center justify-center bg-halloween-dark">
        <p className="text-halloween-cream text-xl">กำลังโหลด...</p>
      </div>
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

        {/* Centered Content */}
        <div className="flex-1 flex items-center justify-center py-6">
          <div className="w-full max-w-5xl space-y-6">
            {/* Page Title */}
            <div className="text-center mb-8">
              <h2 className="title-font text-3xl sm:text-4xl md:text-5xl font-bold text-halloween-cream mb-6 text-center">
                Event Schedule
              </h2>
              <div className="inline-flex items-center gap-3 text-halloween-cream bg-halloween-charcoal/80 px-6 py-3 rounded-full border-2 border-halloween-orange/50">
                <svg className="w-6 h-6 text-halloween-orange" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="font-bold text-lg font-iannnnn-owl">22 ตุลาคม 2569</p>
                  <p className="text-sm text-halloween-orange font-iannnnn-owl">16:00 - 21:00 น.</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5 px-4">
              {/* Main Stage Schedule - Clean Timeline */}
              <div className="bg-linear-to-br from-halloween-purple/25 via-halloween-charcoal/90 to-halloween-dark/95 border border-halloween-purple/40 rounded-xl p-5 shadow-xl">
                <div className="mb-4 pb-3 border-b-2 border-halloween-purple/30">
                  <h2 className="text-2xl font-black text-halloween-cream tracking-tight">
                    MAIN STAGE
                  </h2>
                  <p className="text-halloween-cream text-xs font-bold mt-1 uppercase tracking-widest">Performance Schedule</p>
                </div>

                <div className="space-y-2.5">
                  {[
                    { time: '16:00', event: 'Register and Lost&Found' },
                    { time: '17:35', event: 'Intania Music Club', type: 'Acoustic' },
                    { time: '18:10', event: 'BANDSHI', type: 'Acoustic' },
                    { time: '18:34', event: 'Dance Performance', artist: 'BANDSHI' },
                    { time: '18:40', event: 'Dance Performance', artist: 'StepOut' },
                    { time: '18:51', event: 'Collab Dance' },
                    { time: '19:10', event: 'Movie Starts', title: 'The Conjuring', clickable: true },
                  ].map((item, index) => (
                    <div
                      key={index}
                      onClick={item.clickable ? () => setShowMovieModal(true) : undefined}
                      className={`flex items-start gap-3 p-2.5 rounded-lg bg-halloween-dark/40 border-l-3 border-halloween-purple hover:bg-halloween-purple/20 hover:border-halloween-orange transition-all group ${item.clickable ? 'cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-halloween-purple/30' : ''}`}
                    >
                      <div className="shrink-0 pt-0.5">
                        <div className="bg-halloween-orange px-2.5 py-1 rounded-md">
                          <span className="font-black text-halloween-cream text-xs">{item.time}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-halloween-cream font-bold text-sm group-hover:text-halloween-orange transition-colors">
                          {item.event}
                        </p>
                        {(item.type || item.artist || item.title) && (
                          <p className="text-halloween-cream/70 text-xs mt-0.5">
                            {item.type || item.artist || item.title}
                          </p>
                        )}
                        {item.clickable && (
                          <div className="flex items-center gap-1 mt-1">
                            <svg className="w-3 h-3 text-halloween-orange animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="text-halloween-orange text-[10px] font-bold uppercase tracking-wider animate-pulse">Click to reveal movie</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activities - Bold Cards */}
              <div className="bg-linear-to-br from-halloween-orange/20 via-halloween-charcoal/90 to-halloween-dark/95 border border-halloween-orange/40 rounded-xl p-5 shadow-xl">
                <div className="mb-4 pb-3 border-b-2 border-halloween-orange/30">
                  <h2 className="text-2xl font-black text-halloween-cream tracking-tight text-center font-iannnnn-owl">
                    กิจกรรมภายในงาน
                  </h2>
                  <p className="text-halloween-orange text-xs font-bold mt-1 uppercase tracking-widest text-center">Available All Night</p>
                </div>

                <div className="space-y-2.5">
                  {[
                    { name: 'หนังกลางแปลงสุดหลอน', tag: 'MOVIE' },
                    { name: 'บ้านผีสิง', tag: 'HAUNTED' },
                    { name: 'โชว์สุดพิเศษ', tag: 'SHOW' },
                    { name: 'ร้านค้านิสิต', tag: 'VENDOR' },
                  ].map((activity, index) => (
                    <div
                      key={index}
                      className="relative bg-halloween-dark/60 border-2 border-halloween-orange/30 rounded-lg p-3.5 hover:border-halloween-orange hover:bg-halloween-orange/10 transition-all group overflow-hidden"
                    >
                      <div className="absolute top-2 right-2 bg-halloween-orange/20 px-2 py-0.5 rounded-full">
                        <span className="text-halloween-orange text-[10px] font-black tracking-wider">{activity.tag}</span>
                      </div>
                      <p className="text-halloween-cream font-bold text-base pr-16 group-hover:text-halloween-orange transition-colors font-iannnnn-owl">
                        {activity.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Sponsors Section - Same as menu page */}
        <div className="shrink-0 w-full">
          <div className="bg-halloween-charcoal/70 border-t-2 border-halloween-orange py-2 px-0">
            <p className="text-center text-halloween-orange font-bold text-xs mb-1.5">Our Sponsors</p>
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {[
                { src: '/sponsors/cqk-hotpot-logo-2-copy.png', alt: 'CQK Hotpot' },
                { src: '/sponsors/escaperoomlogo.png', alt: 'Escape Room' },
                { src: '/sponsors/tri-petch-isuzu-sales-.png', alt: 'Tri Petch Isuzu Sales' },
                { src: '/sponsors/img_0628.jpg', alt: 'Sponsor' },
                { src: '/sponsors/img_7475.jpg', alt: 'Sponsor' },
                { src: '/sponsors/img_7476.jpg', alt: 'Sponsor' },
                { src: '/sponsors/img_7484.jpg', alt: 'Sponsor' },
              ].map((sponsor, index) => (
                <div key={index} className="w-[35px] h-[35px] sm:w-[40px] sm:h-[40px] md:w-[45px] md:h-[45px] flex items-center justify-center">
                  <Image
                    src={sponsor.src}
                    alt={sponsor.alt}
                    width={45}
                    height={45}
                    className="w-full h-full object-contain"
                    quality={75}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Movie Modal */}
      {showMovieModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-sm"
          onClick={() => setShowMovieModal(false)}
        >
          <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMovieModal(false)}
              className="absolute -top-8 right-0 sm:-top-10 sm:right-0 text-halloween-cream hover:text-halloween-orange transition-colors z-10"
              type="button"
              aria-label="Close movie modal"
            >
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="bg-halloween-charcoal/95 border-2 border-halloween-orange rounded-lg p-3 sm:p-4 shadow-2xl">
              <div className="relative w-full" style={{ maxHeight: '75vh' }}>
                <Image
                  src="/movie.jpg"
                  alt="Movie Schedule"
                  width={800}
                  height={1200}
                  className="w-full h-auto max-h-[75vh] object-contain rounded-lg"
                  quality={95}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
