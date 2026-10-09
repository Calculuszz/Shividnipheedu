'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EventName from '@/components/EventName';
import Sponsors from '@/components/Sponsors';
import LoadingScreen from '@/components/LoadingScreen';
import Doodle, { type DoodleName } from '@/components/Doodle';
import { booByName } from '@/app/what-ghost/quiz';
import PickABooCard from './PickABooCard';

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
    return <LoadingScreen message="กำลังตามหาตัวคุณในบัญชีผี..." />;
  }

  if (navigating) {
    return <LoadingScreen />;
  }

  // path null = booking page not built yet: shown, but not clickable
  const menuItems: { title: string; path: string | null; icon: DoodleName; tilt: string }[] = [
    { title: 'My Ticket', path: '/my-ticket', icon: 'pumpkin', tilt: '-rotate-1' },
    { title: 'Book Escape Room', path: '/escape-room', icon: 'skull', tilt: 'rotate-[0.5deg]' },
    { title: 'Book Haunted House', path: null, icon: 'tombstone', tilt: '-rotate-[0.5deg]' },
    { title: 'Event Map', path: '/event-map', icon: 'broom', tilt: 'rotate-1' },
    { title: 'Schedule', path: '/schedule', icon: 'moon', tilt: '-rotate-[0.5deg]' },
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
          <h1 className="display-font text-3xl sm:text-4xl text-halloween-orange -rotate-2">
            <EventName />
          </h1>
        </div>

        {/* Pick a boo quiz: start art, or the boo from last time */}
        <div className="shrink-0 flex justify-center w-full">
          <PickABooCard result={booByName(userData.ghost_result)} onStart={() => handleNavigate('/what-ghost')} />
        </div>

        {/* Menu - Single Column Vertical */}
        <div className="shrink-0 flex justify-center w-full">
          <div className="w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[340px] space-y-2 sm:space-y-2.5">
            {menuItems.map((item) => {
              const path = item.path;
              if (!path) {
                return (
                  <div
                    key={item.title}
                    aria-disabled="true"
                    className={`w-full bg-halloween-charcoal/70 border-2 border-dashed border-halloween-orange/60 hand-cut ${item.tilt} p-3 sm:p-4 md:p-5 lg:p-4 flex items-center gap-3 sm:gap-4 md:gap-5 opacity-80`}
                  >
                    <span className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 grayscale-[40%]">
                      <Doodle name={item.icon} className="max-w-full max-h-full w-auto h-auto" />
                    </span>
                    <span className="text-sm sm:text-base md:text-lg lg:text-lg font-bold text-halloween-cream/80 text-left flex-1">
                      {item.title}
                    </span>
                    <span className="shrink-0 rounded-full border border-halloween-orange/60 px-2 py-0.5 text-[11px] sm:text-xs font-bold text-halloween-orange">
                      เร็ว ๆ นี้
                    </span>
                  </div>
                );
              }
              return (
              <button
                key={item.title}
                onClick={() => handleNavigate(path)}
                className={`w-full bg-halloween-charcoal/90 hover:bg-halloween-orange/90 border-2 border-halloween-orange hand-cut ${item.tilt} hover:rotate-0 p-3 sm:p-4 md:p-5 lg:p-4 flex items-center gap-3 sm:gap-4 md:gap-5 transition-all active:scale-98 group`}
              >
                <span className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-transform shrink-0">
                  <Doodle name={item.icon} className="max-w-full max-h-full w-auto h-auto" />
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
              );
            })}
          </div>
        </div>
        </div>

        {/* Sponsors */}
        <Sponsors className="shrink-0 pb-5 pt-3" />
      </div>
    </div>
  );
}
