-- Track which job listings have been included in a billing cycle
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_billed BOOLEAN NOT NULL DEFAULT false;
