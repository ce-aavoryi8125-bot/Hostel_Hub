-- ============================================================
-- HOSTEL HUB — Database Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. LOCATIONS: Add missing columns
-- ─────────────────────────────────────────────────────────────
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS nearby_landmark TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS distance_km NUMERIC(5,2) DEFAULT 1.5,
  ADD COLUMN IF NOT EXISTS estimated_walking_mins INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS hostel_count INTEGER DEFAULT 0;

-- ─────────────────────────────────────────────────────────────
-- 2. DEMO DATA FLAG: Add is_demo to key tables
--    Allows admins to identify, hide, and purge demo/seed data
-- ─────────────────────────────────────────────────────────────
ALTER TABLE hostels
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

ALTER TABLE manager_profiles
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- ─────────────────────────────────────────────────────────────
-- 3. TOUR REQUESTS: Ensure all columns exist (resilient insert)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tour_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id      UUID REFERENCES hostels(id) ON DELETE CASCADE,
  hostel_name    TEXT DEFAULT '',
  manager_id     UUID,
  name           TEXT NOT NULL,
  phone          TEXT NOT NULL,
  message        TEXT DEFAULT '',
  special_notes  TEXT DEFAULT '',
  student_id     UUID,
  preferred_date DATE,
  preferred_time TEXT DEFAULT 'Morning (10:00 AM)',
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tour_requests
  ADD COLUMN IF NOT EXISTS special_notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS preferred_date DATE,
  ADD COLUMN IF NOT EXISTS preferred_time TEXT DEFAULT 'Morning (10:00 AM)',
  ADD COLUMN IF NOT EXISTS student_id UUID;

-- ─────────────────────────────────────────────────────────────
-- 4. HOSTELS: Add verification_status column if missing
-- ─────────────────────────────────────────────────────────────
ALTER TABLE hostels
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rules TEXT DEFAULT '';

-- ─────────────────────────────────────────────────────────────
-- 5. STUDENTS: Add missing profile fields
-- ─────────────────────────────────────────────────────────────
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS faculty TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS department TEXT DEFAULT '';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hostels_manager_id       ON hostels(manager_id);
CREATE INDEX IF NOT EXISTS idx_hostels_is_demo          ON hostels(is_demo);
CREATE INDEX IF NOT EXISTS idx_tour_requests_hostel_id  ON tour_requests(hostel_id);
CREATE INDEX IF NOT EXISTS idx_tour_requests_status     ON tour_requests(status);
CREATE INDEX IF NOT EXISTS idx_locations_is_active      ON locations(is_active);
