'use client';

import { useState } from 'react';
import {
  BookingPage,
  BookingQR,
  Button,
  Card,
  CheckField,
  ErrorNotice,
  InfoNotice,
  LeaderBadge,
  Markdown,
  PlayerStatusChip,
  RoundStamp,
  SeatCount,
  Sheet,
  StickyNote,
  TextField,
} from '@/components/booking';
import { useBookingState, useNow, useRounds } from '@/hooks/useBooking';
import { BookingApiError, findBooking } from '@/lib/bookingClient';
import { bookingPaths, roundPick } from '@/lib/bookingRules';
import { errorMessage } from '@/lib/bookingText';
import { formatCountdown, formatDateEn, formatDateTh, formatDayTimeTh, formatTimeRange } from '@/lib/bookingTime';
import type { PlayerStatus, RoundStatus } from '@/lib/bookingTypes';

const ACTIVITY = 'escape_room';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-bold uppercase tracking-widest text-halloween-moon">{title}</h2>
      {children}
    </div>
  );
}

export default function BookingKit() {
  const state = useBookingState(ACTIVITY);
  const rounds = useRounds(ACTIVITY);
  const now = useNow();
  const [sheet, setSheet] = useState(false);
  const [sid, setSid] = useState('');
  const [pdpa, setPdpa] = useState(false);
  const [lookup, setLookup] = useState('');

  const a = state.data?.activity;

  return (
    <BookingPage activity={ACTIVITY} backHref="/" title="Booking kit" step="Dev only · /dev/booking-kit">
      <Section title="useBookingState">
        <Card>
          {state.loading && <p>Loading…</p>}
          {state.error && <ErrorNotice title={state.error.code}>{state.error.message}</ErrorNotice>}
          {a && (
            <div className="flex flex-col gap-1 text-[15px]">
              <p>
                state: <b>{state.data!.state}</b> · team {a.team_min}–{a.team_max} · check-in {a.checkin_opens_before_min} min before, {a.checkin_duration_min} min long
              </p>
              {a.booking_opens_at && <p>opens {formatDayTimeTh(a.booking_opens_at)} · {formatCountdown(a.booking_opens_at, now)}</p>}
              {a.booking_closes_at && <p>closes {formatDayTimeTh(a.booking_closes_at)}</p>}
            </div>
          )}
        </Card>
      </Section>

      <Section title="Markdown (details_md · health_notice)">
        <Card tone="purple">
          <Markdown text={a?.details_md} />
          <hr className="my-3 border-halloween-purple" />
          <Markdown text={a?.health_notice} />
        </Card>
      </Section>

      <Section title="useRounds + SeatCount / RoundStamp + roundPick">
        <Button variant="secondary" onClick={() => rounds.refresh()} loading={rounds.loading} loadingText="Checking seats…">
          refresh()
        </Button>
        {rounds.data?.rounds.map((r) => {
          const pick = roundPick(r, 4);
          return (
            <Card key={r.id} tone={pick.selectable ? 'purple' : 'danger'} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xl font-bold">{formatTimeRange(r.starts_at, r.ends_at)}</p>
                <p className="text-sm text-halloween-gray">
                  Round {r.round_no} · Check-in {formatTimeRange(r.checkin_opens_at, r.checkin_closes_at)} · {formatDateEn(r.starts_at)}
                </p>
                <p className="text-xs text-halloween-gray">roundPick(team of 4): {JSON.stringify(pick)}</p>
              </div>
              {r.round_status === 'available' ? <SeatCount round={r} notEnoughFor={4} /> : <RoundStamp status={r.round_status} />}
            </Card>
          );
        })}
      </Section>

      <Section title="RoundStamp (every status)">
        <Card tone="purple" className="flex flex-wrap gap-4 justify-around">
          {(['walkin_available', 'full', 'closed', 'in_progress', 'ended'] as RoundStatus[]).map((s) => (
            <RoundStamp key={s} status={s} />
          ))}
          <SeatCount round={{ online_left: 2, online_cap: 12 }} />
          <SeatCount round={{ online_left: 0, online_cap: 12 }} />
        </Card>
      </Section>

      <Section title="PlayerStatusChip · LeaderBadge">
        <Card tone="purple" className="flex flex-wrap gap-2 items-center">
          {(['booked', 'checked_in', 'released', 'cancelled', 'removed'] as PlayerStatus[]).map((s) => (
            <PlayerStatusChip key={s} status={s} />
          ))}
          <LeaderBadge />
          <LeaderBadge you />
        </Card>
      </Section>

      <Section title="Notices">
        <StickyNote title="Chula students only">กิจกรรม Escape Room สงวนสิทธิ์สำหรับนิสิตจุฬาลงกรณ์มหาวิทยาลัยเท่านั้น</StickyNote>
        <InfoNotice title="Online booking closed — walk in at the booth">รอบที่ยังมีที่นั่ง walk-in มาลงชื่อได้ที่บูธ</InfoNotice>
        <ErrorNotice title="ที่นั่งเต็มระหว่างที่คุณกรอกข้อมูล">{errorMessage('NOT_ENOUGH_SEATS', '2')}</ErrorNotice>
      </Section>

      <Section title="Fields">
        <Card tape>
          <div className="flex flex-col gap-3">
            <TextField
              id="kit-sid"
              label="Student ID"
              required
              inputMode="numeric"
              mono
              value={sid}
              onChange={(e) => setSid(e.target.value)}
              hint="รหัสนิสิต 10 หลัก"
              error={sid && !/^[0-9]{10}$/.test(sid) ? errorMessage('INVALID_STUDENT_ID') : undefined}
            />
            <CheckField id="kit-pdpa" checked={pdpa} onChange={setPdpa}>
              ยินยอมให้เก็บและใช้ข้อมูลส่วนบุคคลเพื่อการจองและเช็กอินกิจกรรมนี้เท่านั้น
            </CheckField>
          </div>
        </Card>
      </Section>

      <Section title="Buttons">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="link">Link style</Button>
        <Button disabled>Disabled</Button>
        <Button loading loadingText="Checking seats…">Loading</Button>
        <Button href={bookingPaths(ACTIVITY).myBooking} variant="secondary">
          Link → {bookingPaths(ACTIVITY).myBooking}
        </Button>
      </Section>

      <Section title="BookingQR">
        <Card tone="cream" className="flex flex-col items-center gap-2">
          <BookingQR code="SVP-7K3QX9" />
          <p className="font-bold tracking-widest">SVP-7K3QX9</p>
        </Card>
      </Section>

      <Section title="findBooking (try a wrong code → Thai error)">
        <Card>
          <div className="flex flex-col gap-3">
            <TextField id="kit-code" label="Personal booking code" mono value={lookup} onChange={(e) => setLookup(e.target.value)} />
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  const b = await findBooking(lookup);
                  alert(`${b.me.full_name} · ${b.me.status}`);
                } catch (e) {
                  alert(e instanceof BookingApiError ? `${e.code}: ${e.message}` : String(e));
                }
              }}
            >
              findBooking()
            </Button>
          </div>
        </Card>
      </Section>

      <Section title="Sheet">
        <Button variant="secondary" onClick={() => setSheet(true)}>
          Open sheet
        </Button>
        <p className="text-sm text-halloween-gray">Thai date: {a?.booking_closes_at ? formatDateTh(a.booking_closes_at) : '-'}</p>
      </Section>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Cancel whole team?"
        footer={
          <>
            <Button variant="danger" onClick={() => setSheet(false)}>
              Yes, cancel all seats
            </Button>
            <Button variant="secondary" onClick={() => setSheet(false)}>
              Keep the team
            </Button>
          </>
        }
      >
        <p>ที่นั่งของทุกคนจะถูกยกเลิก กู้คืนไม่ได้ ทุกคนจะได้รับอีเมลแจ้ง</p>
      </Sheet>
    </BookingPage>
  );
}
