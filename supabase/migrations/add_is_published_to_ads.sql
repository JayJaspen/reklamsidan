-- Lägg till is_published-kolumn på ads för att möjliggöra avpublicering
-- utan att manipulera datum (vilket kan bryta valid_dates-constrainten).

ALTER TABLE ads ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;

-- Uppdatera active_ads-vyn att respektera is_published
CREATE OR REPLACE VIEW active_ads AS
  SELECT * FROM ads
  WHERE valid_from    <= CURRENT_DATE
    AND valid_to      >= CURRENT_DATE
    AND is_published  = TRUE;

-- RLS-policy: företag kan uppdatera is_published på egna annonser
DROP POLICY IF EXISTS "Company can update own ads" ON ads;
CREATE POLICY "Company can update own ads"
  ON ads FOR UPDATE TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());
