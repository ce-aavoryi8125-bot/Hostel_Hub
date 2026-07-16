-- ============================================================
-- HOSTEL HUB — Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- Passwords below are bcrypt hashes:
--   admin123   → for admin
--   manager123 → for manager
-- ============================================================

-- Default Admin
INSERT INTO admins (name, email, password, role)
VALUES (
  'Hostel Hub Admin',
  'admin@hostelhub.dev',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh0.',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- Default Manager
INSERT INTO managers (name, email, phone, password, role, bank_name, account_name, account_number)
VALUES (
  'John Owusu',
  'manager@hostelhub.dev',
  '+233 24 111 2222',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uDoGUiN2C',
  'manager',
  'Ghana Commercial Bank',
  'John Owusu Hostel Ventures',
  '1029384756'
)
ON CONFLICT (email) DO NOTHING;

-- NOTE: Hostels, rooms, and transactions are seeded programmatically
-- by the server on first boot (see config/db.js seedDefaults).
-- You can also insert them here manually if preferred.
