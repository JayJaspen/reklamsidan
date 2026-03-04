-- ============================================================
-- MIGRATION: Alla RLS-policies för companies, favorites,
--            targeting, ads-tabell och storage
-- Kör hela filen i Supabase → SQL Editor
-- ============================================================


-- ── 1. COMPANIES – läsning ────────────────────────────────────
-- Company kan läsa sin EGEN rad
-- Admin kan läsa ALLA rader
-- B2C/B2B-användare kan läsa aktiva companies (för Favoriter-sökning)

DROP POLICY IF EXISTS "Läs companies" ON companies;
CREATE POLICY "Läs companies"
  ON companies FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR is_active = TRUE
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Company kan uppdatera sitt eget konto" ON companies;
CREATE POLICY "Company kan uppdatera sitt eget konto"
  ON companies FOR UPDATE TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );


-- ── 2. USER_FAVORITES – läsning, lägga till, ta bort ──────────
-- Användare ser och hanterar sina EGNA favoriter
-- Company ser VEM som följer dem (company_id = deras uid)

DROP POLICY IF EXISTS "Hantera user_favorites" ON user_favorites;
CREATE POLICY "Hantera user_favorites"
  ON user_favorites FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR company_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Lägg till favorit" ON user_favorites;
CREATE POLICY "Lägg till favorit"
  ON user_favorites FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Ta bort favorit" ON user_favorites;
CREATE POLICY "Ta bort favorit"
  ON user_favorites FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- ── 3. USER_PROFILES – läsning ───────────────────────────────
-- Company behöver läsa user_profiles för att avgöra
-- om en följare är B2C eller B2B (statistik-sidan)

DROP POLICY IF EXISTS "Authenticated kan läsa user_profiles" ON user_profiles;
CREATE POLICY "Authenticated kan läsa user_profiles"
  ON user_profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles AS up
      WHERE up.id = auth.uid() AND up.user_type IN ('company', 'admin')
    )
  );


-- ── 4. USERS_B2C & USERS_B2B – targeting & följartyp ─────────
-- Inloggade annonsörer måste kunna räkna/läsa för targeting

DROP POLICY IF EXISTS "Authenticated kan läsa users_b2c" ON users_b2c;
CREATE POLICY "Authenticated kan läsa users_b2c"
  ON users_b2c FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated kan läsa users_b2b" ON users_b2b;
CREATE POLICY "Authenticated kan läsa users_b2b"
  ON users_b2b FOR SELECT TO authenticated
  USING (true);


-- ── 5. COMPANY_CATEGORIES – läsning ──────────────────────────
-- B2C/B2B-användare behöver läsa kategorier för Favoriter-sökning

DROP POLICY IF EXISTS "Authenticated kan läsa company_categories_b2c" ON company_categories_b2c;
CREATE POLICY "Authenticated kan läsa company_categories_b2c"
  ON company_categories_b2c FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated kan läsa company_categories_b2b" ON company_categories_b2b;
CREATE POLICY "Authenticated kan läsa company_categories_b2b"
  ON company_categories_b2b FOR SELECT TO authenticated
  USING (true);


-- ── 6. ADS TABLE ──────────────────────────────────────────────
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
-- Sökväg: logos/{user_id}.{ext}
-- split_part(..., '.', 1) plockar ut {user_id} ur filnamnet

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
-- OBS: Skapa bucketen manuellt: Storage → New bucket → "ads" (Public ON)
-- Sökväg: {user_id}/{timestamp}.{ext}
-- (storage.foldername(name))[1] plockar ut {user_id}

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
