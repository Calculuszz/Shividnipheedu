'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BookingPage, Button, Card, ErrorNotice } from '@/components/booking';
import { useBookingState, useRounds } from '@/hooks/useBooking';
import { book, BookingApiError, studentStatus } from '@/lib/bookingClient';
import { bookingPaths, isStudentId, roundPick } from '@/lib/bookingRules';
import { rememberCode, saveLastBooking } from '@/lib/bookingStorage';
import { errorMessage } from '@/lib/bookingText';
import { formatDateEn, formatTimeRange } from '@/lib/bookingTime';
import type { PlayerInput } from '@/lib/bookingTypes';
import Doodle from '@/components/Doodle';
import PlayerFields from './PlayerFields';
import { newPlayer, playerComplete, playerErrors, studentCanSubmit, toPlayerInput, type PlayerDraft } from './bookingFormModel';

const ACTIVITY = 'escape_room';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FIELD_LABELS: Partial<Record<keyof PlayerInput, string>> = {
  full_name: 'ชื่อ', student_id: 'รหัสนิสิต', phone: 'เบอร์โทร', email: 'อีเมล', pdpa: 'PDPA', rules: 'การรับทราบกฎ',
};

export default function BookingForm({ initialRoundId, leaderId }: { initialRoundId: string; leaderId: string }) {
  const router = useRouter();
  const paths = bookingPaths(ACTIVITY);
  // Keep the chosen round independent of player drafts so the upcoming sheet can change it without resetting the form.
  const [roundId] = useState(initialRoundId);
  const [players, setPlayers] = useState<PlayerDraft[]>(() => [newPlayer('leader', leaderId)]);
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [addError, setAddError] = useState('');
  const [seatsBlocked, setSeatsBlocked] = useState(false);
  const [seatLimit, setSeatLimit] = useState<number | null>(null);
  const [addedPlayerKey, setAddedPlayerKey] = useState<string | null>(null);
  const sequence = useRef(0);
  const actionLock = useRef(false);
  const requests = useRef(new Map<string, number>());
  const state = useBookingState(ACTIVITY);
  const rounds = useRounds(ACTIVITY);
  const activity = state.data?.activity;
  const round = rounds.data?.rounds.find(r => r.id === roundId);
  const validUrl = UUID.test(roundId) && isStudentId(leaderId);
  const busy = adding || submitting || submitted;
  const errors = players.map(p => playerErrors(p, players));
  const checking = players.some(p => p.check.status === 'checking');
  const pending = players.some(p => !studentCanSubmit(p));
  const teamValid = !!activity && players.length >= activity.team_min && players.length <= activity.team_max;
  const roundValid = !!round && roundPick(round, players.length).selectable && (seatLimit === null || players.length <= seatLimit);
  const ready = validUrl && teamValid && roundValid && state.data?.state === 'open' && !state.loading && !rounds.loading &&
    !state.error && !rounds.error && !pending && errors.every(e => Object.keys(e).length === 0) && !busy;

  const updatePlayer = (key: string, change: (p: PlayerDraft) => PlayerDraft) => {
    setPlayers(current => current.map(p => p.key === key ? change(p) : p));
  };

  const verifyStudent = useCallback(async (key: string, sid: string) => {
    if (!isStudentId(sid)) return;
    const token = (requests.current.get(key) ?? 0) + 1;
    requests.current.set(key, token);
    setPlayers(current => current.map(p => p.key === key && p.student_id === sid
      ? { ...p, check: { sid, status: 'checking', error: p.check.sid === sid ? p.check.error : undefined }, touched: { ...p.touched, student_id: true } } : p));
    try {
      const { taken, registered } = await studentStatus(ACTIVITY, sid);
      if (requests.current.get(key) !== token) return;
      const blocked = !registered ? errorMessage('NOT_REGISTERED', sid) : taken ? errorMessage('ALREADY_BOOKED') : null;
      setPlayers(current => current.map(p => p.key === key && p.student_id === sid
        ? { ...p, check: blocked ? { sid, status: 'blocked', error: blocked } : { sid, status: 'available' } } : p));
    } catch (e) {
      if (requests.current.get(key) !== token) return;
      const message = e instanceof BookingApiError ? e.message : errorMessage('SERVER_ERROR');
      setPlayers(current => current.map(p => p.key === key && p.student_id === sid
        ? { ...p, check: e instanceof BookingApiError && e.code === 'ALREADY_BOOKED'
          ? { sid, status: 'blocked', error: message }
          : { sid, status: 'warning', error: p.check.error, warning: message } } : p));
    }
  }, []);

  useEffect(() => {
    if (validUrl) void verifyStudent('leader', leaderId);
    const currentRequests = requests.current;
    return () => { currentRequests.clear(); };
  }, [leaderId, validUrl, verifyStudent]);

  useEffect(() => {
    if (!addedPlayerKey) return;
    document.getElementById(`player-${addedPlayerKey}`)?.scrollIntoView({
      block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }, [addedPlayerKey]);

  function changeField<K extends keyof PlayerInput>(key: string, field: K, value: PlayerInput[K]) {
    if (actionLock.current || submitted) return;
    if (field === 'student_id') {
      // Invalidating on every edit also protects A → B → A from a late response for the first A.
      requests.current.set(key, (requests.current.get(key) ?? 0) + 1);
    }
    updatePlayer(key, p => ({ ...p, [field]: value,
      touched: { ...p.touched, ...(field === 'pdpa' || field === 'rules' ? { [field]: true } : {}) },
      ...(field === 'student_id' ? { check: { sid: String(value), status: 'idle' as const } } : {}),
    }));
  }

  function blurField(player: PlayerDraft, field: keyof PlayerInput) {
    updatePlayer(player.key, p => ({ ...p, touched: { ...p.touched, [field]: true } }));
    const playerIndex = players.findIndex(p => p.key === player.key);
    if (field === 'student_id' && isStudentId(player.student_id) &&
      !players.some((p, index) => index < playerIndex && p.student_id === player.student_id)) {
      void verifyStudent(player.key, player.student_id);
    }
  }

  function removePlayer(key: string) {
    if (actionLock.current || submitted || key === 'leader' || !activity || players.length <= activity.team_min) return;
    requests.current.set(key, (requests.current.get(key) ?? 0) + 1);
    setPlayers(current => current.filter(p => p.key !== key));
    setAddError('');
    setSeatsBlocked(false);
  }

  async function addPlayer() {
    if (actionLock.current || submitted || !activity || !validUrl || players.length >= activity.team_max || state.data?.state !== 'open') return;
    actionLock.current = true;
    setAdding(true);
    setAddError('');
    setSeatsBlocked(false);
    try {
      const latest = await rounds.refresh();
      if (!latest) return;
      const selected = latest.rounds.find(r => r.id === roundId);
      setSeatLimit(null);
      if (!selected) { setAddError(errorMessage('ROUND_NOT_FOUND')); return; }
      if (!roundPick(selected, players.length + 1).selectable) {
        setAddError(selected.round_status === 'available' || selected.round_status === 'full'
          ? `รอบนี้เหลือ ${selected.online_left} ที่นั่ง เพิ่มผู้เล่นคนที่ ${players.length + 1} ไม่ได้ — เลือกรอบอื่นได้`
          : errorMessage('ROUND_CLOSED'));
        setSeatsBlocked(true);
        return;
      }
      const added = newPlayer(`member-${++sequence.current}`);
      setPlayers(current => [...current.map(p => ({ ...p, expanded: !playerComplete(p, current) })), added]);
      setAddedPlayerKey(added.key);
    } finally {
      actionLock.current = false;
      setAdding(false);
    }
  }

  // Integration points for issue #5: replace these alerts with sheets, preserving players and notes.
  function changeRound() {
    window.alert('เปลี่ยนรอบ: ทีมจะเชื่อมหน้าต่างเลือกรอบให้ภายหลัง ข้อมูลผู้เล่นที่กรอกไว้ยังอยู่ครบ');
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || actionLock.current) return;
    actionLock.current = true;
    setSubmitting(true);
    setFormError('');
    try {
      const latest = await rounds.refresh();
      if (!latest) return;
      const selected = latest.rounds.find(r => r.id === roundId);
      if (!selected) { setFormError(errorMessage('ROUND_NOT_FOUND')); return; }
      if (selected.online_left < players.length) {
        setSeatLimit(selected.online_left);
        window.alert(`${errorMessage('NOT_ENOUGH_SEATS', String(selected.online_left))} แต่ทีมของคุณมี ${players.length} คน กรุณาลดจำนวนผู้เล่นหรือเปลี่ยนรอบ ข้อมูลที่กรอกไว้ยังอยู่ครบ`);
        return;
      }
      if (!roundPick(selected, players.length).selectable) { setFormError(errorMessage('ROUND_CLOSED')); return; }
      const result = await book({ round_id: roundId, players: players.map(toPlayerInput), notes });
      saveLastBooking(ACTIVITY, result);
      rememberCode(ACTIVITY, result.code);
      setSubmitted(true);
      router.push(paths.confirmed);
    } catch (e) {
      const error = e instanceof BookingApiError ? e : new BookingApiError(0, 'SERVER_ERROR');
      if (error.code === 'NOT_ENOUGH_SEATS') {
        const left = Number(error.detail);
        if (error.detail !== undefined && Number.isFinite(left) && left >= 0) setSeatLimit(left);
        window.alert(`${error.message} กรุณาลดจำนวนผู้เล่นหรือเปลี่ยนรอบ ข้อมูลที่กรอกไว้ยังอยู่ครบ`);
      } else {
        setFormError(errorMessage(error.code, error.detail, { teamMin: activity?.team_min, teamMax: activity?.team_max }));
        if (error.code === 'ALREADY_BOOKED' || error.code === 'DUPLICATE_IN_TEAM') {
          setPlayers(current => current.map(p => p.student_id === error.detail
            ? { ...p, expanded: true, touched: { ...p.touched, student_id: true },
              check: { sid: p.student_id, status: 'blocked', error: error.message } } : p));
        }
      }
    } finally {
      actionLock.current = false;
      setSubmitting(false);
    }
  }

  const issues = errors.flatMap((fields, index) => Object.entries(fields).map(([field, message]) => ({
    key: `${players[index].key}-${field}`, playerKey: players[index].key, field,
    text: `${FIELD_LABELS[field as keyof PlayerInput]} ของผู้เล่นคนที่ ${index + 1}: ${message}`,
  })));

  return (
    <BookingPage activity={ACTIVITY} backHref={`${paths.rounds}?leader=${encodeURIComponent(leaderId)}`} title="Who's playing?" step="Step 2 of 2">
      <Doodle name="bat-small" className="pointer-events-none absolute right-8 top-24 w-9" />
      <form aria-label="Booking form" noValidate onSubmit={confirm} className="flex flex-col gap-3.5">
        {!validUrl && <ErrorNotice title="ข้อมูลลิงก์ไม่ครบหรือไม่ถูกต้อง">กรุณาเริ่มจากขั้นตอนเลือกรอบและระบุรหัสนิสิตหัวหน้าทีม 10 หลัก</ErrorNotice>}
        {(state.loading || (rounds.loading && !rounds.data)) && <p role="status" className="text-halloween-gray">กำลังโหลดข้อมูลรอบและกติกาการจอง…</p>}
        {(state.error || rounds.error) && <ErrorNotice title="โหลดข้อมูลไม่สำเร็จ">
          {state.error?.message || rounds.error?.message}
          <Button variant="secondary" disabled={busy || state.loading || rounds.loading} onClick={() => { void state.refresh(); void rounds.refresh(); }}>ลองโหลดข้อมูลใหม่</Button>
        </ErrorNotice>}
        {validUrl && rounds.data && !round && <ErrorNotice>{errorMessage('ROUND_NOT_FOUND')}</ErrorNotice>}
        {state.data && state.data.state !== 'open' && <ErrorNotice>{errorMessage(state.data.state === 'not_open' ? 'BOOKING_NOT_OPEN' : 'BOOKING_CLOSED')}</ErrorNotice>}
        {round && <Card className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-halloween-gray">Round {round.round_no} · {formatDateEn(round.starts_at)}</p>
            <p className="text-xl font-bold">{formatTimeRange(round.starts_at, round.ends_at)}</p>
            <p className="text-sm text-halloween-gray">Check-in {formatTimeRange(round.checkin_opens_at, round.checkin_closes_at)} at the booth</p>
          </div>
          <button type="button" onClick={changeRound} disabled={busy} className="min-h-11 px-2 font-bold text-halloween-orange disabled:opacity-40">Change</button>
        </Card>}
        {activity && <Card>
          <p id="player-count-label" className="mb-2 text-[15px] font-bold">Number of players <span className="text-halloween-error">*</span></p>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" aria-label="Fewer players" disabled={busy || players.length <= activity.team_min}
              onClick={() => removePlayer(players[players.length - 1].key)} className="h-12 w-12 rounded-[14px] border-2 border-halloween-purple bg-halloween-purple/30 text-2xl disabled:opacity-40">−</button>
            <output aria-labelledby="player-count-label" aria-live="polite" className="display-font min-w-8 text-center text-3xl">{players.length}</output>
            <button type="button" aria-label="More players" aria-busy={adding} disabled={busy || state.loading || rounds.loading || !validUrl || !round || state.data?.state !== 'open' || players.length >= activity.team_max}
              onClick={addPlayer} className="h-12 w-12 rounded-[14px] border-2 border-halloween-orange bg-halloween-orange text-2xl text-halloween-dark disabled:border-halloween-purple disabled:bg-halloween-purple/30 disabled:text-halloween-gray">+</button>
            <span className="text-sm text-halloween-gray">ทีมละ {activity.team_min}–{activity.team_max} คน</span>
          </div>
          {adding && <p role="status" className="mt-3 text-halloween-moon">Checking seats… ตรวจที่นั่งล่าสุดของรอบนี้</p>}
          {players.length >= activity.team_max && <p className="mt-3 text-halloween-moon">ทีมละไม่เกิน {activity.team_max} คน</p>}
          {addError && <ErrorNotice className="mt-3">{addError}{seatsBlocked && <Button variant="link" onClick={changeRound}>Pick another round</Button>}</ErrorNotice>}
          <p className="mt-2 text-sm text-halloween-gray">กด + ทุกครั้ง ระบบจะตรวจที่นั่งล่าสุดของรอบนี้</p>
        </Card>}
        {players.map((player, index) => <PlayerFields key={player.key} player={player} number={index + 1} errors={errors[index]}
          disabled={busy} canRemove={!!activity && players.length > activity.team_min}
          onChange={(field, value) => changeField(player.key, field, value)} onBlur={field => blurField(player, field)}
          onToggle={() => updatePlayer(player.key, p => ({ ...p, expanded: !p.expanded }))}
          onRemove={() => removePlayer(player.key)} onRetry={() => { void verifyStudent(player.key, player.student_id); }} />)}
        <Card>
          <label htmlFor="booking-notes" className="mb-1.5 block text-[15px] font-bold">Notes (optional)</label>
          <textarea id="booking-notes" rows={3} maxLength={500} value={notes} disabled={busy} onChange={e => setNotes(e.target.value)}
            placeholder="เช่น มีผู้เล่นที่ต้องการความช่วยเหลือพิเศษ" aria-describedby="notes-count"
            className="w-full resize-y rounded-[10px] border-2 border-halloween-purple bg-halloween-dark px-3.5 py-3 text-[17px] outline-none focus:border-halloween-orange" />
          <p id="notes-count" className="text-right text-sm text-halloween-gray">{notes.length}/500</p>
        </Card>
        <div className="-mx-4 mt-2 flex flex-col gap-3 rounded-t-[26px] border-t-2 border-halloween-orange bg-halloween-charcoal px-4 pb-2 pt-4 shadow-[0_-10px_30px_rgba(0,0,0,0.35)]">
          {issues.length > 0 && <ErrorNotice title={`ยังยืนยันไม่ได้ — แก้ไขอีก ${issues.length} รายการ`}>
            <ul className="list-inside list-disc">{issues.map(issue => <li key={issue.key}>
              <button type="button" className="text-left underline decoration-dotted" onClick={() => updatePlayer(issue.playerKey, p => ({ ...p, expanded: true, touched: { ...p.touched, [issue.field]: true } }))}>{issue.text}</button>
            </li>)}</ul>
          </ErrorNotice>}
          {pending && <p role="status" className="text-sm text-halloween-gray">{checking ? 'กำลังตรวจสอบรหัสนิสิต…' : 'กรุณาตรวจสอบรหัสนิสิตของทุกคนให้เรียบร้อย (ออกจากช่องรหัสนิสิตเพื่อเริ่มตรวจสอบ)'}</p>}
          {activity && !teamValid && <ErrorNotice>{errorMessage('TEAM_SIZE', undefined, { teamMin: activity.team_min, teamMax: activity.team_max })}</ErrorNotice>}
          {round && !roundValid && <ErrorNotice title="รอบนี้ยังยืนยันไม่ได้">
            {seatLimit !== null ? errorMessage('NOT_ENOUGH_SEATS', String(seatLimit)) : round.online_left < players.length ? errorMessage('NOT_ENOUGH_SEATS', String(round.online_left)) : errorMessage('ROUND_CLOSED')}
            <Button variant="link" disabled={busy} onClick={changeRound}>Pick another round</Button>
          </ErrorNotice>}
          {formError && <ErrorNotice>{formError}</ErrorNotice>}
          <Button type="submit" disabled={!ready} loading={submitting} loadingText="Confirming booking…">{submitted ? 'จองสำเร็จ กำลังเปิดหน้ายืนยัน…' : 'Confirm booking'}</Button>
          <p className="text-center text-sm text-halloween-gray">ปุ่มจะกดได้เมื่อกรอกช่องที่มี * ครบทุกคน · ระบบตรวจที่นั่งอีกครั้งตอนกดยืนยัน</p>
        </div>
      </form>
    </BookingPage>
  );
}
