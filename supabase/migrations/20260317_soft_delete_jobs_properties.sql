-- ============================================================
-- Soft-delete för jobs och properties
-- Istället för att radera rader (vilket tar bort debiteringen)
-- sätts deleted_at-kolumnen. Debiteringen bevaras tills
-- is_billed = TRUE sätts av admin vid fakturering.
-- ============================================================

-- Lägg till deleted_at på jobs
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- Lägg till deleted_at på properties
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- Index för snabba queries på aktiva poster
CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at       ON jobs(deleted_at)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_properties_deleted_at ON properties(deleted_at) WHERE deleted_at IS NULL;
