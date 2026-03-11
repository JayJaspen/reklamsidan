-- Allow users to opt in to job notifications per favourite company
ALTER TABLE user_favorites
  ADD COLUMN IF NOT EXISTS notify_jobs BOOLEAN NOT NULL DEFAULT false;
