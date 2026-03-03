-- ============================================================
-- MIGRATION: Tillåt anonym läsning av kategorier och counties
-- Behövs för att visa kategorier/intressen på registreringssidor
-- (där användaren ännu inte är inloggad)
--
-- Kör i Supabase: Project → SQL Editor → New query → klistra in → Run
-- ============================================================

CREATE POLICY "Anonyma kan läsa kategorier B2C"
  ON categories_b2c FOR SELECT TO anon USING (is_active = TRUE);

CREATE POLICY "Anonyma kan läsa kategorier B2B"
  ON categories_b2b FOR SELECT TO anon USING (is_active = TRUE);

CREATE POLICY "Anonyma kan läsa län"
  ON counties FOR SELECT TO anon USING (TRUE);
