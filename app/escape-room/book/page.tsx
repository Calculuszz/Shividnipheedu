'use client';

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { BookingPage, Button, Card, ErrorNotice } from '@/components/booking';
import { useBookingState, useRounds } from '@/hooks/useBooking';
import { BookingApiError, book, checkStudent, getRounds } from '@/lib/bookingClient';
import { bookingPaths, isStudentId, roundPick } from '@/lib/bookingRules';
import { saveLastBooking } from '@/lib/bookingStorage';
import { errorMessage } from '@/lib/bookingText';
import { formatDateEn, formatTimeRange } from '@/lib/bookingTime';
import type { ActivityInfo, Round } from '@/lib/bookingTypes';
import { MoonCorner } from '../_shared';
import { FIELDS, duplicateOf, emptyPlayer, isComplete, playerIssues, summarize, toInput, type Field, type Player, type SidStatus } from './form';
import PlayerCard from './PlayerCard';
import TeamSize, { type SeatCheck } from './TeamSize';

const ACTIVITY = 'escape_room';
const paths = bookingPaths(ACTIVITY);

// TODO(#5): swap for ChangeRoundSheet / SeatConflict
const changeRoundSoon = () => alert('เปลี่ยนรอบในหน้านี้ได้เร็ว ๆ นี้');

function RoundCard({ round }: { round: Round }) {
  return (
    <Card className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm text-halloween-gray">
          Round {round.round_no} · {formatDateEn(round.starts_at)}
        </span>
        <span className="text-xl font-bold">{formatTimeRange(round.starts_at, round.ends_at)}</span>
        <span className="text-sm text-halloween-gray">Check-in {formatTimeRange(round.checkin_opens_at, round.checkin_closes_at)} at the booth</span>
      </div>
      <button type="button" onClick={changeRoundSoon} className="min-h-11 px-3 text-base font-bold text-halloween-orange">
        Change
      </button>
    </Card>
  );
}

function BookForm({ activity, round, leader }: { activity: ActivityInfo; round: Round; leader: string }) {
  const router = useRouter();
  const start = Math.max(1, activity.team_min);
  const nextKey = useRef(start);
  const [players, setPlayers] = useState<Player[]>(() => Array.from({ length: start }, (_, i) => emptyPlayer(i, i === 0 ? leader : '')));
  const [open, setOpen] = useState<Set<number>>(() => new Set(Array.from({ length: start }, (_, i) => i)));
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [sidStatus, setSidStatus] = useState<Record<string, SidStatus>>({});
  const [notes, setNotes] = useState('');
  const [seatCheck, setSeatCheck] = useState<SeatCheck>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // New object each time so the same field can be focused again
  const [focusTarget, setFocusTarget] = useState<{ id: string } | null>(null);

  useEffect(() => {
    if (focusTarget) document.getElementById(focusTarget.id)?.focus();
  }, [focusTarget]);

  const issues = players.map((_, i) => playerIssues(players, i, sidStatus));
  const summary = summarize(issues);
  const checking = players.some((p) => sidStatus[p.student_id] === 'checking');
  const roundTime = formatTimeRange(round.starts_at, round.ends_at);

  // Tick boxes show their error once the rest of the card was filled in
  const shown = (key: number) => (field: Field) =>
    touched.has(`${key}:${field}`) || ((field === 'pdpa' || field === 'rules') && touched.has(`${key}:email`));

  const touch = (key: number, fields: Field[]) =>
    setTouched((prev) => new Set([...prev, ...fields.map((f) => `${key}:${f}`)]));

  const update = (key: number, patch: Partial<Player>) => {
    setPlayers((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
    setSubmitError(null);
  };

  const toggle = (key: number) => {
    const next = new Set(open);
    if (next.delete(key)) touch(key, FIELDS);
    else next.add(key);
    setOpen(next);
  };

  const reveal = (key: number, field: Field) => {
    touch(key, [field]);
    setOpen((prev) => new Set([...prev, key]));
    setFocusTarget({ id: `p${key}-${field}` });
  };

  async function checkSid(index: number) {
    const sid = players[index].student_id;
    const known = sidStatus[sid];
    if (!isStudentId(sid) || duplicateOf(players, index) >= 0 || (known && known !== 'failed')) return;
    setSidStatus((s) => ({ ...s, [sid]: 'checking' }));
    try {
      const taken = await checkStudent(ACTIVITY, sid);
      setSidStatus((s) => ({ ...s, [sid]: taken ? 'taken' : 'free' }));
    } catch {
      // Not blocking: book checks again
      setSidStatus((s) => ({ ...s, [sid]: 'failed' }));
    }
  }

  const removePlayer = (key: number) => {
    setPlayers((prev) => prev.filter((p) => p.key !== key));
    setSeatCheck(null);
  };

  async function addPlayer() {
    const need = players.length + 1;
    setSeatCheck({ kind: 'checking', roundTime });
    try {
      const { rounds } = await getRounds(ACTIVITY);
      const latest = rounds.find((r) => r.id === round.id);
      const pick = latest ? roundPick(latest, need) : null;
      if (pick?.selectable) {
        const key = nextKey.current++;
        // Collapse finished cards so the new one is in view
        const done = new Set(players.filter((_, i) => isComplete(issues[i])).map((p) => p.key));
        setOpen((prev) => new Set([...[...prev].filter((k) => !done.has(k)), key]));
        setPlayers((prev) => [...prev, emptyPlayer(key)]);
        setSeatCheck(null);
      } else if (latest && (pick?.reason === 'full' || pick?.reason === 'not_enough')) {
        setSeatCheck({ kind: 'blocked', text: `รอบนี้เหลือ ${latest.online_left} ที่นั่ง เพิ่มผู้เล่นคนที่ ${need} ไม่ได้ — เลือกรอบอื่นได้` });
      } else {
        setSeatCheck({ kind: 'blocked', text: errorMessage('ROUND_CLOSED') });
      }
    } catch (e) {
      setSeatCheck({ kind: 'error', text: e instanceof BookingApiError ? e.message : errorMessage('SERVER_ERROR') });
    }
  }

  async function confirm() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await book({ round_id: round.id, players: players.map(toInput), notes: notes.trim() || undefined });
      saveLastBooking(result);
      router.push(paths.confirmed);
    } catch (e) {
      const err = e instanceof BookingApiError ? e : new BookingApiError(0, 'SERVER_ERROR');
      const at = err.detail ? players.findLastIndex((p) => p.student_id === err.detail) : -1;
      if ((err.code === 'ALREADY_BOOKED' || err.code === 'DUPLICATE_IN_TEAM') && at >= 0) {
        if (err.code === 'ALREADY_BOOKED') setSidStatus((s) => ({ ...s, [err.detail!]: 'taken' }));
        reveal(players[at].key, 'student_id');
      } else if (err.code === 'NOT_ENOUGH_SEATS') {
        alert(err.message);
      } else {
        setSubmitError(errorMessage(err.code, err.detail, { teamMin: activity.team_min, teamMax: activity.team_max }));
      }
      setSubmitting(false);
    }
  }

  return (
    <>
      <RoundCard round={round} />
      <TeamSize
        count={players.length}
        min={activity.team_min}
        max={activity.team_max}
        check={seatCheck}
        onAdd={addPlayer}
        onRemoveLast={() => removePlayer(players.at(-1)!.key)}
        onPickRound={changeRoundSoon}
      />
      {players.map((player, index) => (
        <PlayerCard
          key={player.key}
          player={player}
          index={index}
          open={open.has(player.key)}
          issues={issues[index]}
          shown={shown(player.key)}
          checking={sidStatus[player.student_id] === 'checking'}
          rulesHref={paths.rules}
          privacyHref={paths.privacy}
          onChange={(patch) => update(player.key, patch)}
          onBlur={(field) => {
            touch(player.key, [field]);
            if (field === 'student_id') checkSid(index);
          }}
          onToggle={() => toggle(player.key)}
          onRemove={index > 0 && players.length > activity.team_min ? () => removePlayer(player.key) : undefined}
        />
      ))}
      <Card className="flex flex-col gap-1.5 p-[18px]">
        <label htmlFor="notes" className="text-[15px] font-bold">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="เช่น มีผู้เล่นที่ต้องการความช่วยเหลือพิเศษ"
          className="w-full resize-none rounded-lg border-2 border-halloween-purple bg-halloween-dark px-3.5 py-3 text-[17px] text-halloween-cream outline-none focus:border-halloween-orange"
        />
      </Card>

      <div className="-mx-4 -mb-10 mt-[22px] flex flex-col gap-3 rounded-t-[26px] border-t-2 border-halloween-orange bg-halloween-charcoal px-4 pb-[30px] pt-[18px] shadow-[0_-10px_30px_rgba(0,0,0,0.35)]">
        {summary.count > 0 && (
          <ErrorNotice>
            <span>
              <b>ยังยืนยันไม่ได้</b> — แก้ไขอีก {summary.count} รายการ: {summary.text}
            </span>
          </ErrorNotice>
        )}
        {submitError && <ErrorNotice>{submitError}</ErrorNotice>}
        <Button onClick={confirm} disabled={summary.count > 0 || checking || seatCheck?.kind === 'checking'} loading={submitting} loadingText="กำลังจอง…">
          Confirm booking
        </Button>
        <span className="text-center text-sm text-halloween-gray">
          ปุ่มจะกดได้เมื่อกรอกช่องที่มี * ครบทุกคน · ระบบตรวจที่นั่งอีกครั้งตอนกดยืนยัน
        </span>
      </div>
    </>
  );
}

function BookPageContent() {
  const params = useSearchParams();
  const state = useBookingState(ACTIVITY);
  const rounds = useRounds(ACTIVITY);
  const roundId = params.get('round');
  const leader = params.get('leader') ?? '';
  const backHref = isStudentId(leader) ? `${paths.rounds}?leader=${leader}` : paths.start;
  const page = (children: ReactNode) => (
    <BookingPage activity={ACTIVITY} backHref={backHref} step="Step 2 of 2" title="Who's playing?">
      <MoonCorner />
      {children}
    </BookingPage>
  );

  if (!roundId || !isStudentId(leader)) {
    return page(
      <ErrorNotice title="ข้อมูลการจองไม่ครบ">
        เริ่มจองใหม่จากการกรอกรหัสนิสิต
        <span className="mt-2 block">
          <Button href={paths.start} variant="secondary">กลับไปกรอกรหัสนิสิต</Button>
        </span>
      </ErrorNotice>
    );
  }
  if (state.loading || rounds.loading) return page(<p role="status" className="py-6 text-center text-halloween-gray">Loading…</p>);

  const error = state.error ?? rounds.error;
  if (error || !state.data || !rounds.data) {
    return page(<ErrorNotice title={error?.code}>{error?.message ?? errorMessage('SERVER_ERROR')}</ErrorNotice>);
  }
  if (state.data.state === 'not_open') redirect(paths.home);
  if (state.data.state === 'closed') redirect(paths.rounds);

  const round = rounds.data.rounds.find((r) => r.id === roundId);
  if (!round) {
    return page(
      <ErrorNotice title={errorMessage('ROUND_NOT_FOUND')}>
        <span className="mt-2 block">
          <Button href={backHref} variant="secondary">เลือกรอบใหม่</Button>
        </span>
      </ErrorNotice>
    );
  }
  return page(<BookForm activity={state.data.activity} round={round} leader={leader} />);
}

// 3 / 3b / 3b′ / 3e: ?round=<id>&leader=<student id>
export default function BookPage() {
  return (
    <Suspense>
      <BookPageContent />
    </Suspense>
  );
}
