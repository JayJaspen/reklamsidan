-- ============================================================
-- FIX: RLS-policyer för Favoriter (user_favorites + companies)
-- Kör detta i Supabase Dashboard → SQL Editor
-- ============================================================

-- ── user_favorites ──────────────────────────────────────────
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Ta bort eventuella gamla konflikterande policyer
DROP POLICY IF EXISTS "users_select_own_favorites"   ON user_favorites;
DROP POLICY IF EXISTS "users_insert_own_favorites"   ON user_favorites;
DROP POLICY IF EXISTS "users_delete_own_favorites"   ON user_favorites;
DROP POLICY IF EXISTS "company_select_own_favorites" ON user_favorites;

-- Användare kan läsa sina egna favoriter
CREATE POLICY "users_select_own_favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

-- Användare kan lägga till favoriter
CREATE POLICY "users_insert_own_favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Användare kan ta bort egna favoriter
CREATE POLICY "users_delete_own_favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Företag kan läsa favoriter för sitt eget company_id (för statistik)
CREATE POLICY "company_select_own_favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = company_id);

-- ── companies ────────────────────────────────────────────────
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_companies"   ON companies;
DROP POLICY IF EXISTS "company_update_own"             ON companies;

-- Alla inloggade användare kan läsa aktiva företag (för sökning i Favoriter)
CREATE POLICY "public_read_active_companies" ON companies
  FOR SELECT USING (is_active = true OR auth.uid() = id);

-- Företag kan uppdatera sitt eget konto
CREATE POLICY "company_update_own" ON companies
  FOR UPDATE USING (auth.uid() = id);

-- ── company_categories_b2c ───────────────────────────────────
ALTER TABLE company_categories_b2c ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_company_cats_b2c" ON company_categories_b2c;
DROP POLICY IF EXISTS "company_manage_cats_b2c"      ON company_categories_b2c;

CREATE POLICY "public_read_company_cats_b2c" ON company_categories_b2c
  FOR SELECT USING (true);

CREATE POLICY "company_manage_cats_b2c" ON company_categories_b2c
  FOR ALL USING (auth.uid() = company_id);

-- ── company_categories_b2b ───────────────────────────────────
ALTER TABLE company_categories_b2b ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_company_cats_b2b" ON company_categories_b2b;
DROP POLICY IF EXISTS "company_manage_cats_b2b"      ON company_categories_b2b;

CREATE POLICY "public_read_company_cats_b2b" ON company_categories_b2b
  FOR SELECT USING (true);

CREATE POLICY "company_manage_cats_b2b" ON company_categories_b2b
  FOR ALL USING (auth.uid() = company_id);

-- ── categories_b2c / categories_b2b ─────────────────────────
ALTER TABLE categories_b2c ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_cats_b2c" ON categories_b2c;
CREATE POLICY "public_read_cats_b2c" ON categories_b2c
  FOR SELECT USING (true);

ALTER TABLE categories_b2b ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_cats_b2b" ON categories_b2b;
CREATE POLICY "public_read_cats_b2b" ON categories_b2b
  FOR SELECT USING (true);

-- ── contact_messages (ny tabell för kontaktformulär) ─────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL,
  email      text NOT NULL,
  message    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_insert_contact" ON contact_messages;
DROP POLICY IF EXISTS "admin_read_contact"    ON contact_messages;

-- Vem som helst kan skicka ett kontaktmeddelande (formuläret på startsidan)
CREATE POLICY "anyone_insert_contact" ON contact_messages
  FOR INSERT WITH CHECK (true);

-- Admins kan läsa kontaktmeddelanden
CREATE POLICY "admin_read_contact" ON contact_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );
