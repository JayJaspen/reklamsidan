-- ============================================================
-- Fix: grant EXECUTE on billing functions to authenticated role
-- Without this, authenticated users (companies) cannot call the
-- RPC from the client and get_my_billing_current() returns no data.
-- Also recreates functions with SET search_path = public to ensure
-- the billing_summary view is correctly resolved.
-- ============================================================

-- Recreate get_my_billing_current with explicit search_path
CREATE OR REPLACE FUNCTION get_my_billing_current()
RETURNS TABLE (
  total_amount          NUMERIC,
  favorit_b2c_amount    NUMERIC,
  intresse_b2c_amount   NUMERIC,
  generell_b2c_amount   NUMERIC,
  favorit_b2b_amount    NUMERIC,
  intresse_b2b_amount   NUMERIC,
  generell_b2b_amount   NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    total_amount,
    favorit_b2c_amount,
    intresse_b2c_amount,
    generell_b2c_amount,
    favorit_b2b_amount,
    intresse_b2b_amount,
    generell_b2b_amount
  FROM billing_summary
  WHERE company_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION get_my_billing_current() TO authenticated;

-- Recreate get_my_billing_history with explicit search_path
CREATE OR REPLACE FUNCTION get_my_billing_history()
RETURNS TABLE (
  period_label  TEXT,
  total_amount  NUMERIC,
  archived_at   TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ba.period_label,
    (elem->>'total_amount')::NUMERIC AS total_amount,
    ba.archived_at AS archived_at
  FROM billing_archive ba,
       jsonb_array_elements(ba.data::jsonb) AS elem
  WHERE (elem->>'company_id') = auth.uid()::text
  ORDER BY ba.archived_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_my_billing_history() TO authenticated;

-- Recreate billing_summary view to ensure it matches latest schema
-- (including the updated ad_reads unique constraint on tab_source)
CREATE OR REPLACE VIEW billing_summary AS
SELECT
  c.id                                                          AS company_id,
  c.public_name,
  c.billing_method,
  c.billing_email,
  c.billing_address,
  c.billing_postal_code,
  c.billing_city,
  c.billing_reference,
  c.billing_email_reference,
  -- Antal läsningar
  COUNT(CASE WHEN ar.tab_source = 1 AND up.user_type = 'b2c' THEN 1 END)  AS favorit_b2c_reads,
  COUNT(CASE WHEN ar.tab_source = 2 AND up.user_type = 'b2c' THEN 1 END)  AS intresse_b2c_reads,
  COUNT(CASE WHEN ar.tab_source = 3 AND up.user_type = 'b2c' THEN 1 END)  AS generell_b2c_reads,
  COUNT(CASE WHEN ar.tab_source = 1 AND up.user_type = 'b2b' THEN 1 END)  AS favorit_b2b_reads,
  COUNT(CASE WHEN ar.tab_source = 2 AND up.user_type = 'b2b' THEN 1 END)  AS intresse_b2b_reads,
  COUNT(CASE WHEN ar.tab_source = 3 AND up.user_type = 'b2b' THEN 1 END)  AS generell_b2b_reads,
  -- Fakturabelopp (SEK exkl. moms)
  COUNT(CASE WHEN ar.tab_source = 1 AND up.user_type = 'b2c' THEN 1 END) * 3 AS favorit_b2c_amount,
  COUNT(CASE WHEN ar.tab_source = 2 AND up.user_type = 'b2c' THEN 1 END) * 3 AS intresse_b2c_amount,
  COUNT(CASE WHEN ar.tab_source = 3 AND up.user_type = 'b2c' THEN 1 END) * 1 AS generell_b2c_amount,
  COUNT(CASE WHEN ar.tab_source = 1 AND up.user_type = 'b2b' THEN 1 END) * 5 AS favorit_b2b_amount,
  COUNT(CASE WHEN ar.tab_source = 2 AND up.user_type = 'b2b' THEN 1 END) * 5 AS intresse_b2b_amount,
  COUNT(CASE WHEN ar.tab_source = 3 AND up.user_type = 'b2b' THEN 1 END) * 3 AS generell_b2b_amount,
  -- Totalt
  (
    COUNT(CASE WHEN ar.tab_source = 1 AND up.user_type = 'b2c' THEN 1 END) * 3 +
    COUNT(CASE WHEN ar.tab_source = 2 AND up.user_type = 'b2c' THEN 1 END) * 3 +
    COUNT(CASE WHEN ar.tab_source = 3 AND up.user_type = 'b2c' THEN 1 END) * 1 +
    COUNT(CASE WHEN ar.tab_source = 1 AND up.user_type = 'b2b' THEN 1 END) * 5 +
    COUNT(CASE WHEN ar.tab_source = 2 AND up.user_type = 'b2b' THEN 1 END) * 5 +
    COUNT(CASE WHEN ar.tab_source = 3 AND up.user_type = 'b2b' THEN 1 END) * 3
  )                                                              AS total_amount
FROM companies c
LEFT JOIN ads a            ON a.company_id = c.id
LEFT JOIN ad_reads ar      ON ar.ad_id = a.id AND ar.is_billed = FALSE
LEFT JOIN user_profiles up ON up.id = ar.user_id
GROUP BY c.id, c.public_name, c.billing_method, c.billing_email,
         c.billing_address, c.billing_postal_code, c.billing_city,
         c.billing_reference, c.billing_email_reference;
