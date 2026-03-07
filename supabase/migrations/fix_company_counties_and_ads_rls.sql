-- ============================================================
-- Fix 1: company_counties RLS policies
-- The table had RLS enabled but NO policies, so nobody could
-- read or write to it. This fixes county storage for companies.
-- ============================================================

-- Allow all authenticated users to read company_counties
-- (needed so B2C/B2B users can filter by county)
DROP POLICY IF EXISTS "Authenticated can read company_counties" ON company_counties;
CREATE POLICY "Authenticated can read company_counties"
  ON company_counties
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow companies to manage their own county entries
DROP POLICY IF EXISTS "Company manages own counties" ON company_counties;
CREATE POLICY "Company manages own counties"
  ON company_counties
  FOR ALL
  TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- ============================================================
-- Fix 2: Ads SELECT policy for authenticated users
-- The fix_rls_and_storage_policies migration may have removed
-- the policy that lets B2C/B2B users read active ads.
-- Re-add it so favoritreklam pages work correctly.
-- ============================================================

DROP POLICY IF EXISTS "Authenticated see active ads" ON ads;
CREATE POLICY "Authenticated see active ads"
  ON ads
  FOR SELECT
  TO authenticated
  USING (valid_from <= CURRENT_DATE AND valid_to >= CURRENT_DATE);
