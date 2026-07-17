-- ============================================================
-- HOSTEL HUB — Payments Migration
-- Run in Supabase SQL Editor after schema.sql
-- ============================================================

-- ── PAYMENTS ──────────────────────────────────────────────
-- Every Paystack-initiated payment attempt
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference           TEXT NOT NULL UNIQUE,          -- our internal ref e.g. HH-1234567890
  paystack_reference  TEXT DEFAULT '',               -- Paystack's own reference
  student_id          UUID REFERENCES students(id) ON DELETE SET NULL,
  student_name        TEXT DEFAULT '',
  student_email       TEXT NOT NULL,
  hostel_id           UUID REFERENCES hostels(id) ON DELETE SET NULL,
  hostel_name         TEXT DEFAULT '',
  room_type           TEXT NOT NULL,
  amount              NUMERIC NOT NULL,              -- in GHS (not kobo)
  amount_kobo         BIGINT NOT NULL,               -- in kobo (amount × 100)
  currency            TEXT DEFAULT 'GHS',
  payment_method      TEXT DEFAULT '',               -- mobile_money | card
  channel             TEXT DEFAULT '',               -- mtn | vodafone | mastercard | visa etc.
  status              TEXT DEFAULT 'pending'
                      CHECK (status IN ('pending','success','failed','abandoned')),
  verified            BOOLEAN DEFAULT FALSE,
  metadata            JSONB DEFAULT '{}',
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── BOOKINGS ──────────────────────────────────────────────
-- Created only after payment is verified
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
  status              TEXT DEFAULT 'confirmed'
                      CHECK (status IN ('confirmed','cancelled','pending')),
  check_in_date       DATE,
  notes               TEXT DEFAULT '',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_student   ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_hostel    ON payments(hostel_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_status    ON payments(status);
CREATE INDEX IF NOT EXISTS idx_bookings_student   ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hostel    ON bookings(hostel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_manager   ON bookings(manager_id);

-- ── TRIGGERS ──────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
