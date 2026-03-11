-- Add application deadline to jobs table
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS application_deadline DATE;
