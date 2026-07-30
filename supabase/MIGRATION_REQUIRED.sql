-- ============================================================
-- HOSTEL HUB v4 — REQUIRED MIGRATION
-- Run this ONCE in your Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- Managers: Add application & approval columns
ALTER TABLE managers
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS national_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS hostel_name_applied TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS hostel_location_applied TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS hostel_description_applied TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS num_rooms_applied INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS room_types_applied TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS capacity_applied INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_methods_applied TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS application_notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Hostels: Add verification columns
ALTER TABLE hostels
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rules TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS hostel_logo TEXT DEFAULT '';

-- Students: Additional columns
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE;

-- Announcements: Add is_active
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Audit tables
CREATE TABLE IF NOT EXISTS manager_application_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES managers(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hostel_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE,
  hostel_name TEXT DEFAULT '',
  action TEXT NOT NULL,
  old_status TEXT DEFAULT '',
  new_status TEXT DEFAULT '',
  performed_by UUID,
  admin_name TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  admin_name TEXT DEFAULT '',
  action TEXT NOT NULL,
  entity_type TEXT DEFAULT '',
  entity_id TEXT DEFAULT '',
  entity_name TEXT DEFAULT '',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  audience TEXT DEFAULT 'all',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  admin_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activate default seeded data
UPDATE managers
  SET status = 'active', is_verified = TRUE
  WHERE email = 'manager@hostelhub.dev';

UPDATE hostels
  SET verification_status = 'verified',
      is_published = TRUE,
      verified_at = NOW()
  WHERE name IN ('Tarkwa Hostel Haven', 'University Vista Lodge');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hostels_verification ON hostels(verification_status);
CREATE INDEX IF NOT EXISTS idx_hostels_published ON hostels(is_published);
CREATE INDEX IF NOT EXISTS idx_managers_status ON managers(status);
