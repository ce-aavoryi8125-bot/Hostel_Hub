-- ============================================================
-- HOSTEL HUB — PostgreSQL Migration 001: Initial Schema
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ADMINS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  email       TEXT        UNIQUE NOT NULL,
  password    TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'admin',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── MANAGERS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS managers (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  email          TEXT        UNIQUE NOT NULL,
  phone          TEXT        NOT NULL,
  password       TEXT        NOT NULL,
  role           TEXT        NOT NULL DEFAULT 'manager',
  bank_name      TEXT        NOT NULL DEFAULT '',
  account_name   TEXT        NOT NULL DEFAULT '',
  account_number TEXT        NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── STUDENTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  email             TEXT        UNIQUE NOT NULL,
  phone             TEXT        NOT NULL,
  student_id        TEXT        NOT NULL,
  password          TEXT        NOT NULL,
  role              TEXT        NOT NULL DEFAULT 'student',
  manager_id        TEXT        NOT NULL DEFAULT '',
  hostel_id         TEXT        NOT NULL DEFAULT '',
  hostel_name       TEXT        NOT NULL DEFAULT '',
  room_id           TEXT        NOT NULL DEFAULT '',
  room_number       TEXT        NOT NULL DEFAULT '',
  gender            TEXT        NOT NULL DEFAULT '',
  institution       TEXT        NOT NULL DEFAULT '',
  level             TEXT        NOT NULL DEFAULT '',
  emergency_contact TEXT        NOT NULL DEFAULT '',
  balance           NUMERIC     NOT NULL DEFAULT 0,
  status            TEXT        NOT NULL DEFAULT 'Active'
                      CHECK (status IN ('Active', 'Moved Out', 'Pending')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── LOCATIONS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT        UNIQUE NOT NULL,
  category                  TEXT        NOT NULL,
  latitude                  NUMERIC     NOT NULL,
  longitude                 NUMERIC     NOT NULL,
  students_commonly_live_here TEXT      NOT NULL DEFAULT 'Unknown'
                              CHECK (students_commonly_live_here IN ('Yes', 'No', 'Unknown')),
  description               TEXT        NOT NULL DEFAULT '',
  coordinate_confidence     TEXT        NOT NULL DEFAULT 'Estimated',
  source_note               TEXT        NOT NULL DEFAULT '',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── HOSTELS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hostels (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  location_id    UUID        REFERENCES locations(id),
  location       TEXT        NOT NULL,
  address        TEXT        NOT NULL DEFAULT '',
  price_per_year NUMERIC     NOT NULL DEFAULT 0,
  rating         NUMERIC     NOT NULL DEFAULT 4.5,
  maps_url       TEXT        NOT NULL DEFAULT '',
  facilities     TEXT[]      NOT NULL DEFAULT '{}',
  agent_name     TEXT        NOT NULL DEFAULT '',
  agent_phone    TEXT        NOT NULL DEFAULT '',
  agent_email    TEXT        NOT NULL DEFAULT '',
  manager_id     TEXT        NOT NULL DEFAULT '',
  manager_name   TEXT        NOT NULL DEFAULT '',
  manager_phone  TEXT        NOT NULL DEFAULT '',
  manager_email  TEXT        NOT NULL DEFAULT '',
  description    TEXT        NOT NULL DEFAULT '',
  photos         TEXT[]      NOT NULL DEFAULT '{}',
  kitchen_photos TEXT[]      NOT NULL DEFAULT '{}',
  room_types     JSONB       NOT NULL DEFAULT '{}',
  visits         INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ROOMS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id         TEXT        NOT NULL,
  hostel_name       TEXT        NOT NULL DEFAULT '',
  block_name        TEXT        NOT NULL DEFAULT 'Main Block',
  room_number       TEXT        NOT NULL,
  capacity          INTEGER     NOT NULL DEFAULT 1,
  occupied          INTEGER     NOT NULL DEFAULT 0,
  available         INTEGER     NOT NULL DEFAULT 1,
  status            TEXT        NOT NULL DEFAULT 'Available'
                      CHECK (status IN ('Available', 'Occupied', 'Maintenance')),
  assigned_students TEXT[]      NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TRANSACTIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id    TEXT        NOT NULL,
  hostel_id     TEXT        DEFAULT NULL,
  hostel_name   TEXT        NOT NULL DEFAULT 'General Operation',
  type          TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
  amount        NUMERIC     NOT NULL,
  category      TEXT        NOT NULL,
  description   TEXT        NOT NULL,
  student_name  TEXT        NOT NULL DEFAULT '',
  student_email TEXT        NOT NULL DEFAULT '',
  student_id    TEXT        NOT NULL DEFAULT '',
  due_amount    NUMERIC     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id  TEXT        NOT NULL DEFAULT '',
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  type       TEXT        NOT NULL DEFAULT 'General',
  created_by TEXT        NOT NULL DEFAULT 'Manager',
  audience   TEXT        NOT NULL DEFAULT 'All',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── MAINTENANCE REQUESTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   TEXT        NOT NULL DEFAULT '',
  student_name TEXT        NOT NULL DEFAULT '',
  hostel_id    TEXT        NOT NULL DEFAULT '',
  hostel_name  TEXT        NOT NULL DEFAULT '',
  title        TEXT        NOT NULL,
  description  TEXT        NOT NULL,
  category     TEXT        NOT NULL DEFAULT 'General',
  status       TEXT        NOT NULL DEFAULT 'Pending'
                 CHECK (status IN ('Pending', 'In Progress', 'Completed')),
  priority     TEXT        NOT NULL DEFAULT 'Medium',
  notes        TEXT        NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TOUR REQUESTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tour_requests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id   TEXT        NOT NULL,
  hostel_name TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  phone       TEXT        NOT NULL,
  message     TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── VISITS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visits (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  page      TEXT        NOT NULL DEFAULT 'student',
  "user"    TEXT        NOT NULL DEFAULT 'Anonymous Student',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
