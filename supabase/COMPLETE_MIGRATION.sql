-- ============================================================
-- HOSTEL HUB — COMPLETE MIGRATION (Run this FIRST in Supabase)
-- Dashboard → SQL Editor → New Query → Paste ALL → Run
-- This fixes all missing grants, tables, and schema issues.
-- ============================================================

-- ── STEP 1: Grant permissions to PostgREST roles ─────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ── STEP 2: Drop and recreate tables with correct structure ──

-- Payments (no FK on student_id since we use auth.users UUIDs now)
DROP TABLE IF EXISTS payment_submissions CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS hostel_payment_methods CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference           TEXT NOT NULL UNIQUE,
  student_id          UUID,  -- auth.users UUID, no FK constraint
  student_name        TEXT DEFAULT '',
  student_email       TEXT DEFAULT '',
  hostel_id           UUID REFERENCES hostels(id) ON DELETE SET NULL,
  hostel_name         TEXT DEFAULT '',
  room_type           TEXT NOT NULL,
  amount              NUMERIC NOT NULL,
  payment_method      TEXT DEFAULT '',
  status              TEXT DEFAULT 'pending_submission'
                      CHECK (status IN ('pending_submission','pending_verification','pending_more_info','verified','rejected','failed','abandoned')),
  verified            BOOLEAN DEFAULT FALSE,
  metadata            JSONB DEFAULT '{}',
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id          UUID REFERENCES payments(id) ON DELETE SET NULL,
  reference           TEXT NOT NULL UNIQUE,
  student_id          UUID,  -- auth.users UUID
  student_name        TEXT DEFAULT '',
  student_email       TEXT DEFAULT '',
  hostel_id           UUID REFERENCES hostels(id) ON DELETE SET NULL,
  hostel_name         TEXT DEFAULT '',
  manager_id          UUID,  -- auth.users UUID
  room_type           TEXT NOT NULL,
  amount              NUMERIC NOT NULL,
  status              TEXT DEFAULT 'pending_payment'
                      CHECK (status IN ('pending_payment','pending_verification','pending_more_info','confirmed','rejected','cancelled')),
  check_in_date       DATE,
  notes               TEXT DEFAULT '',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hostel_payment_methods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id       UUID REFERENCES hostels(id) ON DELETE CASCADE,
  payment_type    TEXT NOT NULL,
  account_name    TEXT NOT NULL,
  account_number  TEXT NOT NULL,
  bank_name       TEXT DEFAULT '',
  branch          TEXT DEFAULT '',
  qr_code         TEXT DEFAULT '',
  instructions    TEXT DEFAULT '',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_submissions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_reference      TEXT NOT NULL UNIQUE,
  payment_id                UUID REFERENCES payments(id) ON DELETE SET NULL,
  booking_id                UUID REFERENCES bookings(id) ON DELETE SET NULL,
  student_id                UUID,
  student_name              TEXT DEFAULT '',
  student_email             TEXT DEFAULT '',
  hostel_id                 UUID REFERENCES hostels(id) ON DELETE SET NULL,
  hostel_name               TEXT DEFAULT '',
  room_type                 TEXT DEFAULT '',
  amount                    NUMERIC NOT NULL,
  payment_method_id         UUID REFERENCES hostel_payment_methods(id) ON DELETE SET NULL,
  payment_method_name       TEXT DEFAULT '',
  transaction_reference     TEXT NOT NULL,
  paid_at                   TIMESTAMPTZ,
  notes                     TEXT DEFAULT '',
  receipt_file_url          TEXT DEFAULT '',
  receipt_file_name         TEXT DEFAULT '',
  status                    TEXT DEFAULT 'submitted'
                            CHECK (status IN ('submitted','approved','rejected','request_more_info')),
  verified_by               UUID,
  verification_notes        TEXT DEFAULT '',
  reviewed_at               TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE receipts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number        TEXT NOT NULL UNIQUE,
  student_id            UUID,
  student_name          TEXT DEFAULT '',
  hostel_id             UUID REFERENCES hostels(id) ON DELETE SET NULL,
  hostel_name           TEXT DEFAULT '',
  room_type             TEXT DEFAULT '',
  academic_year         TEXT DEFAULT '',
  amount_paid           NUMERIC NOT NULL,
  payment_method        TEXT DEFAULT '',
  transaction_reference TEXT DEFAULT '',
  verified_at           TIMESTAMPTZ,
  manager_confirmation  TEXT DEFAULT '',
  manager_id            UUID,
  file_url              TEXT DEFAULT '',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,  -- auth.users UUID (student or manager)
  student_id  UUID,  -- kept for backward compat
  manager_id  UUID,  -- kept for backward compat
  hostel_id   UUID REFERENCES hostels(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT DEFAULT 'info',
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── STEP 3: New auth profile tables ─────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id          UUID PRIMARY KEY,  -- matches auth.users.id
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

CREATE TABLE IF NOT EXISTS student_profiles (
  id                UUID PRIMARY KEY,
  student_index     TEXT DEFAULT '',
  institution       TEXT DEFAULT 'UMaT',
  faculty           TEXT DEFAULT '',
  department        TEXT DEFAULT '',
  level             TEXT DEFAULT '',
  gender            TEXT DEFAULT '',
  programme         TEXT DEFAULT '',
  emergency_contact TEXT DEFAULT '',
  hostel_id         UUID REFERENCES hostels(id) ON DELETE SET NULL,
  hostel_name       TEXT DEFAULT '',
  room_number       TEXT DEFAULT '',
  balance           NUMERIC DEFAULT 0,
  profile_complete  BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manager_profiles (
  id                          UUID PRIMARY KEY,
  phone                       TEXT DEFAULT '',
  national_id                 TEXT DEFAULT '',
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
  reviewed_by                 UUID,
  reviewed_at                 TIMESTAMPTZ,
  rejection_reason            TEXT DEFAULT '',
  is_verified                 BOOLEAN DEFAULT FALSE,
  assigned_hostel_id          UUID REFERENCES hostels(id) ON DELETE SET NULL,
  bank_name                   TEXT DEFAULT '',
  account_name                TEXT DEFAULT '',
  account_number              TEXT DEFAULT '',
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ── STEP 4: Admin audit log ──────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID,
  admin_name  TEXT DEFAULT '',
  action      TEXT NOT NULL,
  entity_type TEXT DEFAULT '',
  entity_id   TEXT DEFAULT '',
  entity_name TEXT DEFAULT '',
  details     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hostel_verification_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id    UUID REFERENCES hostels(id) ON DELETE CASCADE,
  hostel_name  TEXT DEFAULT '',
  action       TEXT NOT NULL,
  old_status   TEXT DEFAULT '',
  new_status   TEXT DEFAULT '',
  performed_by UUID,
  admin_name   TEXT DEFAULT '',
  notes        TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT DEFAULT 'info',
  audience   TEXT DEFAULT 'all',
  is_active  BOOLEAN DEFAULT TRUE,
  created_by UUID,
  admin_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manager_application_docs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID,
  doc_type   TEXT NOT NULL,
  file_url   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── STEP 5: Tour requests upgrade ────────────────────────────
ALTER TABLE tour_requests
  ADD COLUMN IF NOT EXISTS student_id UUID,
  ADD COLUMN IF NOT EXISTS preferred_date DATE,
  ADD COLUMN IF NOT EXISTS preferred_time TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','rescheduled','completed')),
  ADD COLUMN IF NOT EXISTS manager_notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- ── STEP 6: Hostel columns ────────────────────────────────────
ALTER TABLE hostels
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rules TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS hostel_logo TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gender_policy TEXT DEFAULT 'Mixed'
    CHECK (gender_policy IN ('Male','Female','Mixed'));

-- ── STEP 7: Announcements ─────────────────────────────────────
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ── STEP 8: Fix hostel manager_id FK ─────────────────────────
-- Drop old FK that references managers table (not auth.users)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='hostels' AND constraint_name='hostels_manager_id_fkey') THEN
    ALTER TABLE hostels DROP CONSTRAINT hostels_manager_id_fkey;
  END IF;
END $$;

-- ── STEP 9: Indexes ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_student     ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_hostel      ON payments(hostel_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference   ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_bookings_student     ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hostel      ON bookings(hostel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_manager     ON bookings(manager_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role   ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_hostels_verification ON hostels(verification_status);
CREATE INDEX IF NOT EXISTS idx_hostels_published    ON hostels(is_published);

-- ── STEP 10: Grant all new tables ────────────────────────────
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ── STEP 11: Activate existing hostels ───────────────────────
UPDATE hostels
  SET verification_status = 'verified', is_published = TRUE, verified_at = NOW()
  WHERE name IN ('Tarkwa Hostel Haven','University Vista Lodge','Gold Belt','Gold Belt Hostel');

-- Update demo manager status
UPDATE managers SET status = 'active', is_verified = TRUE WHERE email = 'manager@hostelhub.dev'
  AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='managers' AND column_name='status');

-- ── STEP 12: Triggers ─────────────────────────────────────────
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'payments','bookings','hostel_payment_methods','payment_submissions',
    'receipts','notifications','user_profiles','student_profiles',
    'manager_profiles','platform_announcements','tour_requests'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;
       CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      t, t, t, t
    );
  END LOOP;
END $$;
