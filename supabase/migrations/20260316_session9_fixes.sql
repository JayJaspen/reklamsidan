-- Session 9 – Property watchlists & monthly fee
-- Run once in Supabase SQL editor

-- 1. Add monthly_fee column to properties (for bostadsrätt avgift)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS monthly_fee INTEGER;

-- 2. Create property_watchlists table
CREATE TABLE IF NOT EXISTS property_watchlists (
  id              SERIAL PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label           TEXT        NOT NULL DEFAULT 'Bevakning',
  property_types  TEXT[]      NOT NULL DEFAULT '{}',   -- empty = all types
  listing_type    TEXT        NOT NULL DEFAULT '',      -- empty = any
  county          TEXT        NOT NULL DEFAULT '',      -- empty = any
  max_price       INTEGER,                               -- null = no limit
  max_monthly_fee INTEGER,                               -- null = no limit (avgift filter)
  min_rooms       NUMERIC,                               -- null = no limit
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. RLS for property_watchlists
ALTER TABLE property_watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "watchlists_user_all" ON property_watchlists
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
