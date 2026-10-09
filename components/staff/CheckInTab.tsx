'use client';

import { useRef, useState } from 'react';
import { BookingApiError, staff } from '@/lib/bookingClient';
import { formatTime, formatTimeRange } from '@/lib/bookingTime';
import type { StaffPlayer, StaffRound } from '@/lib/bookingTypes';
import { maskId, minutesText, notArrived, roundName, roundPhase, staffCheckinError } from '@/lib/staffRounds';
import BookingScanner from './BookingScanner';
import type { StaffCtx } from './StaffApp';
import { Chip, Icon, LeaderChip, Notice, Svg, btn, card, meta } from './ui';
import { staffFail } from './useStaffRounds';

type Result = { id: string; ok: boolean; title: string; action?: string; walkin?: boolean };

export default function CheckInTab({ ctx }: { ctx: StaffCtx }) {
  const { rounds, now } = ctx;
  const [scanning, setScanning] = useState(false);
  const audio = useRef<AudioContext | null>(null);

  const [q, setQ] = useState('');
  const [players, setPlayers] = useState<StaffPlayer[] | null>(null);
  const [searchError, setSearchError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQ = useRef('');

  const open = rounds.find((r) => roundPhase(r, now) === 'checkin') ?? null;
  const next = rounds.find((r) => roundPhase(r, now) === 'upcoming') ?? null;
  const byId = new Map(rounds.map((r) => [r.id, r]));

  const startScan = () => {
    // Sound is only allowed after a tap, so the audio starts here
    try {
      audio.current ??= new AudioContext();
      void audio.current.resume();
    } catch {
      // No Web Audio: vibration only
    }
    setScanning(true);
  };

  const search = async (text: string) => {
    lastQ.current = text;
    try {
      const data = await staff.search(text);
      if (lastQ.current !== text) return;
      setPlayers(data.players);
      setSearchError('');
    } catch (e) {
      if (lastQ.current === text) setSearchError(staffFail(e));
    }
  };

  const onType = (value: string) => {
    setQ(value);
    setResult(null);
    if (timer.current) clearTimeout(timer.current);
    const text = value.trim();
    if (text.length < 2) {
      lastQ.current = '';
      setPlayers(null);
      return;
    }
    timer.current = setTimeout(() => void search(text), 300);
  };

  const checkIn = async (p: StaffPlayer) => {
    setBusyId(p.id);
    setResult(null);
    try {
      await staff.checkInById(p.id);
      setResult({ id: p.id, ok: true, title: `เช็กอิน ${p.full_name} แล้ว` });
      setPlayers((list) =>
        list?.map((x) => (x.id === p.id ? { ...x, live_status: 'checked_in', checked_in_at: new Date(now).toISOString() } : x)) ?? null
      );
      void ctx.refresh();
    } catch (e) {
      const code = e instanceof BookingApiError ? e.code : '';
      const text = code ? staffCheckinError(code) : { title: staffFail(e), action: undefined };
      setResult({ id: p.id, ok: false, ...text });
      if (lastQ.current) void search(lastQ.current);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
      <div className="flex flex-col gap-3.5 lg:sticky lg:top-[88px]">
        <OpenRoundCard open={open} next={next} now={now} onList={(id) => ctx.go('attendance', id)} />

        <button type="button" onClick={startScan} className={`${btn()} min-h-[72px] w-full text-[22px]`}>
          <Svg size={28}>{Icon.scan}</Svg>
          สแกน QR
        </button>
        <p className="-mt-1 text-center text-sm text-halloween-gray">สแกนทีละคน ทุกคนในทีมมี QR ของตัวเอง</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5 text-[13px] text-halloween-gray lg:hidden">
          <span className="h-px flex-1 bg-halloween-purple" />
          สแกนไม่ได้? ค้นหาชื่อแทน
          <span className="h-px flex-1 bg-halloween-purple" />
        </div>
        <label htmlFor="staff-search" className="text-sm font-bold">
          <span className="hidden lg:inline">สแกนไม่ได้? </span>ค้นหาด้วยชื่อ หรือรหัสนิสิต
        </label>
        <div className="relative">
          <input
            id="staff-search"
            type="search"
            value={q}
            onChange={(e) => onType(e.target.value)}
            placeholder="เช่น ณิชา หรือ 6631"
            autoComplete="off"
            className="h-12 w-full rounded-[10px] border-2 border-halloween-purple bg-halloween-dark pl-11 pr-3.5 text-base text-halloween-cream placeholder:text-halloween-gray/70 focus:border-halloween-orange focus:outline-none"
          />
          <Svg size={20} className="pointer-events-none absolute left-3.5 top-3.5 text-halloween-gray">
            {Icon.search}
          </Svg>
        </div>

        {searchError && <Notice>{searchError}</Notice>}
        {players && (
          <span className="text-[13px] text-halloween-gray" role="status">
            {players.length ? `พบ ${players.length} คน` : 'ไม่พบชื่อนี้ในรายชื่อที่จองไว้'}
          </span>
        )}
        <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-1">
          {players?.map((p) => (
            <PlayerResult
              key={p.id}
              p={p}
              round={byId.get(p.round_id)}
              now={now}
              busy={busyId === p.id}
              result={result?.id === p.id ? result : null}
              onCheckIn={() => checkIn(p)}
              onWalkin={() => ctx.go('walkin')}
            />
          ))}
        </div>
      </div>

      {scanning && (
        <BookingScanner
          rounds={rounds}
          now={now}
          audio={audio.current}
          onCheckedIn={() => void ctx.refresh()}
          onClose={() => setScanning(false)}
          onWalkin={() => {
            setScanning(false);
            ctx.go('walkin');
          }}
        />
      )}
    </div>
  );
}

function OpenRoundCard({
  open,
  next,
  now,
  onList,
}: {
  open: StaffRound | null;
  next: StaffRound | null;
  now: number;
  onList: (roundId: string) => void;
}) {
  if (!open) {
    return (
      <div className={`${card} flex flex-col gap-1.5`}>
        <span className="text-sm font-bold text-halloween-gray">ตอนนี้ยังไม่มีรอบไหนเปิดเช็กอิน</span>
        {next ? (
          <>
            <span className="text-[22px] font-bold">รอบถัดไป: {roundName(next)}</span>
            <div className={meta}>
              <div>
                เปิดเช็กอิน <b className="text-halloween-cream">{formatTime(next.checkin_opens_at)}</b> (อีก{' '}
                {minutesText(Date.parse(next.checkin_opens_at) - now)})
              </div>
              <div>
                เล่น <b className="text-halloween-cream">{formatTimeRange(next.starts_at, next.ends_at)}</b>
              </div>
            </div>
          </>
        ) : (
          <span className="text-lg font-bold">เช็กอินครบทุกรอบแล้ว</span>
        )}
      </div>
    );
  }

  const waiting = notArrived(open);
  const pct = open.online_taken ? Math.round((open.checked_in / open.online_taken) * 100) : 0;
  return (
    <div className={`${card} flex flex-col gap-2 border-halloween-moon`}>
      <span className="text-sm font-bold text-halloween-moon">ตอนนี้เปิดเช็กอิน</span>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[26px] font-bold">{roundName(open)}</span>
        <span className="text-lg font-bold text-halloween-moon">ปิดใน {minutesText(Date.parse(open.checkin_closes_at) - now)}</span>
      </div>
      <div className={meta}>
        <div>
          เล่น <b className="text-halloween-cream">{formatTimeRange(open.starts_at, open.ends_at)}</b>
        </div>
        <div>
          เช็กอินที่บูธ <b className="text-halloween-cream">{formatTimeRange(open.checkin_opens_at, open.checkin_closes_at)}</b>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-halloween-purple/80" aria-hidden="true">
        <div className="h-full bg-halloween-moon transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between gap-2 text-[15px]">
        <span>
          มาแล้ว <b>{open.checked_in}</b> จาก {open.online_taken} คน
          {waiting > 0 && (
            <>
              <br />
              <span className="font-bold text-halloween-orange">ยังไม่มา {waiting} คน</span>
            </>
          )}
        </span>
        <button type="button" onClick={() => onList(open.id)} className="min-h-11 font-bold text-halloween-orange hover:text-halloween-moon">
          ดูรายชื่อ →
        </button>
      </div>
    </div>
  );
}

function PlayerResult({
  p,
  round,
  now,
  busy,
  result,
  onCheckIn,
  onWalkin,
}: {
  p: StaffPlayer;
  round: StaffRound | undefined;
  now: number;
  busy: boolean;
  result: Result | null;
  onCheckIn: () => void;
  onWalkin: () => void;
}) {
  const opens = Date.parse(p.checkin_opens_at);
  const closes = Date.parse(p.checkin_closes_at);
  const booked = p.live_status === 'booked';
  const canCheckIn = booked && now >= opens && now <= closes;

  return (
    <div className={`${card} flex flex-col gap-2.5 ${canCheckIn ? 'border-halloween-orange' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <b className="text-[17px]">{p.full_name}</b>
            {p.is_leader && <LeaderChip />}
            {p.live_status === 'checked_in' && <Chip className="bg-halloween-moon text-halloween-dark">Checked in</Chip>}
          </div>
          <div className={meta}>
            <div>
              <b className="text-halloween-cream">รอบที่ {p.round_no}</b>
              {round && ` (เล่น ${formatTime(round.starts_at)})`}
            </div>
            <div>รหัส {maskId(p.student_id)}</div>
            {p.live_status === 'checked_in' && p.checked_in_at && <div>เช็กอินแล้วตอน {formatTime(p.checked_in_at)}</div>}
            {p.live_status === 'released' && <div className="text-halloween-error">เลยเวลาเช็กอิน ที่นั่งถูกปล่อยแล้ว</div>}
          </div>
        </div>
        {booked && (
          <button type="button" onClick={onCheckIn} disabled={!canCheckIn || busy} className={`${btn('primary', !canCheckIn)} shrink-0`}>
            {busy ? 'กำลังเช็กอิน…' : canCheckIn ? 'เช็กอิน' : now < opens ? (
              <span className="text-sm">
                ยังไม่ถึงเวลา
                <br />
                เช็กอินได้ {formatTime(p.checkin_opens_at)}
              </span>
            ) : (
              <span className="text-sm">เลยเวลาแล้ว</span>
            )}
          </button>
        )}
        {p.live_status === 'released' && (
          <button type="button" onClick={onWalkin} className={`${btn('ghost')} shrink-0 text-sm`}>
            ไป Walk-in
          </button>
        )}
      </div>
      {result && (
        <Notice tone={result.ok ? 'ok' : 'error'}>
          {result.title}
          {result.action && <span className="block font-normal text-halloween-cream">{result.action}</span>}
        </Notice>
      )}
    </div>
  );
}
