-- ============================================================
-- FIX: RLS-policyer för ad_target_categories_b2c/b2b och ad_target_counties
-- Kör detta i Supabase Dashboard → SQL Editor
-- ============================================================
--
-- Problem: ad_target_categories_b2c, ad_target_categories_b2b och
--          ad_target_counties har RLS aktiverat men INGA SELECT-policyer.
--          Det gör att alla queries mot dessa tabeller returnerar tom array,
--          vilket innebär att Intressereklam och länsmatchning aldrig fungerar.
--
-- Rot-orsak: I PostgreSQL/Supabase blockeras ALL åtkomst som standard när
--            RLS är aktiverat och inga policyer finns.
-- ============================================================

-- ── ad_target_categories_b2c ─────────────────────────────────
DROP POLICY IF EXISTS "Inloggade kan läsa b2c-annons-kategorier" ON ad_target_categories_b2c;
CREATE POLICY "Inloggade kan läsa b2c-annons-kategorier"
  ON ad_target_categories_b2c
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- ── ad_target_categories_b2b ─────────────────────────────────
DROP POLICY IF EXISTS "Inloggade kan läsa b2b-annons-kategorier" ON ad_target_categories_b2b;
CREATE POLICY "Inloggade kan läsa b2b-annons-kategorier"
  ON ad_target_categories_b2b
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- ── ad_target_counties ───────────────────────────────────────
DROP POLICY IF EXISTS "Inloggade kan läsa annons-län" ON ad_target_counties;
CREATE POLICY "Inloggade kan läsa annons-län"
  ON ad_target_counties
  FOR SELECT
  TO authenticated
  USING (TRUE);
