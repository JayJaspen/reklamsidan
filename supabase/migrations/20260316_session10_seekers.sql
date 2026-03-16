-- Session 10 – Property seekers (sökes-annonser) & city-county mapping
-- Run once in Supabase SQL editor

-- 1. Create property_seekers table
CREATE TABLE IF NOT EXISTS property_seekers (
  id              SERIAL PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_type   TEXT        NOT NULL,
  listing_type    TEXT        NOT NULL DEFAULT 'forsaljning',
  county          TEXT        NOT NULL DEFAULT '',
  city            TEXT        NOT NULL DEFAULT '',
  description     TEXT        NOT NULL DEFAULT '',
  contact_name    TEXT        NOT NULL DEFAULT '',
  contact_phone   TEXT        NOT NULL DEFAULT '',
  contact_email   TEXT        NOT NULL DEFAULT '',
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE property_seekers ENABLE ROW LEVEL SECURITY;

-- Users can fully manage their own ads
CREATE POLICY "seekers_user_all" ON property_seekers
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- All authenticated users can read active seekers (companies use this to discover them)
CREATE POLICY "seekers_read_active" ON property_seekers
  FOR SELECT
  USING (is_active = true);

-- 2. Create property_seeker_purchases table
--    Tracks which company has unlocked contact details for a seeker ad
CREATE TABLE IF NOT EXISTS property_seeker_purchases (
  id          SERIAL PRIMARY KEY,
  company_id  UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seeker_id   INTEGER NOT NULL REFERENCES property_seekers(id) ON DELETE CASCADE,
  is_billed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, seeker_id)
);

ALTER TABLE property_seeker_purchases ENABLE ROW LEVEL SECURITY;

-- Companies can manage their own purchases
CREATE POLICY "seeker_purchases_company_all" ON property_seeker_purchases
  FOR ALL
  USING  (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- 3. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
