'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sponsors from '@/components/Sponsors';
import LoadingScreen from '@/components/LoadingScreen';
import BoothMap from './BoothMap';
import { KINDS, SHOPS, type ShopKind } from './booths';

export default function EventMapPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const mapBox = useRef<HTMLDivElement>(null);

  // From the list: bring the map into view and slide it so the booth is in the middle
  const showOnMap = (no: number) => {
    setSelected(no);
    const box = mapBox.current;
    const shop = SHOPS.find((s) => s.no === no);
    if (!box || !shop) return;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const inner = box.firstElementChild as HTMLElement;
    const x = ((shop.x + 18 - 230) / 1060) * inner.offsetWidth;
    box.scrollTo({ left: x - box.clientWidth / 2, behavior: 'smooth' });
  };

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

          {/* Shop plan: wider than a phone so the booth numbers stay readable; slides sideways */}
          <section className="w-full max-w-6xl lg:max-w-4xl mb-4 sm:mb-6 hand-cut border-2 border-halloween-orange bg-halloween-charcoal/95 py-4">
            <h3 className="px-4 text-lg font-bold">แผนผังร้านค้า {SHOPS.length} ร้าน</h3>
            <p className="px-4 pb-2 text-sm text-halloween-gray sm:hidden">เลื่อนซ้าย–ขวาเพื่อดูทั้งลาน</p>
            <div ref={mapBox} className="overflow-x-auto px-2">
              <div className="w-[760px] sm:w-full">
                <BoothMap selected={selected} onSelect={(no) => setSelected(no === selected ? null : no)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 px-4 pt-3 text-[13px]">
              {Object.values(KINDS).map((k) => (
                <span key={k.label} className="inline-flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded" style={{ background: k.fill }} />
                  {k.label}
                </span>
              ))}
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff4b3e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffd34d]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#3ccf7a]" />
                &nbsp;ถังขยะ
              </span>
            </div>
          </section>

          {/* Shops by kind: tap one to find it on the plan */}
          <section className="w-full max-w-6xl lg:max-w-4xl hand-cut border-2 border-halloween-purple bg-halloween-charcoal/95 px-4 py-4">
            <h3 className="text-lg font-bold">รายชื่อร้าน</h3>
            <p className="text-sm text-halloween-gray">กดชื่อร้านเพื่อดูว่าอยู่ตรงไหน</p>
            <div className="sm:grid sm:grid-cols-2 sm:gap-x-6">
              {(Object.keys(KINDS) as ShopKind[]).map((kind) => {
                const shops = SHOPS.filter((s) => s.kind === kind);
                return (
                  <div key={kind} className="mt-4">
                    <p className="flex items-center gap-2 text-[15px] font-bold" style={{ color: KINDS[kind].fill }}>
                      <span className="h-3 w-3 rounded-sm" style={{ background: KINDS[kind].fill }} />
                      {KINDS[kind].label} {shops.length} ร้าน
                    </p>
                    {shops.map((s) => (
                      <button
                        key={s.no}
                        type="button"
                        onClick={() => showOnMap(s.no)}
                        aria-pressed={selected === s.no}
                        className={`flex min-h-12 w-full items-center gap-3 border-t border-dashed border-halloween-gray/30 px-1 py-1.5 text-left text-base ${
                          selected === s.no ? 'rounded-lg bg-white/10' : ''
                        }`}
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[15px] font-bold text-halloween-dark"
                          style={{ background: KINDS[kind].fill }}
                        >
                          {s.no}
                        </span>
                        <span className="flex-1">{s.name}</span>
                        {selected === s.no && <span className="text-xs font-bold">ดูบนแผนที่ ↑</span>}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
        </div>

        {/* Sponsors */}
        <Sponsors className="shrink-0 px-4 pb-5 pt-3" />
      </div>
    </div>
  );
}
