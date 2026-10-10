-- ============================================
-- Check-in reminder emails (Escape Room + Haunted House)
-- ============================================
-- Everyone still booked gets one email 10 minutes before their round's check-in
-- (Haunted House: registration) opens, with their QR. The database wakes the site
-- every minute on event day; /api/booking/remind claims who is due and emails them.
-- Safe to re-run.

ALTER TABLE booking_players ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Marks the people whose check-in opens within p_lead (and hasn't closed yet) as
-- reminded and returns them. Each person is returned once, even if two calls overlap.
CREATE OR REPLACE FUNCTION booking_claim_reminders(p_lead INTERVAL DEFAULT '10 minutes', p_limit INT DEFAULT 100)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v JSONB;
BEGIN
  WITH due AS (
    SELECT p.id FROM booking_players p
    JOIN booking_round_times t ON t.id = p.round_id
    WHERE p.status = 'booked'
      AND p.reminder_sent_at IS NULL
      AND NOW() >= t.checkin_opens_at - p_lead
      AND NOW() < t.checkin_closes_at
    ORDER BY t.checkin_opens_at
    LIMIT p_limit
    FOR UPDATE OF p SKIP LOCKED
  ), marked AS (
    UPDATE booking_players p SET reminder_sent_at = NOW()
    FROM due WHERE p.id = due.id
    RETURNING p.full_name, p.email, p.code, p.activity_id, p.round_id
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'full_name', full_name, 'email', email, 'code', code, 'activity_id', activity_id, 'round_id', round_id
  )), '[]'::jsonb) INTO v FROM marked;
  RETURN v;
END;
$$;

REVOKE EXECUTE ON FUNCTION booking_claim_reminders(INTERVAL, INT) FROM PUBLIC, anon, authenticated;

-- ---- The every-minute wake-up (applied as migration checkin_reminders_cron) ----
-- The secret is made inside the database and kept in Vault. The site checks it:
-- copy it from Supabase > Vault > reminder_cron_secret into the Vercel env var
-- CRON_SECRET and redeploy, or every call gets 401 and nobody is emailed.
-- 22 Oct, 16:00–20:59 Bangkok = 09:00–13:59 UTC (pg_cron runs in UTC).

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'reminder_cron_secret', 'Bearer token for /api/booking/remind')
WHERE NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'reminder_cron_secret');

SELECT cron.schedule('booking-reminders', '* 9-13 22 10 *', $job$
  SELECT net.http_post(
    url := 'https://shividnipheedu.vercel.app/api/booking/remind',
    headers := jsonb_build_object('Authorization', 'Bearer ' ||
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'reminder_cron_secret')),
    timeout_milliseconds := 10000
  );
$job$);

-- See runs: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
-- Stop it:  SELECT cron.unschedule('booking-reminders');
