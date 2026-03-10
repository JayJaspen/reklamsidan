-- ============================================================
-- Publik statistik-funktion för startsidan
-- Kör i Supabase Dashboard → SQL Editor
-- ============================================================
-- SECURITY DEFINER kringgår RLS så att anonym besökare
-- kan se aggregerad statistik utan att exponera enskilda rader.

CREATE OR REPLACE FUNCTION get_public_stats()
RETURNS JSON
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'companies', (
      SELECT COUNT(*)::int FROM companies
      WHERE is_active = TRUE
        AND (sends_b2c = TRUE OR sends_b2b = TRUE)
    ),
    'b2c_users', (
      SELECT COUNT(*)::int FROM users_b2c
    ),
    'b2b_users', (
      SELECT COUNT(*)::int FROM users_b2b
    )
  );
$$;

-- Tillåt anonyma anrop (startsidan kräver ingen inloggning)
GRANT EXECUTE ON FUNCTION get_public_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_public_stats() TO authenticated;
