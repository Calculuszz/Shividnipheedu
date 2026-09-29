'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EventName from '@/components/EventName';
import Image from 'next/image';
import LoadingScreen from '@/components/LoadingScreen';

// Ghost image mapping - All 7 ghosts
const ghostImages: Record<string, string> = {
  'ผีนางรำ': '/ghosts/ผีนางรำ.png',
  'ผีแม่นาค': '/ghosts/ผีแม่นาค.png',
  'แวมไพร์': '/ghosts/แวมไพร์.png',
  'ซอมบี้': '/ghosts/ซอมบี้.png',
  'ผีสาวญี่ปุ่นคอยาว': '/ghosts/ผีญี่ปุ่นคอยาว.png',
  'ผีปอบ': '/ghosts/ผีปอบ.png',
  'Zatan': '/ghosts/zatan.png',
};

const defaultGhostImage = '/ghosts/default.png';

export default function MenuPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const studentId = localStorage.getItem('studentId');
    const userDataStr = localStorage.getItem('userData');

    if (!studentId || !userDataStr) {
      router.push('/');
      return;
    }

    const data = JSON.parse(userDataStr);
    setUserData(data);
  }, [router]);

  const handleLogout = () => {
    setNavigating(true);
    localStorage.removeItem('studentId');
    localStorage.removeItem('userData');
    router.push('/');
  };

  const handleNavigate = (path: string) => {
    setNavigating(true);
    router.push(path);
  };

  if (!userData) {
    return <LoadingScreen message="กำลังโหลด..." />;
  }

  if (navigating) {
    return <LoadingScreen />;
  }

  const menuItems = [
    { title: 'My Ticket', path: '/my-ticket', icon: '🎫' },
    { title: 'Event Map', path: '/event-map', icon: '🗺️' },
    { title: 'Schedule', path: '/schedule', icon: '📅' },
  ];

  return (
    <div className="image-background min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20 pointer-events-none" aria-hidden="true"></div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col overflow-hidden">
        {/* Main content with gaps */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-5 px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10">
        {/* Logout Icon - Top Right (Scrolls with content) */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 z-20">
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 sm:p-2 md:p-3 rounded-full bg-halloween-charcoal/80 hover:bg-halloween-red/90 border-2 border-halloween-orange transition-all active:scale-95 group"
            aria-label="Sign out"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-halloween-cream group-hover:text-halloween-dark transition-colors"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* Header */}
        <div className="text-center shrink-0">
          <h1 className="display-font text-3xl sm:text-4xl text-halloween-orange">
            <EventName withYear={false} />
          </h1>
        </div>

        {/* Ghost Display Section */}
        <div className="shrink-0 flex justify-center w-full">
          <div className="w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[340px] bg-halloween-charcoal/90 border-2 border-halloween-orange rounded-lg flex flex-col items-center justify-center p-4 sm:p-5 md:p-6 lg:p-5">
            {/* Ghost Image */}
            <div className="w-full flex items-center justify-center mb-2 sm:mb-3 pt-2 sm:pt-3">
              <Image
                src={userData.ghost_result ? ghostImages[userData.ghost_result] : defaultGhostImage}
                alt={userData.ghost_result || 'Mystery Ghost'}
                width={200}
                height={200}
                className="rounded-lg w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 object-contain"
                priority
                quality={75}
              />
            </div>

            {/* Ghost Name or Question */}
            {userData.ghost_result ? (
              <>
                <p className="text-base sm:text-lg md:text-2xl lg:text-xl font-bold text-halloween-orange mb-2 sm:mb-3 md:mb-3 font-iannnnn-owl">
                  {userData.ghost_result}
                </p>
                <button
                  type="button"
                  onClick={() => handleNavigate('/what-ghost')}
                  className="bg-halloween-purple hover:bg-halloween-orange border-2 border-halloween-orange text-halloween-cream hover:text-halloween-dark font-bold text-xs sm:text-sm md:text-base px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-full transition-all active:scale-95 shadow-lg flex items-center gap-1.5 sm:gap-2"
                >
                  <span>👻</span>
                  <span className="font-iannnnn-owl">เล่นอีกครั้ง</span>
                </button>
              </>
            ) : (
              <>
                <p className="text-sm sm:text-base md:text-lg text-halloween-cream font-medium mb-2 sm:mb-2.5">
                  What Ghost Am I?
                </p>
                {/* Button - Different style when not played yet */}
                <button
                  type="button"
                  onClick={() => handleNavigate('/what-ghost')}
                  className="bg-halloween-purple hover:bg-halloween-orange border-2 border-halloween-orange text-halloween-cream hover:text-halloween-dark font-bold text-xs sm:text-sm md:text-base px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-full transition-all active:scale-95 shadow-lg flex items-center gap-1.5 sm:gap-2 relative"
                >
                  {/* Notification Dot */}
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-red-600 rounded-full"></span>
                  <span>👻</span>
                  <span>Let's Find Out!</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Menu - Single Column Vertical */}
        <div className="shrink-0 flex justify-center w-full">
          <div className="w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[340px] space-y-2 sm:space-y-2.5">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className="w-full bg-halloween-charcoal/90 hover:bg-halloween-orange/90 border-2 border-halloween-orange rounded-lg p-3 sm:p-4 md:p-5 lg:p-4 flex items-center gap-3 sm:gap-4 md:gap-5 transition-all active:scale-98 group"
              >
                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl group-hover:scale-110 transition-transform shrink-0">
                  {item.icon}
                </span>
                <span className="text-sm sm:text-base md:text-lg lg:text-lg font-bold text-halloween-cream group-hover:text-halloween-dark text-left flex-1">
                  {item.title}
                </span>
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-halloween-orange group-hover:text-halloween-dark transition-colors shrink-0"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
        </div>

        {/* Sponsors Section - Separate from gapped content */}
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
    </div>
  );
}
