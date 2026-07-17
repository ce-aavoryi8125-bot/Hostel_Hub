-- ============================================================
-- HOSTEL HUB — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────
-- LOCATIONS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT NOT NULL UNIQUE,
  category                  TEXT NOT NULL,
  latitude                  NUMERIC(10,6) NOT NULL,
  longitude                 NUMERIC(10,6) NOT NULL,
  students_commonly_live_here TEXT DEFAULT 'Unknown' CHECK (students_commonly_live_here IN ('Yes','No','Unknown')),
  description               TEXT DEFAULT '',
  coordinate_confidence     TEXT DEFAULT 'Estimated',
  source_note               TEXT DEFAULT '',
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- ADMINS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  role       TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- MANAGERS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS managers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  phone          TEXT NOT NULL,
  password       TEXT NOT NULL,
  role           TEXT DEFAULT 'manager',
  bank_name      TEXT DEFAULT '',
  account_name   TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- HOSTELS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hostels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  location_id     UUID REFERENCES locations(id) ON DELETE SET NULL,
  location        TEXT NOT NULL,
  address         TEXT DEFAULT '',
  price_per_year  NUMERIC DEFAULT 0,
  rating          NUMERIC DEFAULT 4.5,
  maps_url        TEXT DEFAULT '',
  facilities      TEXT[] DEFAULT '{}',
  agent_name      TEXT DEFAULT '',
  agent_phone     TEXT DEFAULT '',
  agent_email     TEXT DEFAULT '',
  manager_id      UUID REFERENCES managers(id) ON DELETE SET NULL,
  manager_name    TEXT DEFAULT '',
  manager_phone   TEXT DEFAULT '',
  manager_email   TEXT DEFAULT '',
  description     TEXT DEFAULT '',
  photos          TEXT[] DEFAULT '{}',
  kitchen_photos  TEXT[] DEFAULT '{}',
  room_types      JSONB DEFAULT '{}',
  visits          INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- STUDENTS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  phone             TEXT NOT NULL,
  student_id        TEXT NOT NULL,
  password          TEXT NOT NULL,
  role              TEXT DEFAULT 'student',
  manager_id        UUID REFERENCES managers(id) ON DELETE SET NULL,
  hostel_id         UUID REFERENCES hostels(id) ON DELETE SET NULL,
  hostel_name       TEXT DEFAULT '',
  room_id           UUID,
  room_number       TEXT DEFAULT '',
  gender            TEXT DEFAULT '',
  institution       TEXT DEFAULT '',
  level             TEXT DEFAULT '',
  emergency_contact TEXT DEFAULT '',
  balance           NUMERIC DEFAULT 0,
  status            TEXT DEFAULT 'Active' CHECK (status IN ('Active','Moved Out','Pending')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- ROOMS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id         UUID REFERENCES hostels(id) ON DELETE CASCADE,
  hostel_name       TEXT DEFAULT '',
  block_name        TEXT DEFAULT 'Main Block',
  room_number       TEXT NOT NULL,
  capacity          INTEGER NOT NULL DEFAULT 1,
  occupied          INTEGER DEFAULT 0,
  available         INTEGER DEFAULT 1,
  status            TEXT DEFAULT 'Available' CHECK (status IN ('Available','Occupied','Maintenance')),
  assigned_students TEXT[] DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- TRANSACTIONS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id    UUID REFERENCES managers(id) ON DELETE CASCADE,
  hostel_id     UUID REFERENCES hostels(id) ON DELETE SET NULL,
  hostel_name   TEXT DEFAULT 'General Operation',
  type          TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount        NUMERIC NOT NULL,
  category      TEXT NOT NULL,
  description   TEXT NOT NULL,
  student_name  TEXT DEFAULT '',
  student_email TEXT DEFAULT '',
  student_id    TEXT DEFAULT '',
  due_amount    NUMERIC DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- PAYMENTS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference           TEXT NOT NULL UNIQUE,
  paystack_reference  TEXT DEFAULT '',
  student_id          UUID REFERENCES students(id) ON DELETE SET NULL,
  student_name        TEXT DEFAULT '',
  student_email       TEXT NOT NULL,
  hostel_id           UUID REFERENCES hostels(id) ON DELETE SET NULL,
  hostel_name         TEXT DEFAULT '',
  room_type           TEXT NOT NULL,
  amount              NUMERIC NOT NULL,
  amount_kobo         BIGINT DEFAULT 0,
  currency            TEXT DEFAULT 'GHS',
  payment_method      TEXT DEFAULT '',
  channel             TEXT DEFAULT '',
  status              TEXT DEFAULT 'pending_submission'
                      CHECK (status IN ('pending_submission','pending_verification','pending_more_info','verified','rejected','failed','abandoned')),
  verified            BOOLEAN DEFAULT FALSE,
  metadata            JSONB DEFAULT '{}',
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- BOOKINGS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id          UUID REFERENCES payments(id) ON DELETE SET NULL,
  reference           TEXT NOT NULL UNIQUE,
  student_id          UUID REFERENCES students(id) ON DELETE SET NULL,
  student_name        TEXT DEFAULT '',
  student_email       TEXT DEFAULT '',
  hostel_id           UUID REFERENCES hostels(id) ON DELETE SET NULL,
  hostel_name         TEXT DEFAULT '',
  manager_id          UUID REFERENCES managers(id) ON DELETE SET NULL,
  room_type           TEXT NOT NULL,
  amount              NUMERIC NOT NULL,
  status              TEXT DEFAULT 'pending_payment'
                      CHECK (status IN ('pending_payment','pending_verification','pending_more_info','confirmed','rejected','cancelled')),
  check_in_date       DATE,
  notes               TEXT DEFAULT '',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- HOSTEL PAYMENT METHODS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hostel_payment_methods (
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

-- ──────────────────────────────────────────────
-- PAYMENT SUBMISSIONS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_submissions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_reference      TEXT NOT NULL UNIQUE,
  payment_id                UUID REFERENCES payments(id) ON DELETE SET NULL,
  booking_id                UUID REFERENCES bookings(id) ON DELETE SET NULL,
  student_id                UUID REFERENCES students(id) ON DELETE SET NULL,
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
  verified_by               UUID REFERENCES managers(id) ON DELETE SET NULL,
  verification_notes        TEXT DEFAULT '',
  reviewed_at               TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- RECEIPTS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number        TEXT NOT NULL UNIQUE,
  student_id            UUID REFERENCES students(id) ON DELETE SET NULL,
  student_name          TEXT DEFAULT '',
  hostel_id             UUID REFERENCES hostels(id) ON DELETE SET NULL,
  hostel_name           TEXT DEFAULT '',
  room_type             TEXT DEFAULT '',
  academic_year         TEXT DEFAULT '',
  amount_paid            NUMERIC NOT NULL,
  payment_method        TEXT DEFAULT '',
  transaction_reference TEXT DEFAULT '',
  verified_at           TIMESTAMPTZ,
  manager_confirmation  TEXT DEFAULT '',
  manager_id            UUID REFERENCES managers(id) ON DELETE SET NULL,
  file_url              TEXT DEFAULT '',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- HOSTEL DOCUMENTS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hostel_documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id      UUID REFERENCES hostels(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  document_type  TEXT NOT NULL,
  description    TEXT DEFAULT '',
  file_url       TEXT NOT NULL,
  file_type      TEXT DEFAULT 'file',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- STUDENT AGREEMENTS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_agreements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            UUID REFERENCES students(id) ON DELETE SET NULL,
  student_name          TEXT DEFAULT '',
  hostel_id             UUID REFERENCES hostels(id) ON DELETE SET NULL,
  hostel_name           TEXT DEFAULT '',
  room_type             TEXT DEFAULT '',
  agreement_version     TEXT DEFAULT 'v1',
  rules_reviewed        BOOLEAN DEFAULT FALSE,
  terms_accepted        BOOLEAN DEFAULT FALSE,
  digital_signature     TEXT DEFAULT '',
  signed_at             TIMESTAMPTZ,
  document_url          TEXT DEFAULT '',
  notes                 TEXT DEFAULT '',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- NOTIFICATIONS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES students(id) ON DELETE SET NULL,
  manager_id  UUID REFERENCES managers(id) ON DELETE SET NULL,
  hostel_id   UUID REFERENCES hostels(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT DEFAULT 'info',
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- ANNOUNCEMENTS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id  UUID REFERENCES hostels(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT DEFAULT 'General',
  created_by TEXT DEFAULT 'Manager',
  audience   TEXT DEFAULT 'All',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- MAINTENANCE REQUESTS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID REFERENCES students(id) ON DELETE SET NULL,
  student_name TEXT DEFAULT '',
  hostel_id    UUID REFERENCES hostels(id) ON DELETE SET NULL,
  hostel_name  TEXT DEFAULT '',
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  category     TEXT DEFAULT 'General',
  status       TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','In Progress','Completed')),
  priority     TEXT DEFAULT 'Medium',
  notes        TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- TOUR REQUESTS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tour_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id   UUID REFERENCES hostels(id) ON DELETE CASCADE,
  hostel_name TEXT NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  message     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- VISITS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page       TEXT DEFAULT 'student',
  "user"     TEXT DEFAULT 'Anonymous Student',
  timestamp  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- updated_at auto-update trigger
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'locations','admins','managers','hostels','students',
    'rooms','transactions','payments','bookings','hostel_payment_methods',
    'payment_submissions','receipts','hostel_documents','student_agreements',
    'notifications','announcements','maintenance_requests','tour_requests'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;
       CREATE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      t, t, t, t
    );
  END LOOP;
END $$;
