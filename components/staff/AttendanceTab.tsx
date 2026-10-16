'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookingApiError, staff } from '@/lib/bookingClient';
import { formatTime, formatTimeRange } from '@/lib/bookingTime';
import type { AttendanceResponse, StaffPlayer, Walkin } from '@/lib/bookingTypes';
import type { StaffWords } from '@/lib/staffWords';
import { focusRound, minutesText, roundName, roundPhase, staffCheckinError } from '@/lib/staffRounds';
import type { StaffCtx } from './StaffApp';
import { LeaderChip, Notice, PhoneLink, RoundPicker, btn, card, meta } from './ui';
import { staffFail } from './useStaffRounds';

type View = 'waiting' | 'in' | 'released';

const ATTENDANCE_POLL_MS = 10_000;

type Team = { bookingId: string; leader: string; players: StaffPlayer[]; note: string | null };

function teamsOf(data: AttendanceResponse): Team[] {
  const map = new Map<string, Team>();
  for (const p of data.players) {
    let t = map.get(p.booking_id);
    if (!t) {
      t = { bookingId: p.booking_id, leader: '', players: [], note: data.notes[p.booking_id] ?? null };
      map.set(p.booking_id, t);
    }
    t.players.push(p);
    if (p.is_leader) t.leader = p.full_name;
  }
  for (const t of map.values()) t.leader ||= t.players[0].full_name;
  return [...map.values()];
}

export default function AttendanceTab({ ctx }: { ctx: StaffCtx }) {
  const { rounds, now, words: w } = ctx;
  const [roundId, setRoundId] = useState(() => ctx.roundHint ?? focusRound(rounds, now)?.id ?? null);
  const [view, setView] = useState<View>('waiting');
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowMsg, setRowMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);

  // A slow answer for a round staff already left must not replace the new one
  const current = useRef(roundId);
  const load = useCallback(async (id: string) => {
    try {
      const res = await staff.attendance(id);
      if (current.current !== id) return;
      setData(res);
      setError('');
    } catch (e) {
      if (current.current === id) setError(staffFail(e));
    }
  }, []);

  useEffect(() => {
    current.current = roundId;
    if (!roundId) return;
    let alive = true;
    const run = () => {
      if (!document.hidden && alive) void load(roundId);
    };
    run();
    const timer = setInterval(run, ATTENDANCE_POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [roundId, load]);

  const pick = (id: string) => {
    setRoundId(id);
    setData(null);
    setRowMsg(null);
  };

  const checkIn = async (p: StaffPlayer) => {
    setBusyId(p.id);
    setRowMsg(null);
    try {
      await staff.checkInById(p.id);
      setRowMsg({ id: p.id, ok: true, text: `${w.checkin} ${p.full_name} แล้ว` });
    } catch (e) {
      const text = e instanceof BookingApiError ? staffCheckinError(e.code, w) : { title: staffFail(e), action: '' };
      setRowMsg({ id: p.id, ok: false, text: `${text.title} ${text.action}`.trim() });
    } finally {
      setBusyId(null);
      if (roundId) void load(roundId);
      void ctx.refresh();
    }
  };

  const round = rounds.find((r) => r.id === roundId) ?? null;
  const shown = data && data.round.id === roundId ? data : null;
  const teams = shown ? teamsOf(shown) : [];
  const all = shown?.players ?? [];
  const walkins = shown?.walkins ?? [];
  const walkinsIn = walkins.filter((x) => x.status === 'checked_in');
  const walkinQueue = walkins.filter((x) => x.status === 'queued').sort((a, b) => a.queue_no - b.queue_no);
  // Everyone in the room: booked players who checked in and walk-ins let in, in the order they arrived
  const arrived: ({ kind: 'booked'; p: StaffPlayer } | { kind: 'walkin'; p: Walkin })[] = [
    ...all.filter((p) => p.live_status === 'checked_in').map((p) => ({ kind: 'booked' as const, p })),
    ...walkinsIn.map((p) => ({ kind: 'walkin' as const, p })),
  ].sort((a, b) => (a.p.checked_in_at ?? '').localeCompare(b.p.checked_in_at ?? ''));
  const count = {
    waiting: all.filter((p) => p.live_status === 'booked').length,
    in: arrived.length,
    released: all.filter((p) => p.live_status === 'released').length,
  };
  const phase = round ? roundPhase(round, now) : null;
  const canCheckIn = phase === 'checkin';
  const walkinIn = walkinsIn.length;
  const walkinQueued = walkinQueue.length;

  return (
    <div className="flex flex-col gap-3.5">
      <h1 className="text-2xl font-bold">รายชื่อรายรอบ</h1>

      <RoundPicker
        rounds={rounds}
        selected={roundId}
        onSelect={pick}
        sub={(r) => {
          const ph = roundPhase(r, now);
          if (ph === 'closed') return { text: 'ปิด', tone: 'error' };
          if (ph === 'checkin') return { text: w.solo ? 'ลงทะเบียน' : 'เช็กอินอยู่', tone: 'moon' };
          if (ph === 'playing') return { text: 'กำลังเล่น' };
          if (ph === 'ended') return { text: 'จบแล้ว' };
          return { text: formatTime(r.starts_at) };
        }}
      />

      {round && (
        <div className={`${card} flex flex-col gap-1`}>
          <div className="flex items-baseline justify-between gap-2">
            <b className="text-[22px]">{roundName(round)}</b>
            {canCheckIn && (
              <b className="text-[15px] text-halloween-moon">ปิดใน {minutesText(Date.parse(round.checkin_closes_at) - now)}</b>
            )}
          </div>
          <div className={meta}>
            <div>
              {w.play} <b className="text-halloween-cream">{formatTimeRange(round.starts_at, round.ends_at)}</b>
            </div>
            <div>
              {w.desk} <b className="text-halloween-cream">{formatTimeRange(round.checkin_opens_at, round.checkin_closes_at)}</b>
            </div>
            <div>
              จองไว้ <b className="text-halloween-cream">{round.online_taken} คน</b>, walk-in เข้าแล้ว{' '}
              <b className="text-halloween-cream">{walkinIn} คน</b>, คิวรอ <b className="text-halloween-cream">{walkinQueued} คน</b>
            </div>
          </div>
        </div>
      )}

      <div role="tablist" className="flex gap-1 rounded-xl border-2 border-halloween-purple bg-halloween-charcoal p-1 md:max-w-xl">
        {(
          [
            ['waiting', w.solo ? `ยังไม่มา ${count.waiting}` : `รอเช็กอิน ${count.waiting}`],
            ['in', w.solo ? `มาแล้ว ${count.in}` : `เช็กอินแล้ว ${count.in}`],
            ['released', `${w.released} ${count.released}`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`min-h-11 flex-1 rounded-lg text-sm font-bold ${
              view === id ? 'bg-halloween-orange text-halloween-dark' : 'text-halloween-gray hover:text-halloween-cream'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <Notice>{error}</Notice>}
      {!shown && !error && <p className="py-8 text-center text-halloween-gray">กำลังโหลดรายชื่อ…</p>}

      {shown && view === 'waiting' && (
        <>
          {count.waiting === 0 ? (
            <Empty
              title={w.solo ? 'มาครบทุกคนแล้ว' : 'ไม่มีคนรอเช็กอิน'}
              text={all.length ? `ทุกคนในรอบนี้${w.checkedIn} หรือ${w.released}ไปแล้ว` : 'รอบนี้ยังไม่มีคนจอง'}
            />
          ) : w.solo ? (
            <div className={`${card} grid gap-x-6 py-0 md:grid-cols-2`}>
              {all
                .filter((p) => p.live_status === 'booked')
                .map((p) => (
                  <div key={p.id} className="border-b border-halloween-purple/80 py-3 last:border-b-0">
                    <div className="flex items-center gap-2.5">
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <b className="text-base">{p.full_name}</b>
                        {p.nickname && <span className="text-sm font-bold text-halloween-moon">ชื่อเล่น {p.nickname}</span>}
                        {(p.faculty || p.year) && (
                          <span className="text-sm text-halloween-gray">{[p.faculty, p.year].filter(Boolean).join(' ')}</span>
                        )}
                        <PhoneLink phone={p.phone} />
                      </div>
                      <CheckInButton w={w} can={canCheckIn} busy={busyId === p.id} onClick={() => checkIn(p)} />
                    </div>
                    {rowMsg?.id === p.id && (
                      <p className={`mt-1.5 text-sm font-bold ${rowMsg.ok ? 'text-halloween-moon' : 'text-halloween-error'}`}>{rowMsg.text}</p>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 md:items-start">
              {teams
                .filter((t) => t.players.some((p) => p.live_status === 'booked'))
                .map((t) => {
                  const arrived = t.players.filter((p) => p.live_status === 'checked_in').length;
                  return (
                    <div key={t.bookingId} className={card}>
                      <div className="flex items-baseline justify-between gap-2">
                        <b className="text-[15px]">ทีมของ {t.leader}</b>
                        <span className="whitespace-nowrap text-[13px] text-halloween-gray">
                          {t.players.length} คน{arrived ? `, มาแล้ว ${arrived}` : ''}
                        </span>
                      </div>
                      {t.note && (
                        <p className="mb-0.5 mt-2 rounded-lg bg-halloween-orange/15 px-2.5 py-2 text-[13px] leading-relaxed">
                          หมายเหตุทีม: {t.note}
                        </p>
                      )}
                      {t.players
                        .filter((p) => p.live_status === 'booked')
                        .map((p) => (
                          <div key={p.id} className="border-t border-halloween-purple/80 py-2.5 first-of-type:mt-1">
                            <div className="flex items-center gap-2.5">
                              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <b className="text-base">{p.full_name}</b>
                                  {p.is_leader && <LeaderChip />}
                                </div>
                                <PhoneLink phone={p.phone} />
                              </div>
                              <CheckInButton w={w} can={canCheckIn} busy={busyId === p.id} onClick={() => checkIn(p)} />
                            </div>
                            {rowMsg?.id === p.id && (
                              <p className={`mt-1.5 text-sm font-bold ${rowMsg.ok ? 'text-halloween-moon' : 'text-halloween-error'}`}>{rowMsg.text}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  );
                })}
            </div>
          )}
          {round && (
            <p className="text-[13px] leading-relaxed text-halloween-gray">
              กด{w.checkin}ตรงนี้ได้เหมือนสแกน QR (กดได้เฉพาะตอนเปิด{w.checkin})
              <br />
              หลัง {formatTime(round.checkin_closes_at)} คนที่ยังไม่มาจะย้ายไปแท็บ “{w.released}” เอง และที่นั่งจะกลายเป็นที่ว่างสำหรับ walk-in
            </p>
          )}
          {walkinQueue.length > 0 && (
            <div className={`${card} py-0.5 md:max-w-xl`}>
              <b className="block pt-3 text-[15px]">คิว walk-in {walkinQueue.length} คน</b>
              {walkinQueue.map((x, i) => (
                <div key={x.id} className="flex items-center gap-2.5 border-b border-halloween-purple/80 py-2.5 last:border-b-0">
                  <span className="w-8 shrink-0 text-center font-bold text-halloween-moon">#{i + 1}</span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <b className="text-base">{x.full_name}</b>
                    {x.nickname && <span className="text-sm font-bold text-halloween-moon">ชื่อเล่น {x.nickname}</span>}
                    <PhoneLink phone={x.phone} />
                  </div>
                </div>
              ))}
              <p className="pb-3 text-[13px] text-halloween-gray">เรียกคิวได้ที่แท็บ Walk-in</p>
            </div>
          )}
        </>
      )}

      {shown && view === 'in' && (
        count.in === 0 ? (
          <Empty title={w.solo ? 'ยังไม่มีใครมา' : 'ยังไม่มีใครเช็กอิน'} text="" />
        ) : (
          <div className={`${card} grid gap-x-6 py-0.5 md:grid-cols-2`}>
            {arrived.map(({ kind, p }) => (
                <div key={p.id} className="flex items-center gap-2.5 border-b border-halloween-purple/80 py-2.5">
                  <div className="flex flex-1 flex-col">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <b className="text-base">{p.full_name}</b>
                      {kind === 'walkin' && (
                        <span className="rounded-md bg-halloween-moon/15 px-2 py-0.5 text-xs font-bold text-halloween-moon">walk-in</span>
                      )}
                    </div>
                    {w.solo || kind === 'walkin' ? (
                      p.nickname && <span className="text-sm font-bold text-halloween-moon">ชื่อเล่น {p.nickname}</span>
                    ) : (
                      <span className="text-sm text-halloween-gray">ทีมของ {teams.find((t) => t.bookingId === p.booking_id)?.leader}</span>
                    )}
                  </div>
                  {p.checked_in_at && (
                    <span className="whitespace-nowrap text-sm font-bold text-halloween-moon">มาตอน {formatTime(p.checked_in_at)}</span>
                  )}
                </div>
              ))}
          </div>
        )
      )}

      {shown && view === 'released' && (
        count.released === 0 ? (
          <Empty
            title={`ยังไม่มีคน${w.released}`}
            text={
              round && now <= Date.parse(round.checkin_closes_at)
                ? `จะรู้หลังปิด${w.checkin}ตอน ${formatTime(round.checkin_closes_at)}\nที่นั่งที่${w.released}จะกลายเป็นที่ว่างสำหรับ walk-in`
                : `ทุกคนที่จองไว้มา${w.checkin}ครบ`
            }
          />
        ) : (
          <div className={`${card} grid gap-x-6 py-0.5 md:grid-cols-2`}>
            {all
              .filter((p) => p.live_status === 'released')
              .map((p) => (
                <div key={p.id} className="flex flex-col border-b border-halloween-purple/80 py-2.5">
                  <b className="text-base">{p.full_name}</b>
                  {w.solo ? (
                    p.nickname && <span className="text-sm font-bold text-halloween-moon">ชื่อเล่น {p.nickname}</span>
                  ) : (
                    <span className="text-sm text-halloween-gray">ทีมของ {teams.find((t) => t.bookingId === p.booking_id)?.leader}</span>
                  )}
                  <PhoneLink phone={p.phone} />
                </div>
              ))}
          </div>
        )
      )}
    </div>
  );
}

function CheckInButton({ w, can, busy, onClick }: { w: StaffWords; can: boolean; busy: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={!can || busy} className={`${btn('primary', !can)} min-h-11 shrink-0 text-[15px]`}>
      {busy ? `กำลัง${w.checkin}…` : can ? w.checkin : 'ยังไม่เปิด'}
    </button>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className={`${card} flex flex-col gap-1.5 px-4 py-7 text-center`}>
      <b className="text-[17px]">{title}</b>
      {text && <span className="whitespace-pre-line text-sm text-halloween-gray">{text}</span>}
    </div>
  );
}
