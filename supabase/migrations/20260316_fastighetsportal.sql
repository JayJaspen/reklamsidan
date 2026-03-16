-- ============================================================
-- Fastighetsportal
-- Företag kan publicera fastigheter till försäljning / uthyrning.
-- B2C ser bostäder (Lägenhet, Villa, Radhus, Tomt)
-- B2B ser lokaler (Lagerlokal, Butikslokal)
-- ============================================================

SET search_path TO public;

-- ── Fastigheter ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
  id               BIGSERIAL    PRIMARY KEY,
  company_id       UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  property_type    TEXT         NOT NULL CHECK (property_type IN (
                     'Lägenhet','Villa','Radhus','Tomt','Lagerlokal','Butikslokal'
                   )),
  listing_type     TEXT         NOT NULL CHECK (listing_type IN ('forsaljning','uthyrning')),
  title            TEXT         NOT NULL,
  description      TEXT         NOT NULL,
  address          TEXT,
  city             TEXT         NOT NULL,
  county           TEXT         NOT NULL,
  price            INT,
  price_period     TEXT,        -- 'månad' | 'år' | NULL (vid försäljning)
  size_sqm         NUMERIC(10,1),
  rooms            NUMERIC(4,1),
  build_year       INT,
  image_urls       TEXT[]       NOT NULL DEFAULT '{}',
  is_active        BOOLEAN      NOT NULL DEFAULT true,
  is_billed        BOOLEAN      NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index för vanliga filter
CREATE INDEX IF NOT EXISTS idx_properties_company_id    ON properties(company_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type  ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_county        ON properties(county);
CREATE INDEX IF NOT EXISTS idx_properties_is_active     ON properties(is_active);

-- updated_at-trigger
CREATE OR REPLACE FUNCTION update_properties_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_properties_updated_at ON properties;
CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_properties_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Alla inloggade kan läsa aktiva fastigheter
DROP POLICY IF EXISTS "properties_read_active" ON properties;
CREATE POLICY "properties_read_active"
  ON properties FOR SELECT TO authenticated
  USING (is_active = true);

-- Företag kan läsa ALLA sina egna (inkl. avpublicerade)
DROP POLICY IF EXISTS "properties_company_read_own" ON properties;
CREATE POLICY "properties_company_read_own"
  ON properties FOR SELECT TO authenticated
  USING (company_id = auth.uid());

-- Företag kan lägga till sina egna
DROP POLICY IF EXISTS "properties_company_insert" ON properties;
CREATE POLICY "properties_company_insert"
  ON properties FOR INSERT TO authenticated
  WITH CHECK (company_id = auth.uid());

-- Företag kan uppdatera sina egna
DROP POLICY IF EXISTS "properties_company_update" ON properties;
CREATE POLICY "properties_company_update"
  ON properties FOR UPDATE TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- Företag kan ta bort sina egna
DROP POLICY IF EXISTS "properties_company_delete" ON properties;
CREATE POLICY "properties_company_delete"
  ON properties FOR DELETE TO authenticated
  USING (company_id = auth.uid());

-- Admin kan allt
DROP POLICY IF EXISTS "properties_admin_all" ON properties;
CREATE POLICY "properties_admin_all"
  ON properties FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- ── Storage: property-images ──────────────────────────────────
-- OBS: Skapa bucketen manuellt i Supabase Dashboard:
--   Storage → New bucket → Namn: "property-images" → Public: ON
-- Kör sedan dessa policies:

DROP POLICY IF EXISTS "property_images_upload"      ON storage.objects;
DROP POLICY IF EXISTS "property_images_update"      ON storage.objects;
DROP POLICY IF EXISTS "property_images_delete"      ON storage.objects;
DROP POLICY IF EXISTS "property_images_public_read" ON storage.objects;

CREATE POLICY "property_images_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "property_images_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "property_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "property_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
