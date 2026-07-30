-- ============================================================
-- HOSTEL HUB — Supabase Auth Migration
-- Run this in Supabase SQL Editor BEFORE starting the server
-- Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ── 1. USER PROFILES TABLE ────────────────────────────────
-- Links auth.users to application roles and status
CREATE TABLE IF NOT EXISTS user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'student'
              CHECK (role IN ('student', 'manager', 'admin')),
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'pending', 'rejected', 'suspended')),
  phone       TEXT DEFAULT '',
  avatar_url  TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. STUDENT PROFILES TABLE ─────────────────────────────
CREATE TABLE IF NOT EXISTS student_profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_index     TEXT DEFAULT '',
  institution       TEXT DEFAULT 'UMaT',
  faculty           TEXT DEFAULT '',
  department        TEXT DEFAULT '',
  level             TEXT DEFAULT '',
  gender            TEXT DEFAULT '',
  emergency_contact TEXT DEFAULT '',
  hostel_id         UUID REFERENCES hostels(id) ON DELETE SET NULL,
  hostel_name       TEXT DEFAULT '',
  room_number       TEXT DEFAULT '',
  balance           NUMERIC DEFAULT 0,
  profile_complete  BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. MANAGER PROFILES TABLE ─────────────────────────────
CREATE TABLE IF NOT EXISTS manager_profiles (
  id                          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone                       TEXT DEFAULT '',
  national_id                 TEXT DEFAULT '',
  -- Application info
  hostel_name_applied         TEXT DEFAULT '',
  hostel_location_applied     TEXT DEFAULT '',
  hostel_description_applied  TEXT DEFAULT '',
  hostel_address_applied      TEXT DEFAULT '',
  gps_location_applied        TEXT DEFAULT '',
  num_rooms_applied           INTEGER DEFAULT 0,
  capacity_applied            INTEGER DEFAULT 0,
  room_types_applied          TEXT[] DEFAULT '{}',
  payment_methods_applied     TEXT DEFAULT '',
  application_notes           TEXT DEFAULT '',
  -- Review
  reviewed_by                 UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at                 TIMESTAMPTZ,
  rejection_reason            TEXT DEFAULT '',
  is_verified                 BOOLEAN DEFAULT FALSE,
  -- Assigned hostel (set by admin after approval)
  assigned_hostel_id          UUID REFERENCES hostels(id) ON DELETE SET NULL,
  -- Bank details
  bank_name                   TEXT DEFAULT '',
  account_name                TEXT DEFAULT '',
  account_number              TEXT DEFAULT '',
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. MANAGER APPLICATION DOCS ───────────────────────────
CREATE TABLE IF NOT EXISTS manager_application_docs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type   TEXT NOT NULL,
  file_url   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. ADMIN AUDIT LOG ────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_name  TEXT DEFAULT '',
  action      TEXT NOT NULL,
  entity_type TEXT DEFAULT '',
  entity_id   TEXT DEFAULT '',
  entity_name TEXT DEFAULT '',
  details     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. HOSTEL VERIFICATION LOG ────────────────────────────
CREATE TABLE IF NOT EXISTS hostel_verification_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id    UUID REFERENCES hostels(id) ON DELETE CASCADE,
  hostel_name  TEXT DEFAULT '',
  action       TEXT NOT NULL,
  old_status   TEXT DEFAULT '',
  new_status   TEXT DEFAULT '',
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_name   TEXT DEFAULT '',
  notes        TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. PLATFORM ANNOUNCEMENTS ─────────────────────────────
CREATE TABLE IF NOT EXISTS platform_announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT DEFAULT 'info' CHECK (type IN ('info','warning','success','urgent')),
  audience   TEXT DEFAULT 'all'  CHECK (audience IN ('all','students','managers')),
  is_active  BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. ADD MISSING COLUMNS TO EXISTING TABLES ─────────────

ALTER TABLE hostels
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_published         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_notes   TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS rejection_reason     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS gallery              JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rules                TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS hostel_logo          TEXT DEFAULT '';

-- ── Drop legacy FK on hostels.manager_id so Supabase Auth UUIDs work ──
-- The old schema had manager_id as TEXT with no FK, but it may have been
-- altered to reference the legacy managers table. Drop that constraint.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'hostels'
      AND constraint_name = 'hostels_manager_id_fkey'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE hostels DROP CONSTRAINT hostels_manager_id_fkey;
    RAISE NOTICE 'Dropped hostels_manager_id_fkey';
  END IF;
END $$;

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ── 9. INDEXES ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_profiles_role     ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status   ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_hostels_verification   ON hostels(verification_status);
CREATE INDEX IF NOT EXISTS idx_hostels_published      ON hostels(is_published);
CREATE INDEX IF NOT EXISTS idx_manager_profiles_hostel ON manager_profiles(assigned_hostel_id);

-- ── 10. AUTO-UPDATED-AT TRIGGERS ─────────────────────────
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['user_profiles','student_profiles','manager_profiles','platform_announcements']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;
       CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      t, t, t, t
    );
  END LOOP;
END $$;

-- ── 11. ACTIVATE EXISTING SEEDED HOSTELS ─────────────────
UPDATE hostels
  SET verification_status = 'verified',
      is_published = TRUE,
      verified_at = NOW()
  WHERE verification_status IS NULL
     OR verification_status = 'pending';

-- ── 12. RLS POLICIES (Basic — expand as needed) ───────────
ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_profiles   ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "own_profile_read" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "own_profile_update" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Student profiles
CREATE POLICY "own_student_profile_read" ON student_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "own_student_profile_write" ON student_profiles
  FOR ALL USING (auth.uid() = id);

-- Manager profiles
CREATE POLICY "own_manager_profile_read" ON manager_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "own_manager_profile_write" ON manager_profiles
  FOR ALL USING (auth.uid() = id);

-- NOTE: Backend uses service role key which bypasses all RLS.
-- These policies protect direct client-side queries if you add them later.
