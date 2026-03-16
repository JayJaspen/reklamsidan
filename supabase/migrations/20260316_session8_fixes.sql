-- ============================================================
-- Session 8 – Fixes
-- 1. billing_archive: lägg till jobs_data-kolumn
-- 2. jobs: ge företag läsrättighet på egna jobb (inkl. avpublicerade)
-- 3. jobs: funktion för att auto-avpublicera utgångna jobb
-- 4. companies: explicit READ-policy för autentiserade (logotyp i jobbmarknad)
-- ============================================================

SET search_path TO public;

-- ── 1. billing_archive – spara även jobbannonser ─────────────
ALTER TABLE billing_archive
  ADD COLUMN IF NOT EXISTS jobs_data JSONB DEFAULT '[]'::jsonb;

-- ── 2. Företag kan läsa ALLA sina egna jobb (inkl. avpublicerade) ──
-- Den befintliga policyn "jobs_authenticated_read" visade bara is_active=true,
-- vilket innebär att avpublicerade jobb försvann från företagets vy.
DROP POLICY IF EXISTS "jobs_company_read_own" ON jobs;
CREATE POLICY "jobs_company_read_own"
  ON jobs FOR SELECT TO authenticated
  USING (company_id = auth.uid());

-- ── 3. Funktion: avpublicera jobb med passerat sista ansökningsdatum ──
CREATE OR REPLACE FUNCTION expire_outdated_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE jobs
  SET is_active = false
  WHERE application_deadline < CURRENT_DATE
    AND is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION expire_outdated_jobs() TO service_role;

-- Aktivera pg_cron-schemaläggning:
-- 1. Gå till Supabase Dashboard → Database → Extensions → aktivera pg_cron
-- 2. Kör sedan detta i SQL-editorn:
--
-- SELECT cron.schedule(
--   'expire-outdated-jobs',
--   '0 1 * * *',   -- dagligen kl 01:00 UTC
--   'SELECT expire_outdated_jobs()'
-- );

-- ── 4. Explicit READ-policy för companies (för B2C jobbmarknad) ──
-- Befintlig policy "Läs companies" täcker redan is_active=TRUE, men vi
-- lägger till en separat, tydlig policy för att säkerställa att
-- PostgREST-joins fungerar korrekt för alla autentiserade användare.
DROP POLICY IF EXISTS "companies_authenticated_read_active" ON companies;
CREATE POLICY "companies_authenticated_read_active"
  ON companies FOR SELECT TO authenticated
  USING (is_active = TRUE OR auth.uid() = id);

-- ── 5. Ladda om PostgREST schema-cache ──
-- (Säkerställer att FK-joins från jobs→companies hämtas korrekt)
NOTIFY pgrst, 'reload schema';
