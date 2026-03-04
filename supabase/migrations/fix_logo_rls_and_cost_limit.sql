-- ============================================================
-- FIX 1: Logo-uppladdning – uppdatera storage-policy
-- Sökvägen ändrades från logos/{userId}.ext  →  logos/{userId}/{timestamp}.ext
-- Gammal policy kontrollerade filename, ny kontrollerar mapp-nivå 2
-- Kör detta i Supabase Dashboard → SQL Editor
-- ============================================================

-- Ta bort gamla logo-policyer
DROP POLICY IF EXISTS "company_upload_logo"   ON storage.objects;
DROP POLICY IF EXISTS "company_update_logo"   ON storage.objects;
DROP POLICY IF EXISTS "company_delete_logo"   ON storage.objects;

-- INSERT: loggor sparas nu under logos/{userId}/{filnamn}
CREATE POLICY "company_upload_logo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'company-assets'
    AND (storage.foldername(name))[1] = 'logos'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- UPDATE (upsert)
CREATE POLICY "company_update_logo" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'company-assets'
    AND (storage.foldername(name))[1] = 'logos'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- SELECT (public läsning av loggor)
DROP POLICY IF EXISTS "public_read_company_assets" ON storage.objects;
CREATE POLICY "public_read_company_assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-assets');


-- ============================================================
-- FIX 2: Kostnadsgräns – lägg till cost_limit-kolumn på ads
-- ============================================================

ALTER TABLE ads ADD COLUMN IF NOT EXISTS cost_limit integer DEFAULT NULL;

COMMENT ON COLUMN ads.cost_limit IS
  'Max kostnad i SEK. Annonsen döljs automatiskt när ackumulerad kostnad når denna gräns. NULL = ingen gräns.';


-- ============================================================
-- FIX 3: Admin-rättigheter för kategorihantering
-- Admins behöver INSERT/UPDATE/DELETE på categories_b2c och categories_b2b
-- ============================================================

-- categories_b2c
DROP POLICY IF EXISTS "admin_manage_cats_b2c" ON categories_b2c;
CREATE POLICY "admin_manage_cats_b2c" ON categories_b2c
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- categories_b2b
DROP POLICY IF EXISTS "admin_manage_cats_b2b" ON categories_b2b;
CREATE POLICY "admin_manage_cats_b2b" ON categories_b2b
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );
