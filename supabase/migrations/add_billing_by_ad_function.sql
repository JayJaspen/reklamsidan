-- ============================================================
-- Per-annons faktureringsuppdelning
-- Kör i Supabase Dashboard → SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION get_billing_by_ad()
RETURNS TABLE (
  company_id          UUID,
  ad_id               UUID,
  ad_name             TEXT,
  favorit_b2c_reads   BIGINT,
  intresse_b2c_reads  BIGINT,
  generell_b2c_reads  BIGINT,
  favorit_b2b_reads   BIGINT,
  intresse_b2b_reads  BIGINT,
  generell_b2b_reads  BIGINT,
  favorit_b2c_amount  BIGINT,
  intresse_b2c_amount BIGINT,
  generell_b2c_amount BIGINT,
  favorit_b2b_amount  BIGINT,
  intresse_b2b_amount BIGINT,
  generell_b2b_amount BIGINT,
  total_amount        BIGINT
)
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT
    a.company_id,
    a.id                                                                      AS ad_id,
    a.name                                                                    AS ad_name,
    COUNT(CASE WHEN ar.tab_source = 1 AND up.user_type = 'b2c' THEN 1 END)  AS favorit_b2c_reads,
    COUNT(CASE WHEN ar.tab_source = 2 AND up.user_type = 'b2c' THEN 1 END)  AS intresse_b2c_reads,
    COUNT(CASE WHEN ar.tab_source = 3 AND up.user_type = 'b2c' THEN 1 END)  AS generell_b2c_reads,
    COUNT(CASE WHEN ar.tab_source = 1 AND up.user_type = 'b2b' THEN 1 END)  AS favorit_b2b_reads,
    COUNT(CASE WHEN ar.tab_source = 2 AND up.user_type = 'b2b' THEN 1 END)  AS intresse_b2b_reads,
    COUNT(CASE WHEN ar.tab_source = 3 AND up.user_type = 'b2b' THEN 1 END)  AS generell_b2b_reads,
    COUNT(CASE WHEN ar.tab_source = 1 AND up.user_type = 'b2c' THEN 1 END) * 3 AS favorit_b2c_amount,
    COUNT(CASE WHEN ar.tab_source = 2 AND up.user_type = 'b2c' THEN 1 END) * 3 AS intresse_b2c_amount,
    COUNT(CASE WHEN ar.tab_source = 3 AND up.user_type = 'b2c' THEN 1 END) * 1 AS generell_b2c_amount,
    COUNT(CASE WHEN ar.tab_source = 1 AND up.user_type = 'b2b' THEN 1 END) * 5 AS favorit_b2b_amount,
    COUNT(CASE WHEN ar.tab_source = 2 AND up.user_type = 'b2b' THEN 1 END) * 5 AS intresse_b2b_amount,
    COUNT(CASE WHEN ar.tab_source = 3 AND up.user_type = 'b2b' THEN 1 END) * 3 AS generell_b2b_amount,
    (
      COUNT(CASE WHEN ar.tab_source = 1 AND up.user_type = 'b2c' THEN 1 END) * 3 +
      COUNT(CASE WHEN ar.tab_source = 2 AND up.user_type = 'b2c' THEN 1 END) * 3 +
      COUNT(CASE WHEN ar.tab_source = 3 AND up.user_type = 'b2c' THEN 1 END) * 1 +
      COUNT(CASE WHEN ar.tab_source = 1 AND up.user_type = 'b2b' THEN 1 END) * 5 +
      COUNT(CASE WHEN ar.tab_source = 2 AND up.user_type = 'b2b' THEN 1 END) * 5 +
      COUNT(CASE WHEN ar.tab_source = 3 AND up.user_type = 'b2b' THEN 1 END) * 3
    )                                                                         AS total_amount
  FROM ads a
  JOIN ad_reads ar      ON ar.ad_id = a.id AND ar.is_billed = FALSE
  JOIN user_profiles up ON up.id = ar.user_id
  GROUP BY a.company_id, a.id, a.name
  HAVING (
    COUNT(CASE WHEN ar.tab_source = 1 AND up.user_type = 'b2c' THEN 1 END) * 3 +
    COUNT(CASE WHEN ar.tab_source = 2 AND up.user_type = 'b2c' THEN 1 END) * 3 +
    COUNT(CASE WHEN ar.tab_source = 3 AND up.user_type = 'b2c' THEN 1 END) * 1 +
    COUNT(CASE WHEN ar.tab_source = 1 AND up.user_type = 'b2b' THEN 1 END) * 5 +
    COUNT(CASE WHEN ar.tab_source = 2 AND up.user_type = 'b2b' THEN 1 END) * 5 +
    COUNT(CASE WHEN ar.tab_source = 3 AND up.user_type = 'b2b' THEN 1 END) * 3
  ) > 0
  ORDER BY a.company_id, total_amount DESC;
$$;

GRANT EXECUTE ON FUNCTION get_billing_by_ad() TO authenticated;
