-- Add salary range fields to jobs table
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS salary_min    INT,
  ADD COLUMN IF NOT EXISTS salary_max    INT,
  ADD COLUMN IF NOT EXISTS salary_period TEXT NOT NULL DEFAULT 'månad';
-- salary_period: 'månad' | 'år'
