-- ============================================
-- Testing on the live database before launch
-- ============================================
-- Dev, Vercel and the real site share one database, so tests run on it and are wiped
-- before launch. Testers use student IDs starting 6999 for registrations: the reset
-- only removes those. Every booking is a test until booking opens for real (18 Oct).

-- ---- 1. Open booking now for testing ----
UPDATE booking_activities SET booking_opens_at = NOW()
WHERE id IN ('escape_room', 'haunted_house');


-- ---- 2. Reset (run before the rehearsal on 16 Oct, and again before launch) ----
-- Wipes every booking, walk-in and reminder mark, the 6999 registrations, staff edits
-- to rounds (closed, seat overrides), and puts round times and opening times back.
BEGIN;

DELETE FROM booking_players WHERE activity_id IN ('escape_room', 'haunted_house');
DELETE FROM bookings        WHERE activity_id IN ('escape_room', 'haunted_house');
DELETE FROM booking_walkins WHERE activity_id IN ('escape_room', 'haunted_house');
DELETE FROM registrations   WHERE student_id LIKE '6999%';

-- Escape Room: 9 rounds, 17:00 + 25 min each, break 19:00-19:30 (as in booking-schema.sql)
UPDATE booking_rounds SET
  starts_at = CASE WHEN round_no <= 5
    THEN TIMESTAMPTZ '2026-10-22 17:00:00+07' + (round_no - 1) * INTERVAL '25 minutes'
    ELSE TIMESTAMPTZ '2026-10-22 19:30:00+07' + (round_no - 6) * INTERVAL '25 minutes' END,
  ends_at = CASE WHEN round_no <= 5
    THEN TIMESTAMPTZ '2026-10-22 17:20:00+07' + (round_no - 1) * INTERVAL '25 minutes'
    ELSE TIMESTAMPTZ '2026-10-22 19:50:00+07' + (round_no - 6) * INTERVAL '25 minutes' END,
  online_seats = NULL, walkin_seats = NULL, closed = FALSE, closed_reason = NULL
WHERE activity_id = 'escape_room';

-- Haunted House: rounds 1, 3 … 21, 16:40 + 20 min each, 15 min long (as in haunted-house.sql)
UPDATE booking_rounds SET
  starts_at = TIMESTAMPTZ '2026-10-22 16:40:00+07' + ((round_no - 1) / 2) * INTERVAL '20 minutes',
  ends_at   = TIMESTAMPTZ '2026-10-22 16:55:00+07' + ((round_no - 1) / 2) * INTERVAL '20 minutes',
  online_seats = NULL, walkin_seats = NULL, closed = FALSE, closed_reason = NULL
WHERE activity_id = 'haunted_house';

-- Opening times for launch. Haunted House stays closed until its open time is decided.
UPDATE booking_activities SET booking_opens_at = TIMESTAMPTZ '2026-10-18 09:00:00+07' WHERE id = 'escape_room';
UPDATE booking_activities SET booking_opens_at = NULL WHERE id = 'haunted_house';

-- A rehearsal reminder job, if one was added
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname LIKE 'booking-reminders-test%';

COMMIT;

-- Check: everything 0 / back to 22 Oct
SELECT
  (SELECT count(*) FROM booking_players) AS players,
  (SELECT count(*) FROM bookings) AS bookings,
  (SELECT count(*) FROM booking_walkins) AS walkins,
  (SELECT count(*) FROM registrations WHERE student_id LIKE '6999%') AS test_registrations,
  (SELECT count(*) FROM registrations) AS registrations_left,
  (SELECT min(starts_at) FROM booking_rounds) AS first_round,
  (SELECT max(ends_at) FROM booking_rounds) AS last_round_ends,
  (SELECT string_agg(id || ' ' || coalesce(booking_opens_at::text, 'not open'), ', ') FROM booking_activities) AS opens,
  (SELECT string_agg(jobname, ', ') FROM cron.job) AS cron_jobs;
