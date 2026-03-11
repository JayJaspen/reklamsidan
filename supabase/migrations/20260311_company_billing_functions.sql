-- Function: get current period billing for the logged-in company
-- Uses SECURITY DEFINER to safely query the billing_summary view by auth.uid()
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
LANGUAGE sql SECURITY DEFINER AS $$
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

-- Function: get billing history for the logged-in company from the archive
-- Extracts this company's rows from the billing_archive JSONB data array
CREATE OR REPLACE FUNCTION get_my_billing_history()
RETURNS TABLE (
  period_label  TEXT,
  total_amount  NUMERIC,
  archived_at   TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    ba.period_label,
    (elem->>'total_amount')::NUMERIC AS total_amount,
    ba.created_at AS archived_at
  FROM billing_archive ba,
       jsonb_array_elements(ba.data::jsonb) AS elem
  WHERE (elem->>'company_id') = auth.uid()::text
  ORDER BY ba.created_at DESC;
$$;
