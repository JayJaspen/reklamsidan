-- ============================================================
-- Jobbmarknad (Job Market) tables
-- ============================================================

-- Job categories (managed in Supabase dashboard / admin)
CREATE TABLE IF NOT EXISTS job_categories (
  id         SERIAL PRIMARY KEY,
  name       TEXT    NOT NULL,
  sort_order INT     NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO job_categories (name, sort_order) VALUES
  ('IT & Teknik',              10),
  ('Ekonomi & Finans',         20),
  ('Marknadsföring & Sälj',    30),
  ('Vård & Omsorg',            40),
  ('Utbildning & Forskning',   50),
  ('Bygg & Fastighet',         60),
  ('Transport & Logistik',     70),
  ('Restaurang & Hotell',      80),
  ('Handel & Butik',           90),
  ('Kontor & Administration', 100),
  ('Industri & Produktion',   110),
  ('Media & Kommunikation',   120),
  ('Juridik',                 130),
  ('Övrigt',                  999);

-- Jobs posted by companies
CREATE TABLE IF NOT EXISTS jobs (
  id               BIGSERIAL PRIMARY KEY,
  company_id       UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  description      TEXT        NOT NULL,
  category_id      INT         NOT NULL REFERENCES job_categories(id),
  county           TEXT,           -- NULL means remote
  city             TEXT,           -- NULL means remote or not specified
  is_remote        BOOLEAN     NOT NULL DEFAULT false,
  contact_email    TEXT,
  application_url  TEXT,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at();

-- Indexes for common filter queries
CREATE INDEX IF NOT EXISTS idx_jobs_company_id   ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_category_id  ON jobs(category_id);
CREATE INDEX IF NOT EXISTS idx_jobs_county        ON jobs(county);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active     ON jobs(is_active);

-- ============================================================
-- Row-Level Security
-- ============================================================

ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs           ENABLE ROW LEVEL SECURITY;

-- job_categories: anyone can read active categories
CREATE POLICY "job_categories_public_read"
  ON job_categories FOR SELECT
  USING (is_active = true);

-- jobs: anyone authenticated can read active jobs
CREATE POLICY "jobs_authenticated_read"
  ON jobs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- jobs: companies can insert their own jobs
CREATE POLICY "jobs_company_insert"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (company_id = auth.uid());

-- jobs: companies can update their own jobs
CREATE POLICY "jobs_company_update"
  ON jobs FOR UPDATE
  TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- jobs: companies can delete their own jobs
CREATE POLICY "jobs_company_delete"
  ON jobs FOR DELETE
  TO authenticated
  USING (company_id = auth.uid());
