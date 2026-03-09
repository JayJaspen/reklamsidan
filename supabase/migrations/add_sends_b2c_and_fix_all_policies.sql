-- ============================================================
-- MIGRATION: Lägg till sends_b2c + fixa alla saknade RLS-policies
-- Kör i Supabase: Project → SQL Editor → New query → klistra in → Run
-- ============================================================

-- Sätt sökväg explicit så tabellerna hittas oavsett anslutningsinställningar
SET search_path TO public;

-- ── 1. Ny kolumn: sends_b2c på companies ────────────────────
-- Anger om företaget riktar sig till B2C-kunder.
-- Default TRUE så att befintliga företag automatiskt syns för B2C.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sends_b2c BOOLEAN DEFAULT TRUE NOT NULL;

-- ── 2. company_counties RLS ──────────────────────────────────
-- (Samma som fix_company_counties_and_ads_rls.sql – inkluderas här
--  ifall den migrationen inte körts)

DROP POLICY IF EXISTS "Authenticated can read company_counties" ON company_counties;
CREATE POLICY "Authenticated can read company_counties"
  ON company_counties FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Company manages own counties" ON company_counties;
CREATE POLICY "Company manages own counties"
  ON company_counties FOR ALL TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- ── 3. Ads SELECT policy för inloggade ──────────────────────
DROP POLICY IF EXISTS "Authenticated see active ads" ON ads;
CREATE POLICY "Authenticated see active ads"
  ON ads FOR SELECT TO authenticated
  USING (valid_from <= CURRENT_DATE AND valid_to >= CURRENT_DATE);

-- ── 4. company_categories_b2c – skriva (INSERT/DELETE) ──────
-- Inloggade företag måste kunna länka/avlänka sina kategorier

DROP POLICY IF EXISTS "Company manages own b2c categories" ON company_categories_b2c;
CREATE POLICY "Company manages own b2c categories"
  ON company_categories_b2c FOR ALL TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS "Company manages own b2b categories" ON company_categories_b2b;
CREATE POLICY "Company manages own b2b categories"
  ON company_categories_b2b FOR ALL TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- ── 5. categories_b2c / categories_b2b – INSERT för företag ─
-- Företag ska kunna lägga till nya kategorier (fliken "Kategorier")

DROP POLICY IF EXISTS "Company can insert categories b2c" ON categories_b2c;
CREATE POLICY "Company can insert categories b2c"
  ON categories_b2c FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type IN ('company', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admin can modify categories b2c" ON categories_b2c;
CREATE POLICY "Admin can modify categories b2c"
  ON categories_b2c FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Company can insert categories b2b" ON categories_b2b;
CREATE POLICY "Company can insert categories b2b"
  ON categories_b2b FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type IN ('company', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admin can modify categories b2b" ON categories_b2b;
CREATE POLICY "Admin can modify categories b2b"
  ON categories_b2b FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );
