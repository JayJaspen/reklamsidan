-- Uppdatera get_companies_with_ad_count för att stödja filtrering på company-IDs.
-- Löser N+1-problemet i all-reklam-sidorna: istället för ett COUNT-anrop per
-- företag görs ett enda RPC-anrop med alla relevanta company-IDs.

CREATE OR REPLACE FUNCTION get_companies_with_ad_count(
  p_type        TEXT,
  p_company_ids UUID[]   DEFAULT NULL,
  p_date        DATE     DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  id          UUID,
  public_name TEXT,
  logo_url    TEXT,
  ad_count    BIGINT
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
    ON  a.company_id = c.id
    AND a.ad_type    = p_type::ad_type
    AND a.valid_from <= p_date
    AND a.valid_to   >= p_date
  WHERE c.is_active = TRUE
    AND CASE WHEN p_type = 'b2c' THEN c.sends_b2c ELSE c.sends_b2b END = TRUE
    AND (p_company_ids IS NULL OR c.id = ANY(p_company_ids))
  GROUP BY c.id, c.public_name, c.logo_url
  ORDER BY c.public_name;
$$;

GRANT EXECUTE ON FUNCTION get_companies_with_ad_count(TEXT, UUID[], DATE) TO authenticated;
