-- ============================================================
-- FIX: RLS-policyer för sparad reklam + kategoriintresse
-- Kör detta i Supabase Dashboard → SQL Editor
-- ============================================================
--
-- Problem 1: Sparade annonser visas inte för inloggad användare
--   Rot-orsak: "Authenticated see active ads" kräver valid_to >= CURRENT_DATE
--   vilket blockerar utgångna annonser. Sparade annonser kan ha passerat
--   giltighetsdatumet men ska fortfarande vara läsbara av den som sparat dem.
--
-- Problem 2: Målgrupp uppdateras inte när företag bockar i kategorier
--   Rot-orsak: users_b2c_categories/users_b2b_categories har USING (user_id = auth.uid())
--   vilket gör att företagskonton (som inte finns i dessa tabeller) alltid
--   får tomma resultat när de försöker räkna kategoriintresserade användare.
-- ============================================================

-- ── Fix 1: Sparade annonser ──────────────────────────────────
-- Lägg till en extra SELECT-policy som låter inloggade användare
-- läsa annonser de själva har sparat, oavsett giltighetsdatum.

DROP POLICY IF EXISTS "Users can read own saved ads" ON ads;
CREATE POLICY "Users can read own saved ads"
  ON ads
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT ad_id FROM saved_ads WHERE user_id = auth.uid()
    )
  );

-- ── Fix 2: Kategoriintresse – företag får läsa ───────────────
-- Lägg till SELECT-policyer som tillåter företag att läsa
-- users_b2c_categories och users_b2b_categories för att räkna
-- hur många användare som är intresserade av valda kategorier.

-- B2C
DROP POLICY IF EXISTS "Companies can read category interests b2c" ON users_b2c_categories;
CREATE POLICY "Companies can read category interests b2c"
  ON users_b2c_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies WHERE id = auth.uid()
    )
  );

-- B2B
DROP POLICY IF EXISTS "Companies can read category interests b2b" ON users_b2b_categories;
CREATE POLICY "Companies can read category interests b2b"
  ON users_b2b_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies WHERE id = auth.uid()
    )
  );
