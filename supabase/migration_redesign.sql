-- ============================================================
-- HOSTEL HUB — Migration: Complete Platform Redesign
-- Run in Supabase SQL Editor
-- ============================================================

-- Add manager application status columns
ALTER TABLE managers
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','rejected','suspended')),
  ADD COLUMN IF NOT EXISTS national_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS hostel_name_applied TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS hostel_location_applied TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS hostel_description_applied TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS num_rooms_applied INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS application_notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT '';

-- Add verification status and published flag to hostels
ALTER TABLE hostels
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending','under_review','verified','rejected','suspended')),
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '{}';

-- Manager application documents
CREATE TABLE IF NOT EXISTS manager_application_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES managers(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hostel verification audit log
CREATE TABLE IF NOT EXISTS hostel_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE,
  hostel_name TEXT DEFAULT '',
  action TEXT NOT NULL,
  old_status TEXT DEFAULT '',
  new_status TEXT DEFAULT '',
  performed_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  admin_name TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin audit log
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  admin_name TEXT DEFAULT '',
  action TEXT NOT NULL,
  entity_type TEXT DEFAULT '',
  entity_id TEXT DEFAULT '',
  entity_name TEXT DEFAULT '',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform announcements (admin-level, site-wide)
CREATE TABLE IF NOT EXISTS platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info','warning','success','urgent')),
  audience TEXT DEFAULT 'all' CHECK (audience IN ('all','students','managers')),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  admin_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update trigger for new tables
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['platform_announcements']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;
       CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      t, t, t, t
    );
  END LOOP;
END $$;
