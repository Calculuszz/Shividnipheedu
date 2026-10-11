-- ============================================
-- My booking in one call
-- ============================================
-- /api/booking/find and /api/booking/mine used to make 5-6 separate Supabase calls per
-- page open. On event day everyone opens their QR at once, and the Supabase API (not the
-- SQL) is the bottleneck, so the whole page now comes from this one function.
-- Pass a booking code, or a student + activity (the logged-in student's own booking).
-- Safe to re-run.

CREATE OR REPLACE FUNCTION booking_view(p_code TEXT DEFAULT NULL, p_student_id TEXT DEFAULT NULL, p_activity_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH me AS (
    SELECT p.id, p.booking_id, p.activity_id, p.round_id, p.is_leader, p.full_name, p.code,
           p.live_status, p.checked_in_at, p.checkin_opens_at, p.checkin_closes_at
    FROM booking_players_live p
    WHERE (p_code IS NOT NULL AND p.code = p_code)
       OR (p_code IS NULL AND p.student_id = p_student_id AND p.activity_id = p_activity_id
           AND p.status IN ('booked', 'checked_in'))
    ORDER BY p.created_at DESC
    LIMIT 1
  )
  SELECT jsonb_build_object(
    'me', to_jsonb(me),
    'round', (SELECT jsonb_build_object('round_no', t.round_no, 'starts_at', t.starts_at, 'ends_at', t.ends_at,
                                        'checkin_opens_at', t.checkin_opens_at, 'checkin_closes_at', t.checkin_closes_at)
              FROM booking_round_times t WHERE t.id = me.round_id),
    'booking', (SELECT jsonb_build_object('status', b.status, 'notes', b.notes) FROM bookings b WHERE b.id = me.booking_id),
    'activity', (SELECT jsonb_build_object('id', a.id, 'name', a.name, 'room_name', a.room_name, 'booking_closes_at', a.booking_closes_at)
                 FROM booking_activities a WHERE a.id = me.activity_id),
    'team', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', t.id, 'full_name', t.full_name, 'is_leader', t.is_leader,
                                                          'live_status', t.live_status) ORDER BY t.position), '[]'::jsonb)
             FROM booking_players_live t WHERE t.booking_id = me.booking_id)
  )
  FROM me;
$$;

REVOKE EXECUTE ON FUNCTION booking_view(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
