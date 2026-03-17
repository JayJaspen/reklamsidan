-- ============================================================
-- Tvingande favoriter (mandatory follows)
-- Vissa företag ska automatiskt följas av alla B2C & B2B-användare
-- och kan inte avföljas. WESQ - Reklamsidan.se är det första.
-- ============================================================

-- 1. Lägg till is_mandatory_follow på companies-tabellen
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS is_mandatory_follow BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Markera WESQ som tvingande
UPDATE companies
SET is_mandatory_follow = TRUE
WHERE public_name = 'WESQ - Reklamsidan.se';

-- 3. Trigger-funktion: lägg till tvingande favoriter automatiskt
--    när en ny användare (user_profiles) skapas
CREATE OR REPLACE FUNCTION add_mandatory_favorites()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_favorites (user_id, company_id)
  SELECT NEW.id, c.id
  FROM companies c
  WHERE c.is_mandatory_follow = TRUE
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_profile_created_mandatory_fav ON user_profiles;
CREATE TRIGGER on_user_profile_created_mandatory_fav
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION add_mandatory_favorites();

-- 4. Backfill: lägg till tvingande favoriter för befintliga användare
--    som ännu inte har dem
INSERT INTO user_favorites (user_id, company_id)
SELECT up.id, c.id
FROM user_profiles up
CROSS JOIN companies c
WHERE c.is_mandatory_follow = TRUE
  AND up.user_type IN ('b2c', 'b2b')
ON CONFLICT DO NOTHING;

-- 5. RLS-policy: förhindra att tvingande favoriter avföjs
--    (den befintliga DELETE-policyn "Användare hanterar sina favoriter" tillåter alla deletes;
--     vi lägger till en ny restriktiv policy med USING-villkor)
DROP POLICY IF EXISTS "Cannot unfollow mandatory companies" ON user_favorites;
CREATE POLICY "Cannot unfollow mandatory companies"
  ON user_favorites
  FOR DELETE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = company_id
        AND c.is_mandatory_follow = TRUE
    )
  );

-- Obs: Den befintliga "Användare hanterar sina favoriter"-policyn (FOR ALL)
-- hanterar SELECT/INSERT/UPDATE. Vi behöver nu separera DELETE från den.
-- Byt ut den befintliga policyn för att exkludera DELETE:
DROP POLICY IF EXISTS "Användare hanterar sina favoriter" ON user_favorites;

CREATE POLICY "Användare kan läsa sina favoriter"
  ON user_favorites
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Användare kan lägga till favoriter"
  ON user_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Användare kan uppdatera sina favoriter"
  ON user_favorites
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Användare kan ta bort icke-tvingande favoriter"
  ON user_favorites
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = company_id
        AND c.is_mandatory_follow = TRUE
    )
  );
