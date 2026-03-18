-- Admin kan läsa alla jobb (oavsett is_active/deleted_at) för fakturering
DROP POLICY IF EXISTS "jobs_admin_read" ON jobs;
CREATE POLICY "jobs_admin_read"
  ON jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Admin kan uppdatera alla jobb (t.ex. sätta is_billed = true vid arkivering)
DROP POLICY IF EXISTS "jobs_admin_update" ON jobs;
CREATE POLICY "jobs_admin_update"
  ON jobs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- property_seeker_purchases saknar admin-policy – lägg till
DROP POLICY IF EXISTS "seeker_purchases_admin_read" ON property_seeker_purchases;
CREATE POLICY "seeker_purchases_admin_read"
  ON property_seeker_purchases FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

DROP POLICY IF EXISTS "seeker_purchases_admin_update" ON property_seeker_purchases;
CREATE POLICY "seeker_purchases_admin_update"
  ON property_seeker_purchases FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
  );
