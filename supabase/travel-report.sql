-- Travel report for the sustainability office: where each registrant travels from.
-- Values are checked by the app against lib/travel.ts (exact text from the office's sheet).
--   origin_province: จังหวัดต้นทาง (Bangkok is stored as กรุงเทพ)
--   origin_district: เขตต้นทาง, Bangkok only (e.g. เขตปทุมวัน), NULL elsewhere
-- Rows registered before this change have NULLs.

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS origin_province TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS origin_district TEXT;
