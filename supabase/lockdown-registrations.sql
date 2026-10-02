-- ============================================
-- Lock down public.registrations
-- ============================================
-- Fixes Security Advisor "RLS Policy Always True": the anon key (shipped to every
-- browser) could read every row, insert anything, and mark anyone as checked in.
--
-- After this, only the server (service role key in the API routes) can touch the
-- table. RUN THIS ONLY AFTER the version of the site that reads through
-- /api/admin/* and /api/login is deployed, and SUPABASE_SERVICE_ROLE_KEY is set
-- in Vercel; otherwise the admin page and My Ticket stop working.
-- ============================================

DROP POLICY IF EXISTS "Allow public insert" ON registrations;
DROP POLICY IF EXISTS "Allow public select" ON registrations;
DROP POLICY IF EXISTS "Allow public update" ON registrations;

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Realtime is no longer used by the admin page (it polls the API instead).
-- If the table was added to the realtime publication, take it out:
-- ALTER PUBLICATION supabase_realtime DROP TABLE registrations;

-- Check: should return no rows
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'registrations';
