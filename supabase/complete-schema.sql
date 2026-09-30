-- ============================================
-- SHIVIDNI PHEEDU 2026 - Complete Database Schema
-- ============================================
-- This is the complete, consolidated schema for the registrations system.
-- Run this in your Supabase SQL Editor to set up everything.
-- ============================================

-- ============================================
-- 1. CREATE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Required user information
  student_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,

  -- Registration details
  department TEXT,
  gender TEXT,
  year TEXT,
  referral_source TEXT,
  interested_activities TEXT,
  transportation TEXT,

  -- QR and attendance tracking
  qr_code TEXT NOT NULL UNIQUE,
  attended BOOLEAN DEFAULT FALSE,
  attended_at TIMESTAMP WITH TIME ZONE,

  -- Ghost quiz result
  ghost_result TEXT
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

-- Index on email for faster lookups
CREATE INDEX IF NOT EXISTS registrations_email_idx ON registrations(email);

-- Index on qr_code for scanner lookups
CREATE INDEX IF NOT EXISTS registrations_qr_code_idx ON registrations(qr_code);

-- Index on student_id for faster lookups
CREATE INDEX IF NOT EXISTS registrations_student_id_idx ON registrations(student_id);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE POLICIES
-- ============================================

-- Allow public inserts (for registration)
CREATE POLICY "Allow public insert" ON registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow public select (for QR verification and login)
CREATE POLICY "Allow public select" ON registrations
  FOR SELECT
  TO anon
  USING (true);

-- Allow public updates (for attendance marking)
CREATE POLICY "Allow public update" ON registrations
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. VERIFICATION QUERY
-- ============================================

-- Run this to verify the table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'registrations'
ORDER BY ordinal_position;

-- ============================================
-- MIGRATION NOTES
-- ============================================
-- If you're migrating from an old schema with first_name/last_name/phone:
--
-- 1. First, add the new columns:
--    ALTER TABLE registrations ADD COLUMN IF NOT EXISTS full_name TEXT;
--
-- 2. Migrate the data:
--    UPDATE registrations
--    SET full_name = CONCAT(first_name, ' ', last_name)
--    WHERE full_name IS NULL;
--
-- 3. Then drop old columns:
--    ALTER TABLE registrations
--    DROP COLUMN IF EXISTS first_name,
--    DROP COLUMN IF EXISTS last_name,
--    DROP COLUMN IF EXISTS phone;
--
-- 4. Make full_name required:
--    ALTER TABLE registrations ALTER COLUMN full_name SET NOT NULL;
-- ============================================
