-- ============================================================
-- HOSTEL HUB / BRAINIAC HAVEN — FULL COMMERCIAL MIGRATION (v3.1)
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. LOCATIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT NOT NULL UNIQUE,
  category                    TEXT NOT NULL DEFAULT 'Neighborhood',
  latitude                    NUMERIC(10,6) DEFAULT 5.2974,
  longitude                   NUMERIC(10,6) DEFAULT -1.9968,
  students_commonly_live_here TEXT DEFAULT 'Yes',
  description                 TEXT DEFAULT '',
  coordinate_confidence       TEXT DEFAULT 'Estimated',
  source_note                 TEXT DEFAULT 'UMaT Campus Vicinity',
  institution_id              TEXT DEFAULT 'UMaT',
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed UMaT Tarkwa locations if missing
INSERT INTO locations (name, category, description) VALUES
  ('Banso', 'Popular Neighborhood', 'Located near UMaT main gate'),
  ('Tarkwa Station', 'Commercial Center', 'Central hub with direct transport to campus'),
  ('Tamso', 'Neighborhood', 'Quiet student area near Tarkwa-Bogoso road'),
  ('Akoon', 'Mining & Student Area', 'Close to UMaT Mines campus'),
  ('Bankyim', 'Residential Hub', 'High density student hostel zone'),
  ('New Atuabo', 'Modern Residential', 'Premium hostels with quiet surroundings'),
  ('Cyanide', 'Student Hub', 'Walking distance to main lecture halls'),
  ('Nsuaem', 'Suburban Area', 'Affordable student accommodation'),
  ('Aboso', 'Outskirts', 'Spacious compound hostels'),
  ('Mile 7', 'Suburban', 'Serene student residential community')
ON CONFLICT (name) DO NOTHING;

-- ── 2. USER PROFILES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id             UUID PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'manager', 'admin', 'super_admin')),
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'deactivated', 'rejected')),
  phone          TEXT DEFAULT '',
  is_super_admin BOOLEAN DEFAULT FALSE,
  permissions    JSONB DEFAULT '{"manage_hostels":true,"manage_managers":true,"manage_students":true,"manage_bookings":true,"manage_tours":true,"manage_payments":true,"view_analytics":true,"system_settings":true}',
  avatar_url     TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. STUDENT PROFILES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_profiles (
  id                  UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  student_index       TEXT DEFAULT '',
  institution         TEXT DEFAULT 'UMaT',
  faculty             TEXT DEFAULT '',
  department          TEXT DEFAULT '',
  programme           TEXT DEFAULT '',
  level               TEXT DEFAULT '100',
  gender              TEXT DEFAULT '',
  emergency_contact   TEXT DEFAULT '',
  profile_photo       TEXT DEFAULT '',
  preferred_room_type TEXT DEFAULT '1_in_room',
  current_hostel_id   UUID,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. MANAGER PROFILES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS manager_profiles (
  id                         UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  phone                      TEXT DEFAULT '',
  hostel_name_applied        TEXT DEFAULT '',
  hostel_location_applied    TEXT DEFAULT '',
  hostel_address_applied     TEXT DEFAULT '',
  hostel_description_applied TEXT DEFAULT '',
  gps_location_applied       TEXT DEFAULT '',
  num_rooms_applied          INTEGER DEFAULT 0,
  capacity_applied           INTEGER DEFAULT 0,
  room_types_applied         JSONB DEFAULT '[]',
  payment_methods_applied    TEXT DEFAULT '',
  application_notes          TEXT DEFAULT '',
  bank_name                  TEXT DEFAULT '',
  account_name               TEXT DEFAULT '',
  account_number             TEXT DEFAULT '',
  assigned_hostel_id         UUID,
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. HOSTELS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hostels (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  location_id          UUID REFERENCES locations(id) ON DELETE SET NULL,
  location             TEXT NOT NULL,
  address              TEXT DEFAULT '',
  price_per_year       NUMERIC DEFAULT 0,
  rating               NUMERIC DEFAULT 4.8,
  maps_url             TEXT DEFAULT '',
  description          TEXT DEFAULT '',
  rules                TEXT DEFAULT '',
  verification_status  TEXT DEFAULT 'pending_verification' CHECK (verification_status IN ('pending_verification', 'verified', 'featured', 'premium_partner', 'rejected')),
  is_published         BOOLEAN DEFAULT TRUE,
  verified_at          TIMESTAMPTZ,
  verified_by          UUID,
  verification_notes   TEXT DEFAULT '',
  rejection_reason     TEXT DEFAULT '',
  distance_km          NUMERIC(4,2) DEFAULT 1.2,
  gender_preference    TEXT DEFAULT 'Co-ed' CHECK (gender_preference IN ('Co-ed', 'Male-only', 'Female-only')),
  landmarks            TEXT[] DEFAULT '{}',
  facilities           TEXT[] DEFAULT '{}',
  services             TEXT[] DEFAULT '{}',
  manager_id           UUID,
  manager_name         TEXT DEFAULT '',
  manager_phone        TEXT DEFAULT '',
  manager_email        TEXT DEFAULT '',
  agent_name           TEXT DEFAULT '',
  agent_phone          TEXT DEFAULT '',
  agent_email          TEXT DEFAULT '',
  hostel_logo          TEXT DEFAULT '',
  -- Categorized Galleries
  gallery_exterior     TEXT[] DEFAULT '{}',
  gallery_front_view   TEXT[] DEFAULT '{}',
  gallery_compound     TEXT[] DEFAULT '{}',
  gallery_entrance     TEXT[] DEFAULT '{}',
  gallery_rooms        JSONB DEFAULT '{"1_in_room":[], "2_in_room":[], "3_in_room":[], "4_in_room":[]}',
  gallery_kitchen      TEXT[] DEFAULT '{}',
  gallery_washroom     TEXT[] DEFAULT '{}',
  gallery_bathroom     TEXT[] DEFAULT '{}',
  gallery_study_room   TEXT[] DEFAULT '{}',
  gallery_reading_area TEXT[] DEFAULT '{}',
  gallery_tv_room      TEXT[] DEFAULT '{}',
  gallery_common_area  TEXT[] DEFAULT '{}',
  gallery_drying_line  TEXT[] DEFAULT '{}',
  gallery_water_storage TEXT[] DEFAULT '{}',
  gallery_generator    TEXT[] DEFAULT '{}',
  gallery_parking      TEXT[] DEFAULT '{}',
  gallery_security     TEXT[] DEFAULT '{}',
  room_types           JSONB DEFAULT '{}',
  visits               INTEGER DEFAULT 0,
  institution_id       TEXT DEFAULT 'UMaT',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. BOOKINGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference           TEXT NOT NULL UNIQUE,
  payment_id          UUID,
  student_id          UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  student_name        TEXT DEFAULT '',
  student_email       TEXT DEFAULT '',
  hostel_id           UUID REFERENCES hostels(id) ON DELETE CASCADE,
  hostel_name         TEXT DEFAULT '',
  manager_id          UUID,
  room_type           TEXT NOT NULL,
  amount              NUMERIC NOT NULL,
  status              TEXT DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'pending_verification', 'confirmed', 'rejected', 'cancelled')),
  check_in_date       DATE,
  move_in_date        DATE,
  notes               TEXT DEFAULT '',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. PAYMENTS & SUBMISSIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference           TEXT NOT NULL UNIQUE,
  student_id          UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  student_name        TEXT DEFAULT '',
  student_email       TEXT NOT NULL,
  hostel_id           UUID REFERENCES hostels(id) ON DELETE CASCADE,
  hostel_name         TEXT DEFAULT '',
  room_type           TEXT NOT NULL,
  amount              NUMERIC NOT NULL,
  currency            TEXT DEFAULT 'GHS',
  payment_method      TEXT DEFAULT 'mobile_money',
  status              TEXT DEFAULT 'pending_submission' CHECK (status IN ('pending_submission', 'pending_verification', 'verified', 'rejected', 'failed')),
  verified            BOOLEAN DEFAULT FALSE,
  metadata            JSONB DEFAULT '{}',
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_submissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_reference  TEXT NOT NULL UNIQUE,
  payment_id            UUID REFERENCES payments(id) ON DELETE CASCADE,
  booking_id            UUID REFERENCES bookings(id) ON DELETE CASCADE,
  student_id            UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  student_name          TEXT DEFAULT '',
  student_email         TEXT DEFAULT '',
  hostel_id             UUID REFERENCES hostels(id) ON DELETE CASCADE,
  hostel_name           TEXT DEFAULT '',
  room_type             TEXT DEFAULT '',
  amount                NUMERIC NOT NULL,
  payment_method_id     UUID,
  payment_method_name   TEXT DEFAULT 'Mobile Money Transfer',
  transaction_reference TEXT NOT NULL,
  paid_at               TIMESTAMPTZ,
  notes                 TEXT DEFAULT '',
  receipt_file_url      TEXT DEFAULT '',
  receipt_file_name     TEXT DEFAULT '',
  status                TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected', 'request_more_info')),
  verified_by           UUID,
  verification_notes    TEXT DEFAULT '',
  reviewed_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. RECEIPTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number        TEXT NOT NULL UNIQUE,
  payment_id            UUID REFERENCES payments(id) ON DELETE SET NULL,
  booking_id            UUID REFERENCES bookings(id) ON DELETE SET NULL,
  student_id            UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  student_name          TEXT DEFAULT '',
  hostel_id             UUID REFERENCES hostels(id) ON DELETE CASCADE,
  hostel_name           TEXT DEFAULT '',
  room_type             TEXT DEFAULT '',
  academic_year         TEXT DEFAULT '2026/2027',
  amount_paid           NUMERIC NOT NULL,
  payment_method        TEXT DEFAULT 'Mobile Money',
  transaction_reference TEXT DEFAULT '',
  verified_at           TIMESTAMPTZ DEFAULT NOW(),
  manager_id            UUID,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── 9. TOUR REQUESTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tour_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id         UUID REFERENCES hostels(id) ON DELETE CASCADE,
  hostel_name       TEXT NOT NULL,
  manager_id        UUID,
  student_id        UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  phone             TEXT NOT NULL,
  preferred_date    DATE,
  preferred_time    TEXT DEFAULT 'Morning (10:00 AM)',
  special_notes     TEXT DEFAULT '',
  fee_amount        NUMERIC DEFAULT 0,
  fee_paid          BOOLEAN DEFAULT FALSE,
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'rescheduled')),
  rescheduled_date  DATE,
  rescheduled_time  TEXT DEFAULT '',
  admin_notes       TEXT DEFAULT '',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── 10. MAINTENANCE REQUESTS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  student_name     TEXT DEFAULT '',
  hostel_id        UUID REFERENCES hostels(id) ON DELETE CASCADE,
  hostel_name      TEXT DEFAULT '',
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  category         TEXT DEFAULT 'General',
  priority         TEXT DEFAULT 'Medium',
  status           TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Assigned', 'In Progress', 'Completed', 'Rejected')),
  photo_before_url TEXT DEFAULT '',
  photo_after_url  TEXT DEFAULT '',
  assigned_to      TEXT DEFAULT '',
  notes            TEXT DEFAULT '',
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 11. NOTIFICATIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  student_id  UUID,
  manager_id  UUID,
  hostel_id   UUID,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'danger')),
  read        BOOLEAN DEFAULT FALSE,
  entity_type TEXT DEFAULT '',
  entity_id   TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 12. SYSTEM ERROR LOGS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_error_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp       TIMESTAMPTZ DEFAULT NOW(),
  level           TEXT DEFAULT 'error' CHECK (level IN ('critical', 'error', 'warn', 'info')),
  source          TEXT DEFAULT 'api',
  message         TEXT NOT NULL,
  stack_trace     TEXT DEFAULT '',
  user_id         UUID,
  ip_address      TEXT DEFAULT '',
  endpoint        TEXT DEFAULT '',
  request_payload JSONB DEFAULT '{}',
  resolved        BOOLEAN DEFAULT FALSE,
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID
);

-- ── 13. AUDIT TRAIL ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_trail (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp   TIMESTAMPTZ DEFAULT NOW(),
  user_id     UUID,
  user_name   TEXT DEFAULT '',
  user_role   TEXT DEFAULT '',
  ip_address  TEXT DEFAULT '',
  action      TEXT NOT NULL,
  entity_type TEXT DEFAULT '',
  entity_id   TEXT DEFAULT '',
  entity_name TEXT DEFAULT '',
  details     JSONB DEFAULT '{}'
);

-- ── 14. SAVED HOSTELS & RECENT SEARCHES ───────────────────────
CREATE TABLE IF NOT EXISTS saved_hostels (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  hostel_id  UUID REFERENCES hostels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, hostel_id)
);

CREATE TABLE IF NOT EXISTS recent_searches (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  search_query   TEXT DEFAULT '',
  search_filters JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES FOR MAXIMUM QUERY SPEED ──────────────────────────
CREATE INDEX IF NOT EXISTS idx_hostels_location     ON hostels(location);
CREATE INDEX IF NOT EXISTS idx_hostels_status       ON hostels(verification_status);
CREATE INDEX IF NOT EXISTS idx_hostels_price        ON hostels(price_per_year);
CREATE INDEX IF NOT EXISTS idx_bookings_student     ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hostel      ON bookings(hostel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status      ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_tours_student        ON tour_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_tours_hostel         ON tour_requests(hostel_id);
CREATE INDEX IF NOT EXISTS idx_maint_student        ON maintenance_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_maint_hostel         ON maintenance_requests(hostel_id);
CREATE INDEX IF NOT EXISTS idx_notif_user           ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp      ON audit_trail(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_timestamp      ON system_error_logs(timestamp DESC);

-- ── AUTO-UPDATE TRIGGER FUNCTION ─────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers across all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'locations', 'user_profiles', 'student_profiles', 'manager_profiles',
    'hostels', 'bookings', 'payments', 'payment_submissions', 'receipts',
    'tour_requests', 'maintenance_requests'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;
       CREATE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;

-- ── 15. SEED DATA & SUPER ADMIN VERIFICATION ─────────────────
-- Note: Super Admin credentials ce-aavoryi8125@st.umat.edu.gh / ce-Aavoryi8125
-- are synced automatically by backend auth provisioner.
