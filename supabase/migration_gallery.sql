-- ============================================================
-- HOSTEL HUB — Gallery Migration
-- Run this in Supabase SQL Editor if not already applied
-- ============================================================

-- Add gallery column to hostels (structured per-section image storage)
ALTER TABLE hostels
  ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '{}';

-- Add available_rooms to room_types entries (stored within the JSONB)
-- No schema change needed — room_types JSONB already supports it

-- Indexes for gallery lookups
CREATE INDEX IF NOT EXISTS idx_hostels_gallery ON hostels USING gin(gallery);
CREATE INDEX IF NOT EXISTS idx_hostels_room_types ON hostels USING gin(room_types);
