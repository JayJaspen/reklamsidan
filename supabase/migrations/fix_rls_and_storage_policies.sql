-- ============================================================
-- MIGRATION: Fixa RLS-policies för admin, följare & targeting
-- Kör hela filen i Supabase SQL Editor
-- ============================================================


-- ── 1. COMPANIES ─────────────────────────────────────────────
-- Admin kan läsa ALLA companies (returnerade 0 rader förut)
-- Company kan läsa & uppdatera sin EGEN rad

DROP POLICY IF EXISTS "Admin kan läsa alla companies" ON companies;
CREATE POLICY "Admin kan läsa alla companies"
  ON companies FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin kan uppdatera companies" ON companies;
CREATE POLICY "Admin kan uppdatera companies"
  ON companies FOR UPDATE TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );


-- ── 2. USER_FAVORITES ─────────────────────────────────────────
-- Company kan se VILKA som följer dem (company_id = deras uid)
-- Behövs för följarstatistik på Statistik-sidan

DROP POLICY IF EXISTS "Company kan se sina egna följare" ON user_favorites;
CREATE POLICY "Company kan se sina egna följare"
  ON user_favorites FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR company_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );


-- ── 3. USERS_B2C ──────────────────────────────────────────────
-- Inloggade annonsörer måste kunna räkna B2C-användare
-- för att beräkna Målgrupp i Skapa reklam

DROP POLICY IF EXISTS "Authenticated kan läsa users_b2c för targeting" ON users_b2c;
CREATE POLICY "Authenticated kan läsa users_b2c för targeting"
  ON users_b2c FOR SELECT TO authenticated
  USING (true);


-- ── 4. USERS_B2B ──────────────────────────────────────────────
-- Samma för B2B-targeting

DROP POLICY IF EXISTS "Authenticated kan läsa users_b2b för targeting" ON users_b2b;
CREATE POLICY "Authenticated kan läsa users_b2b för targeting"
  ON users_b2b FOR SELECT TO authenticated
  USING (true);


-- ── 5. USER_PROFILES ─────────────────────────────────────────
-- Annonsörer behöver läsa user_profiles för att avgöra
-- om en följare är B2C eller B2B

DROP POLICY IF EXISTS "Authenticated kan läsa user_profiles för följartyp" ON user_profiles;
CREATE POLICY "Authenticated kan läsa user_profiles för följartyp"
  ON user_profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles AS up
      WHERE up.id = auth.uid() AND up.user_type IN ('company', 'admin')
    )
  );


-- ── 6. ADS TABLE ─────────────────────────────────────────────
-- Company kan skapa och läsa sina egna annonser

DROP POLICY IF EXISTS "Company kan skapa annonser" ON ads;
CREATE POLICY "Company kan skapa annonser"
  ON ads FOR INSERT TO authenticated
  WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS "Company kan läsa sina egna annonser" ON ads;
CREATE POLICY "Company kan läsa sina egna annonser"
  ON ads FOR SELECT TO authenticated
  USING (
    company_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );


-- ── 7. STORAGE: company-assets ────────────────────────────────
-- Tillåt company att ladda upp sin egen logga
-- Sökväg: logos/{user_id}.{ext}

DROP POLICY IF EXISTS "Company kan ladda upp sin logga" ON storage.objects;
CREATE POLICY "Company kan ladda upp sin logga"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'company-assets'
    AND split_part(storage.filename(name), '.', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "Company kan uppdatera sin logga" ON storage.objects;
CREATE POLICY "Company kan uppdatera sin logga"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'company-assets'
    AND split_part(storage.filename(name), '.', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "Alla kan läsa company-assets" ON storage.objects;
CREATE POLICY "Alla kan läsa company-assets"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'company-assets');


-- ── 8. STORAGE: ads ───────────────────────────────────────────
-- OBS: Bucketen 'ads' måste skapas manuellt i Supabase Dashboard
-- Storage → New bucket → Name: "ads" → Public: ON
-- Sedan körs dessa policies:

DROP POLICY IF EXISTS "Company kan ladda upp annonsfiler" ON storage.objects;
CREATE POLICY "Company kan ladda upp annonsfiler"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Alla kan läsa annonsfiler" ON storage.objects;
CREATE POLICY "Alla kan läsa annonsfiler"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'ads');
