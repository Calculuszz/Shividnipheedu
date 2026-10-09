-- Haunted House booking (brief: "Event Brief Pre-event", tab บ้านผีสิง).
-- Runs on top of booking-schema.sql: same tables, API, staff pages and scanner as the
-- Escape Room. Safe to re-run.
--
-- Differences from the Escape Room, all data:
--   one person per booking (team 1–1), 15 online + 10 walk-in seats per round,
--   register at the point 15 min before play, closes 10 min before (check-in window),
--   rounds numbered 1, 3 … 21 as in the brief's table (even rounds are walk-in only, not stored).
-- Extra answers the haunted house asks for: nickname, faculty, year.

-- ============================================
-- 1. Extra player fields (NULL for Escape Room players)
-- ============================================
ALTER TABLE booking_players ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE booking_players ADD COLUMN IF NOT EXISTS faculty TEXT;
ALTER TABLE booking_players ADD COLUMN IF NOT EXISTS year TEXT;

-- booking_players_live (SELECT p.*) is left as it is: Postgres can't add columns in the
-- middle of an existing view. Pages that need these read them from booking_players.

-- ============================================
-- 2. booking_book_team: also stores nickname / faculty / year when sent.
--    Everything else is unchanged from booking-schema.sql.
-- ============================================
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
    student_id, full_name, phone, email, code, pdpa_accepted_at, rules_accepted_at,
    nickname, faculty, year
  )
  SELECT
    v_booking, a.id, p_round_id, x.ord, x.ord = 1,
    x.e->>'student_id', btrim(x.e->>'full_name'), btrim(x.e->>'phone'), lower(btrim(x.e->>'email')),
    booking_new_code(), NOW(), NOW(),
    NULLIF(btrim(x.e->>'nickname'), ''), NULLIF(btrim(x.e->>'faculty'), ''), NULLIF(btrim(x.e->>'year'), '')
  FROM jsonb_array_elements(p_players) WITH ORDINALITY AS x(e, ord);

  RETURN jsonb_build_object(
    'booking_id', v_booking,
    'round_id', p_round_id,
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

-- ============================================
-- 3. The activity and its rounds
-- ============================================
-- booking_opens_at stays NULL (= not open) until the opening time is decided:
--   UPDATE booking_activities SET booking_opens_at = '<time>+07' WHERE id = 'haunted_house';
INSERT INTO booking_activities (
  id, name, team_min, team_max, online_seats, walkin_seats,
  checkin_opens_before, checkin_duration, booking_opens_at, booking_closes_at
) VALUES (
  'haunted_house', 'Haunted House', 1, 1, 15, 10,
  '15 minutes', '5 minutes', NULL, '2026-10-20 23:59:00+07'
) ON CONFLICT (id) DO UPDATE SET
  team_min = EXCLUDED.team_min,
  team_max = EXCLUDED.team_max,
  online_seats = EXCLUDED.online_seats,
  walkin_seats = EXCLUDED.walkin_seats,
  checkin_opens_before = EXCLUDED.checkin_opens_before,
  checkin_duration = EXCLUDED.checkin_duration,
  booking_closes_at = EXCLUDED.booking_closes_at;

-- Round 1 plays 16:40–16:55, then every 20 minutes; round 21 plays 20:00–20:15.
-- Registration for a round opens 15 minutes before it starts (16:25 for round 1) and
-- closes 10 minutes before (16:30), exactly the brief's table.
INSERT INTO booking_rounds (activity_id, round_no, starts_at, ends_at)
SELECT
  'haunted_house',
  2 * k + 1,
  TIMESTAMPTZ '2026-10-22 16:40:00+07' + k * INTERVAL '20 minutes',
  TIMESTAMPTZ '2026-10-22 16:55:00+07' + k * INTERVAL '20 minutes'
FROM generate_series(0, 10) AS k
ON CONFLICT (activity_id, round_no) DO NOTHING;
