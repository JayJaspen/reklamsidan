-- ============================================================
-- PRESTANDAFÖRBÄTTRINGAR
-- Kör i Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Saknade index ────────────────────────────────────────
-- Kritiska för intressematchning och push-notiser

CREATE INDEX IF NOT EXISTS idx_ad_target_cats_b2c_cat
  ON ad_target_categories_b2c(category_id);

CREATE INDEX IF NOT EXISTS idx_ad_target_cats_b2c_ad
  ON ad_target_categories_b2c(ad_id);

CREATE INDEX IF NOT EXISTS idx_ad_target_cats_b2b_cat
  ON ad_target_categories_b2b(category_id);

CREATE INDEX IF NOT EXISTS idx_user_cats_b2c_cat
  ON users_b2c_categories(category_id);

CREATE INDEX IF NOT EXISTS idx_user_cats_b2b_cat
  ON users_b2b_categories(category_id);

-- Sammansatt index för aktiva annonser (används i active_ads-vyn)
CREATE INDEX IF NOT EXISTS idx_ads_type_dates
  ON ads(ad_type, valid_from, valid_to);

-- ── 2. RPC-funktion: räkna aktiva annonser per företag ──────
-- Ersätter N+1-loopen i "All reklam"

CREATE OR REPLACE FUNCTION get_companies_with_ad_count(
  p_type TEXT,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  id        UUID,
  public_name TEXT,
  logo_url  TEXT,
  ad_count  BIGINT
)
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT
    c.id,
    c.public_name,
    c.logo_url,
    COUNT(a.id) AS ad_count
  FROM companies c
  LEFT JOIN ads a
    ON a.company_id = c.id
    AND a.ad_type   = p_type
    AND a.valid_from <= p_date
    AND a.valid_to   >= p_date
  WHERE c.is_active = TRUE
    AND CASE WHEN p_type = 'b2c' THEN c.sends_b2c ELSE c.sends_b2b END = TRUE
  GROUP BY c.id, c.public_name, c.logo_url
  ORDER BY c.public_name;
$$;
