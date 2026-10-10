'use client';

import { useEffect, useState } from 'react';
import { useNow } from '@/hooks/useBooking';
import type { StaffRound } from '@/lib/bookingTypes';
import { STAFF_WORDS, type StaffActivity, type StaffWords } from '@/lib/staffWords';
import AttendanceTab from './AttendanceTab';
import CheckInTab from './CheckInTab';
import DashboardTab from './DashboardTab';
import RoundsTab from './RoundsTab';
import WalkinTab from './WalkinTab';
import { Icon, Notice, Svg } from './ui';
import { toLogin, useStaffRounds } from './useStaffRounds';

export type Tab = 'checkin' | 'attendance' | 'dashboard' | 'walkin' | 'rounds';

const tabsFor = (w: StaffWords): { id: Tab; label: string; icon: React.ReactNode }[] => [
  { id: 'checkin', label: w.checkin, icon: Icon.scan },
  { id: 'attendance', label: 'รายชื่อ', icon: Icon.list },
  { id: 'dashboard', label: 'ภาพรวม', icon: Icon.grid },
  { id: 'walkin', label: 'Walk-in', icon: Icon.walkin },
  { id: 'rounds', label: 'รอบ', icon: Icon.clock },
];

/** What every tab gets: the polled rounds, a clock that ticks, and a way to refetch now. */
export type StaffCtx = {
  activity: StaffActivity;
  /** This activity's words for the booth (เช็กอิน / ลงทะเบียน …) */
  words: StaffWords;
  rounds: StaffRound[];
  now: number;
  updatedAt: string | null;
  refresh: () => Promise<void>;
  /** Open another tab, optionally on one round */
  go: (tab: Tab, roundId?: string) => void;
  /** Round picked on another tab (e.g. "ดูรายชื่อ →" from check-in) */
  roundHint: string | null;
};

const tabFromHash = (): Tab => {
  const h = window.location.hash.slice(1);
  return ['checkin', 'attendance', 'dashboard', 'walkin', 'rounds'].includes(h) ? (h as Tab) : 'checkin';
};

export type { StaffActivity };

// Staff back office for one bookable activity (issue #8; the Haunted House reuses it in
// its own colours). Phone first: bottom tab bar on a phone, tabs in the header on a tablet / laptop.
export default function StaffApp({ activity }: { activity: StaffActivity }) {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('checkin');
  const [roundHint, setRoundHint] = useState<string | null>(null);
  const { rounds, error, updatedAt, refresh } = useStaffRounds(ready);
  const now = useNow(5000);
  const words = STAFF_WORDS[activity];
  const TABS = tabsFor(words);

  useEffect(() => {
    fetch('/api/admin/login', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((data) => {
        if (data.role !== activity) return toLogin();
        setTab(tabFromHash());
        setReady(true);
      })
      .catch(toLogin);
  }, [activity]);

  const go = (next: Tab, roundId?: string) => {
    setTab(next);
    setRoundHint(roundId ?? null);
    history.replaceState(null, '', `#${next}`);
    window.scrollTo({ top: 0 });
  };

  const logout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' }).catch(() => {});
    toLogin();
  };

  if (!ready) return <div className="min-h-screen bg-halloween-dark" />;

  const ctx: StaffCtx | null = rounds ? { activity, words, rounds, now, updatedAt, refresh, go, roundHint } : null;

  return (
    <div className={`min-h-screen bg-halloween-dark text-halloween-cream ${activity === 'haunted_house' ? 'theme-haunted' : ''}`}>
      <header className="sticky top-0 z-30 border-b-2 border-halloween-purple bg-halloween-charcoal">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex flex-1 flex-col gap-0.5 md:flex-none">
            <span className="display-font text-[22px] leading-none tracking-wide text-halloween-orange">{words.title}</span>
            <span className="text-[13px] text-halloween-gray">Staff / หลังบ้าน</span>
          </div>
          <nav aria-label="เมนูหลังบ้าน" className="hidden flex-1 justify-center gap-1 md:flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => go(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center gap-2 rounded-[10px] px-3 text-[15px] font-bold lg:px-4 ${
                  tab === t.id ? 'bg-halloween-orange text-halloween-dark' : 'text-halloween-gray hover:bg-halloween-purple/40 hover:text-halloween-cream'
                }`}
              >
                <Svg size={20}>{t.icon}</Svg>
                {t.label}
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={logout}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border-2 border-halloween-purple px-3 text-sm font-bold hover:bg-halloween-purple/40"
          >
            <Svg size={20}>{Icon.logout}</Svg>
            ออก
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-4 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-12">
        {error && (
          <div className="mb-4">
            <Notice>{rounds ? `อัปเดตข้อมูลไม่ได้ (${error}) กำลังลองใหม่` : error}</Notice>
          </div>
        )}
        {!ctx ? (
          !error && <p className="py-16 text-center text-halloween-gray">กำลังโหลดข้อมูลรอบ…</p>
        ) : (
          <>
            {tab === 'checkin' && <CheckInTab ctx={ctx} />}
            {tab === 'attendance' && <AttendanceTab ctx={ctx} />}
            {tab === 'dashboard' && <DashboardTab ctx={ctx} />}
            {tab === 'walkin' && <WalkinTab ctx={ctx} />}
            {tab === 'rounds' && <RoundsTab ctx={ctx} />}
          </>
        )}
      </main>

      <nav
        aria-label="เมนูหลังบ้าน"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t-2 border-halloween-purple bg-halloween-charcoal pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => go(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`flex h-[68px] flex-col items-center justify-center gap-1 text-xs font-bold ${
              tab === t.id ? 'text-halloween-orange' : 'text-halloween-gray'
            }`}
          >
            <Svg>{t.icon}</Svg>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
