-- ============================================
-- SHIVIDNI PHEEDU - Activity Booking Schema
-- ============================================
-- One schema for every bookable activity (Escape Room now, Haunted House later).
-- Per-activity rules live in booking_activities, so a new activity is a new row,
-- not new tables.
--
-- Access model: RLS is on with NO policies, so the browser (anon key) cannot read
-- or write anything here. All reads/writes go through Next.js API routes using the
-- service role key (supabaseAdmin), and every seat-changing action goes through the
-- booking_* functions below, which lock the round row so two teams can never take
-- the same seats.
--
-- Times are timestamptz everywhere. Seed with an explicit +07 offset.
-- Run in the Supabase SQL Editor. Safe to re-run (drops nothing, uses IF NOT EXISTS
-- / OR REPLACE).
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================
-- 1. TABLES
-- ============================================

-- One row per activity. Every number the rules depend on lives here.
CREATE TABLE IF NOT EXISTS booking_activities (
  id TEXT PRIMARY KEY,                                   -- 'escape_room', 'haunted_house'
  name TEXT NOT NULL,
  team_min INT NOT NULL DEFAULT 1 CHECK (team_min >= 1),
  team_max INT NOT NULL DEFAULT 1,
  online_seats INT NOT NULL CHECK (online_seats >= 0),   -- default per round
  walkin_seats INT NOT NULL DEFAULT 0 CHECK (walkin_seats >= 0),
  checkin_opens_before INTERVAL NOT NULL DEFAULT '30 minutes',
  checkin_duration INTERVAL NOT NULL DEFAULT '15 minutes',
  booking_opens_at TIMESTAMPTZ,                          -- NULL = not scheduled yet
  booking_closes_at TIMESTAMPTZ,                         -- also the last moment to change round
  -- 'activity': one round per person per activity; 'global': one round across all activities
  one_per_person_scope TEXT NOT NULL DEFAULT 'activity'
    CHECK (one_per_person_scope IN ('activity', 'global')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (team_max >= team_min)
);

CREATE TABLE IF NOT EXISTS booking_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id TEXT NOT NULL REFERENCES booking_activities(id) ON DELETE CASCADE,
  round_no INT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  online_seats INT CHECK (online_seats >= 0),            -- NULL = use activity default
  walkin_seats INT CHECK (walkin_seats >= 0),            -- NULL = use activity default
  closed BOOLEAN NOT NULL DEFAULT FALSE,                 -- e.g. staff break
  closed_reason TEXT,
  UNIQUE (activity_id, round_no),
  CHECK (ends_at > starts_at)
);

-- One booking = one team in one round.
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id TEXT NOT NULL REFERENCES booking_activities(id),
  round_id UUID NOT NULL REFERENCES booking_rounds(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per person (seat). activity_id / round_id are copied from the booking so
-- the one-per-person index and seat counts don't need joins.
CREATE TABLE IF NOT EXISTS booking_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL REFERENCES booking_activities(id),
  round_id UUID NOT NULL REFERENCES booking_rounds(id),
  position INT NOT NULL,                                 -- order in the team; next leader = lowest active
  is_leader BOOLEAN NOT NULL DEFAULT FALSE,
  student_id TEXT NOT NULL CHECK (student_id ~ '^[0-9]{10}$'),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,                             -- personal booking code (secret, email only)
  -- 'released' is not stored: it is 'booked' + check-in already closed (see booking_players_live)
  status TEXT NOT NULL DEFAULT 'booked'
    CHECK (status IN ('booked', 'checked_in', 'cancelled', 'removed')),
  pdpa_accepted_at TIMESTAMPTZ NOT NULL,
  rules_accepted_at TIMESTAMPTZ NOT NULL,
  checked_in_at TIMESTAMPTZ,
  checked_in_by TEXT,                                    -- staff email
  cancelled_at TIMESTAMPTZ,                              -- set for cancelled and removed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id, position)
);

-- Walk-ins and the walk-in queue (entered by staff).
CREATE TABLE IF NOT EXISTS booking_walkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id TEXT NOT NULL REFERENCES booking_activities(id),
  round_id UUID NOT NULL REFERENCES booking_rounds(id),
  queue_no BIGINT GENERATED ALWAYS AS IDENTITY,
  student_id TEXT NOT NULL CHECK (student_id ~ '^[0-9]{10}$'),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'checked_in', 'left')),
  created_by TEXT,                                       -- staff email
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_at TIMESTAMPTZ
);

-- Google accounts allowed into the booking admin.
CREATE TABLE IF NOT EXISTS booking_admins (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. INDEXES
-- ============================================

-- 1 person = 1 round per activity. Cancelled/removed rows don't block re-booking.
CREATE UNIQUE INDEX IF NOT EXISTS booking_players_one_per_activity
  ON booking_players (activity_id, student_id)
  WHERE status IN ('booked', 'checked_in');

CREATE UNIQUE INDEX IF NOT EXISTS booking_walkins_one_per_activity
  ON booking_walkins (activity_id, student_id)
  WHERE status IN ('queued', 'checked_in');

CREATE INDEX IF NOT EXISTS booking_players_round_idx ON booking_players (round_id, status);
CREATE INDEX IF NOT EXISTS booking_players_booking_idx ON booking_players (booking_id);
CREATE INDEX IF NOT EXISTS booking_players_student_idx ON booking_players (student_id);
CREATE INDEX IF NOT EXISTS booking_walkins_round_idx ON booking_walkins (round_id, status);
CREATE INDEX IF NOT EXISTS booking_walkins_student_idx ON booking_walkins (student_id);
CREATE INDEX IF NOT EXISTS booking_rounds_activity_idx ON booking_rounds (activity_id, starts_at);

-- ============================================
-- 3. ROW LEVEL SECURITY (no policies = server only)
-- ============================================

ALTER TABLE booking_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_walkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_admins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. VIEWS (security_invoker: the anon key sees nothing through them either)
-- ============================================

-- Round times with activity defaults applied.
CREATE OR REPLACE VIEW booking_round_times WITH (security_invoker = on) AS
SELECT
  r.id,
  r.activity_id,
  r.round_no,
  r.starts_at,
  r.ends_at,
  r.closed,
  r.closed_reason,
  COALESCE(r.online_seats, a.online_seats) AS online_cap,
  COALESCE(r.walkin_seats, a.walkin_seats) AS walkin_cap,
  r.starts_at - a.checkin_opens_before AS checkin_opens_at,
  r.starts_at - a.checkin_opens_before + a.checkin_duration AS checkin_closes_at,
  a.booking_opens_at,
  a.booking_closes_at
FROM booking_rounds r
JOIN booking_activities a ON a.id = r.activity_id;

-- Players with the time-based 'released' status filled in.
CREATE OR REPLACE VIEW booking_players_live WITH (security_invoker = on) AS
SELECT
  p.*,
  t.round_no,
  t.starts_at,
  t.checkin_opens_at,
  t.checkin_closes_at,
  CASE
    WHEN p.status = 'booked' AND NOW() > t.checkin_closes_at THEN 'released'
    ELSE p.status
  END AS live_status
FROM booking_players p
JOIN booking_round_times t ON t.id = p.round_id;

-- Seats per round, for the round list, dashboard and walk-in desk.
-- walkin_left = walk-in seats + released + cancelled after booking closed - walk-ins already in.
CREATE OR REPLACE VIEW booking_round_availability WITH (security_invoker = on) AS
SELECT
  c.*,
  CASE
    WHEN c.closed THEN 'closed'
    WHEN NOW() >= c.ends_at THEN 'ended'
    WHEN NOW() >= c.starts_at THEN 'in_progress'
    WHEN c.booking_closes_at IS NOT NULL AND NOW() > c.booking_closes_at THEN
      CASE WHEN c.walkin_left > 0 THEN 'walkin_available' ELSE 'full' END
    WHEN c.online_left <= 0 THEN 'full'
    ELSE 'available'
  END AS round_status
FROM (
  SELECT
    t.*,
    s.online_taken,
    t.online_cap - s.online_taken AS online_left,
    s.checked_in,
    s.released,
    s.cancelled_late,
    w.walkin_in,
    w.walkin_queued,
    t.walkin_cap + s.released + s.cancelled_late - w.walkin_in AS walkin_left
  FROM booking_round_times t
  CROSS JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE p.status IN ('booked', 'checked_in')) AS online_taken,
      COUNT(*) FILTER (WHERE p.status = 'checked_in') AS checked_in,
      COUNT(*) FILTER (WHERE p.status = 'booked' AND NOW() > t.checkin_closes_at) AS released,
      COUNT(*) FILTER (
        WHERE p.status IN ('cancelled', 'removed')
          AND t.booking_closes_at IS NOT NULL
          AND p.cancelled_at > t.booking_closes_at
      ) AS cancelled_late
    FROM booking_players p
    WHERE p.round_id = t.id
  ) s
  CROSS JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE wk.status = 'checked_in') AS walkin_in,
      COUNT(*) FILTER (WHERE wk.status = 'queued') AS walkin_queued
    FROM booking_walkins wk
    WHERE wk.round_id = t.id
  ) w
) c;

-- ============================================
-- 5. FUNCTIONS
-- ============================================
-- Errors are raised as 'CODE' or 'CODE:detail' so the API can map them to UI text:
-- ROUND_NOT_FOUND, ROUND_CLOSED, BOOKING_NOT_OPEN, BOOKING_CLOSED, TEAM_SIZE,
-- INVALID_PLAYER, DUPLICATE_IN_TEAM:<sid>, ALREADY_BOOKED:<sid>, NOT_ENOUGH_SEATS:<left>,
-- NOT_FOUND, NOT_LEADER, SAME_ROUND, TOO_LATE, NOT_CANCELLABLE, CANNOT_REMOVE_LEADER,
-- CHECKIN_NOT_OPEN, CHECKIN_CLOSED, ALREADY_CHECKED_IN

-- Personal code like 'SVP-7K3QX9'. No 0/O/1/I/L to avoid misreading.
CREATE OR REPLACE FUNCTION booking_new_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
DECLARE
  alphabet CONSTANT TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  b BYTEA := gen_random_bytes(6);
  s TEXT := 'SVP-';
BEGIN
  FOR i IN 0..5 LOOP
    s := s || substr(alphabet, (get_byte(b, i) % length(alphabet)) + 1, 1);
  END LOOP;
  RETURN s;
END;
$$;

-- Is this student already holding a seat (online or walk-in) under the activity's scope?
CREATE OR REPLACE FUNCTION booking_student_taken(p_activity_id TEXT, p_student_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM booking_players p
    JOIN booking_activities a ON a.id = p_activity_id
    WHERE p.student_id = p_student_id
      AND p.status IN ('booked', 'checked_in')
      AND (a.one_per_person_scope = 'global' OR p.activity_id = p_activity_id)
  ) OR EXISTS (
    SELECT 1 FROM booking_walkins w
    JOIN booking_activities a ON a.id = p_activity_id
    WHERE w.student_id = p_student_id
      AND w.status IN ('queued', 'checked_in')
      AND (a.one_per_person_scope = 'global' OR w.activity_id = p_activity_id)
  );
$$;

-- Book a whole team. p_players: [{student_id, full_name, phone, email, pdpa, rules}, ...]
-- First player is the leader. Returns {booking_id, players:[{full_name,email,code,is_leader}]}
-- so the API can send each person their own confirmation email.
CREATE OR REPLACE FUNCTION booking_book_team(p_round_id UUID, p_players JSONB, p_notes TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
DECLARE
  r booking_round_times%ROWTYPE;
  a booking_activities%ROWTYPE;
  n INT;
  taken INT;
  dup TEXT;
  v_booking UUID;
BEGIN
  -- Lock the round first: every seat change for this round queues up behind this line.
  PERFORM 1 FROM booking_rounds WHERE id = p_round_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ROUND_NOT_FOUND'; END IF;
  SELECT * INTO r FROM booking_round_times WHERE id = p_round_id;
  SELECT * INTO a FROM booking_activities WHERE id = r.activity_id;

  IF a.booking_opens_at IS NULL OR NOW() < a.booking_opens_at THEN RAISE EXCEPTION 'BOOKING_NOT_OPEN'; END IF;
  IF a.booking_closes_at IS NOT NULL AND NOW() > a.booking_closes_at THEN RAISE EXCEPTION 'BOOKING_CLOSED'; END IF;
  IF r.closed OR NOW() >= r.checkin_opens_at THEN RAISE EXCEPTION 'ROUND_CLOSED'; END IF;

  IF jsonb_typeof(p_players) <> 'array' THEN RAISE EXCEPTION 'INVALID_PLAYER'; END IF;
  n := jsonb_array_length(p_players);
  IF n < a.team_min OR n > a.team_max THEN RAISE EXCEPTION 'TEAM_SIZE'; END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_players) e
    WHERE COALESCE(e->>'student_id', '') !~ '^[0-9]{10}$'
       OR COALESCE(btrim(e->>'full_name'), '') = ''
       OR COALESCE(btrim(e->>'phone'), '') = ''
       OR COALESCE(btrim(e->>'email'), '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
       OR COALESCE((e->>'pdpa')::BOOLEAN, FALSE) IS NOT TRUE
       OR COALESCE((e->>'rules')::BOOLEAN, FALSE) IS NOT TRUE
  ) THEN
    RAISE EXCEPTION 'INVALID_PLAYER';
  END IF;

  SELECT e->>'student_id' INTO dup
  FROM jsonb_array_elements(p_players) e
  GROUP BY 1 HAVING COUNT(*) > 1 LIMIT 1;
  IF dup IS NOT NULL THEN RAISE EXCEPTION 'DUPLICATE_IN_TEAM:%', dup; END IF;

  SELECT e->>'student_id' INTO dup
  FROM jsonb_array_elements(p_players) e
  WHERE booking_student_taken(a.id, e->>'student_id')
  LIMIT 1;
  IF dup IS NOT NULL THEN RAISE EXCEPTION 'ALREADY_BOOKED:%', dup; END IF;

  SELECT COUNT(*) INTO taken FROM booking_players
  WHERE round_id = p_round_id AND status IN ('booked', 'checked_in');
  IF taken + n > r.online_cap THEN RAISE EXCEPTION 'NOT_ENOUGH_SEATS:%', GREATEST(r.online_cap - taken, 0); END IF;

  INSERT INTO bookings (activity_id, round_id, notes)
  VALUES (a.id, p_round_id, NULLIF(btrim(p_notes), ''))
  RETURNING id INTO v_booking;

  INSERT INTO booking_players (
    booking_id, activity_id, round_id, position, is_leader,
    student_id, full_name, phone, email, code, pdpa_accepted_at, rules_accepted_at
  )
  SELECT
    v_booking, a.id, p_round_id, x.ord, x.ord = 1,
    x.e->>'student_id', btrim(x.e->>'full_name'), btrim(x.e->>'phone'), lower(btrim(x.e->>'email')),
    booking_new_code(), NOW(), NOW()
  FROM jsonb_array_elements(p_players) WITH ORDINALITY AS x(e, ord);

  RETURN jsonb_build_object(
    'booking_id', v_booking,
    'players', (
      SELECT jsonb_agg(jsonb_build_object(
        'full_name', full_name, 'email', email, 'code', code, 'is_leader', is_leader
      ) ORDER BY position)
      FROM booking_players WHERE booking_id = v_booking
    )
  );
EXCEPTION
  -- Two requests with the same student slipped past the check at the same moment.
  WHEN unique_violation THEN RAISE EXCEPTION 'ALREADY_BOOKED';
END;
$$;

-- Leader moves the whole team. Allowed until booking closes, only into a round with room.
-- Returns {round_id, players:[{full_name,email,code}]} for the "round changed" email.
CREATE OR REPLACE FUNCTION booking_change_round(p_leader_code TEXT, p_new_round_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  leader booking_players%ROWTYPE;
  b bookings%ROWTYPE;
  nr booking_round_times%ROWTYPE;
  n INT;
  taken INT;
BEGIN
  SELECT * INTO leader FROM booking_players
  WHERE code = p_leader_code AND is_leader AND status = 'booked';
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_LEADER'; END IF;
  SELECT * INTO b FROM bookings WHERE id = leader.booking_id;
  IF b.round_id = p_new_round_id THEN RAISE EXCEPTION 'SAME_ROUND'; END IF;

  -- Lock both rounds in a fixed order so two teams swapping rounds can't deadlock.
  PERFORM 1 FROM booking_rounds WHERE id IN (b.round_id, p_new_round_id) ORDER BY id FOR UPDATE;

  SELECT * INTO nr FROM booking_round_times WHERE id = p_new_round_id AND activity_id = b.activity_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'ROUND_NOT_FOUND'; END IF;
  IF nr.booking_closes_at IS NOT NULL AND NOW() > nr.booking_closes_at THEN RAISE EXCEPTION 'TOO_LATE'; END IF;
  IF nr.closed OR NOW() >= nr.checkin_opens_at THEN RAISE EXCEPTION 'ROUND_CLOSED'; END IF;

  SELECT COUNT(*) INTO n FROM booking_players WHERE booking_id = b.id AND status IN ('booked', 'checked_in');
  SELECT COUNT(*) INTO taken FROM booking_players WHERE round_id = p_new_round_id AND status IN ('booked', 'checked_in');
  IF taken + n > nr.online_cap THEN RAISE EXCEPTION 'NOT_ENOUGH_SEATS:%', GREATEST(nr.online_cap - taken, 0); END IF;

  UPDATE bookings SET round_id = p_new_round_id, updated_at = NOW() WHERE id = b.id;
  UPDATE booking_players SET round_id = p_new_round_id WHERE booking_id = b.id;

  RETURN jsonb_build_object(
    'round_id', p_new_round_id,
    'players', (
      SELECT jsonb_agg(jsonb_build_object('full_name', full_name, 'email', email, 'code', code) ORDER BY position)
      FROM booking_players WHERE booking_id = b.id AND status IN ('booked', 'checked_in')
    )
  );
END;
$$;

-- After the leader leaves: lowest-position active player becomes leader;
-- no one left = booking cancelled. Returns the new leader's id (or NULL).
CREATE OR REPLACE FUNCTION booking_fix_team(p_booking_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM booking_players WHERE booking_id = p_booking_id AND is_leader AND status IN ('booked', 'checked_in')) THEN
    RETURN NULL;
  END IF;
  SELECT id INTO next_id FROM booking_players
  WHERE booking_id = p_booking_id AND status IN ('booked', 'checked_in')
  ORDER BY position LIMIT 1;
  IF next_id IS NULL THEN
    UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = p_booking_id;
  ELSE
    UPDATE booking_players SET is_leader = TRUE WHERE id = next_id;
    UPDATE bookings SET updated_at = NOW() WHERE id = p_booking_id;
  END IF;
  RETURN next_id;
END;
$$;

-- Anyone cancels their own seat, until check-in closes.
CREATE OR REPLACE FUNCTION booking_cancel_seat(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  p booking_players_live%ROWTYPE;
  new_leader UUID;
BEGIN
  SELECT * INTO p FROM booking_players_live WHERE code = p_code;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  PERFORM 1 FROM booking_rounds WHERE id = p.round_id FOR UPDATE;
  IF p.status <> 'booked' THEN RAISE EXCEPTION 'NOT_CANCELLABLE'; END IF;
  IF NOW() > p.checkin_closes_at THEN RAISE EXCEPTION 'TOO_LATE'; END IF;

  UPDATE booking_players SET status = 'cancelled', cancelled_at = NOW(), is_leader = FALSE WHERE id = p.id;
  new_leader := booking_fix_team(p.booking_id);

  RETURN jsonb_build_object('booking_id', p.booking_id, 'new_leader_id', new_leader);
END;
$$;

-- Leader cancels everyone who hasn't checked in yet, until check-in closes.
CREATE OR REPLACE FUNCTION booking_cancel_team(p_leader_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  leader booking_players_live%ROWTYPE;
  v_count INT;
BEGIN
  SELECT * INTO leader FROM booking_players_live WHERE code = p_leader_code AND is_leader AND status = 'booked';
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_LEADER'; END IF;
  PERFORM 1 FROM booking_rounds WHERE id = leader.round_id FOR UPDATE;
  IF NOW() > leader.checkin_closes_at THEN RAISE EXCEPTION 'TOO_LATE'; END IF;

  UPDATE booking_players SET status = 'cancelled', cancelled_at = NOW(), is_leader = FALSE
  WHERE booking_id = leader.booking_id AND status = 'booked';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  PERFORM booking_fix_team(leader.booking_id);

  RETURN jsonb_build_object('booking_id', leader.booking_id, 'cancelled', v_count);
END;
$$;

-- Leader removes one member (not themselves), until check-in closes.
CREATE OR REPLACE FUNCTION booking_remove_member(p_leader_code TEXT, p_player_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  leader booking_players_live%ROWTYPE;
  target booking_players%ROWTYPE;
BEGIN
  SELECT * INTO leader FROM booking_players_live WHERE code = p_leader_code AND is_leader AND status = 'booked';
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_LEADER'; END IF;
  PERFORM 1 FROM booking_rounds WHERE id = leader.round_id FOR UPDATE;
  IF NOW() > leader.checkin_closes_at THEN RAISE EXCEPTION 'TOO_LATE'; END IF;

  SELECT * INTO target FROM booking_players WHERE id = p_player_id AND booking_id = leader.booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF target.id = leader.id THEN RAISE EXCEPTION 'CANNOT_REMOVE_LEADER'; END IF;
  IF target.status <> 'booked' THEN RAISE EXCEPTION 'NOT_CANCELLABLE'; END IF;

  UPDATE booking_players SET status = 'removed', cancelled_at = NOW() WHERE id = target.id;
  RETURN jsonb_build_object('booking_id', leader.booking_id, 'removed_id', target.id);
END;
$$;

-- Staff check-in (by QR -> code, or search -> player id), only inside the check-in window.
CREATE OR REPLACE FUNCTION booking_check_in(p_player_id UUID, p_staff_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  p booking_players_live%ROWTYPE;
BEGIN
  SELECT * INTO p FROM booking_players_live WHERE id = p_player_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF p.status = 'checked_in' THEN RAISE EXCEPTION 'ALREADY_CHECKED_IN'; END IF;
  IF p.status <> 'booked' THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOW() < p.checkin_opens_at THEN RAISE EXCEPTION 'CHECKIN_NOT_OPEN'; END IF;
  IF NOW() > p.checkin_closes_at THEN RAISE EXCEPTION 'CHECKIN_CLOSED'; END IF;

  UPDATE booking_players
  SET status = 'checked_in', checked_in_at = NOW(), checked_in_by = p_staff_email
  WHERE id = p.id AND status = 'booked';

  RETURN jsonb_build_object('player_id', p.id, 'full_name', p.full_name, 'round_no', p.round_no);
END;
$$;

-- Staff adds a walk-in. Seat free now = checked in straight away; otherwise queued.
CREATE OR REPLACE FUNCTION booking_add_walkin(
  p_round_id UUID, p_student_id TEXT, p_full_name TEXT, p_phone TEXT, p_staff_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  r booking_round_availability%ROWTYPE;
  v_id UUID;
  v_status TEXT;
BEGIN
  PERFORM 1 FROM booking_rounds WHERE id = p_round_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ROUND_NOT_FOUND'; END IF;
  SELECT * INTO r FROM booking_round_availability WHERE id = p_round_id;
  IF r.closed OR NOW() >= r.ends_at THEN RAISE EXCEPTION 'ROUND_CLOSED'; END IF;
  IF booking_student_taken(r.activity_id, p_student_id) THEN RAISE EXCEPTION 'ALREADY_BOOKED:%', p_student_id; END IF;

  v_status := CASE WHEN r.walkin_left > 0 THEN 'checked_in' ELSE 'queued' END;
  INSERT INTO booking_walkins (activity_id, round_id, student_id, full_name, phone, status, created_by, checked_in_at)
  VALUES (r.activity_id, p_round_id, p_student_id, btrim(p_full_name), btrim(p_phone), v_status, p_staff_email,
          CASE WHEN v_status = 'checked_in' THEN NOW() END)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('walkin_id', v_id, 'status', v_status);
EXCEPTION
  WHEN unique_violation THEN RAISE EXCEPTION 'ALREADY_BOOKED:%', p_student_id;
END;
$$;

-- Staff calls the next person in the queue when a seat frees up.
CREATE OR REPLACE FUNCTION booking_call_next_walkin(p_round_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  r booking_round_availability%ROWTYPE;
  w booking_walkins%ROWTYPE;
BEGIN
  PERFORM 1 FROM booking_rounds WHERE id = p_round_id FOR UPDATE;
  SELECT * INTO r FROM booking_round_availability WHERE id = p_round_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'ROUND_NOT_FOUND'; END IF;
  IF r.walkin_left <= 0 THEN RAISE EXCEPTION 'NOT_ENOUGH_SEATS:0'; END IF;

  SELECT * INTO w FROM booking_walkins
  WHERE round_id = p_round_id AND status = 'queued'
  ORDER BY queue_no LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;

  UPDATE booking_walkins SET status = 'checked_in', checked_in_at = NOW() WHERE id = w.id;
  RETURN jsonb_build_object('walkin_id', w.id, 'full_name', w.full_name, 'phone', w.phone, 'queue_no', w.queue_no);
END;
$$;

-- Only the server (service role) may call these.
REVOKE EXECUTE ON FUNCTION
  booking_new_code(),
  booking_student_taken(TEXT, TEXT),
  booking_book_team(UUID, JSONB, TEXT),
  booking_change_round(TEXT, UUID),
  booking_fix_team(UUID),
  booking_cancel_seat(TEXT),
  booking_cancel_team(TEXT),
  booking_remove_member(TEXT, UUID),
  booking_check_in(UUID, TEXT),
  booking_add_walkin(UUID, TEXT, TEXT, TEXT, TEXT),
  booking_call_next_walkin(UUID)
FROM PUBLIC, anon, authenticated;

-- ============================================
-- 6. MOCK SEED - Escape Room (numbers are placeholders until the brief is final)
-- ============================================
-- Haunted House: add another row with its own numbers + its rounds, nothing else changes.
-- A round holds as many teams as its seats allow: 12 online seats = e.g. three teams of 4.
-- Re-running this file applies the numbers below to the existing row.

INSERT INTO booking_activities (
  id, name, team_min, team_max, online_seats, walkin_seats,
  checkin_opens_before, checkin_duration, booking_opens_at, booking_closes_at
) VALUES (
  'escape_room', 'Escape Room', 1, 4, 12, 3,
  '30 minutes', '15 minutes',
  '2026-10-12 09:00:00+07', '2026-10-18 23:59:00+07'
) ON CONFLICT (id) DO UPDATE SET
  team_min = EXCLUDED.team_min,
  team_max = EXCLUDED.team_max,
  online_seats = EXCLUDED.online_seats,
  walkin_seats = EXCLUDED.walkin_seats,
  checkin_opens_before = EXCLUDED.checkin_opens_before,
  checkin_duration = EXCLUDED.checkin_duration,
  booking_opens_at = EXCLUDED.booking_opens_at,
  booking_closes_at = EXCLUDED.booking_closes_at;

INSERT INTO booking_rounds (activity_id, round_no, starts_at, ends_at)
SELECT
  'escape_room',
  n,
  TIMESTAMPTZ '2026-10-22 17:00:00+07' + (n - 1) * INTERVAL '25 minutes',
  TIMESTAMPTZ '2026-10-22 17:20:00+07' + (n - 1) * INTERVAL '25 minutes'
FROM generate_series(1, 10) AS n
ON CONFLICT (activity_id, round_no) DO NOTHING;
