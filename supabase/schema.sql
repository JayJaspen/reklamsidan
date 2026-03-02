-- ============================================================
-- REKLAMSIDAN – Supabase Database Schema
-- Version: 1.0.0
-- Kör detta i Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_type AS ENUM ('admin', 'b2c', 'b2b', 'company');
CREATE TYPE gender_type AS ENUM ('man', 'kvinna', 'annat');
CREATE TYPE ad_type AS ENUM ('b2c', 'b2b');
CREATE TYPE billing_method AS ENUM ('address', 'email');

-- ============================================================
-- COUNTIES (Län)
-- ============================================================
CREATE TABLE counties (
  id   SERIAL PRIMARY KEY,
  name TEXT    NOT NULL,
  code TEXT    NOT NULL UNIQUE,
  is_ehandel BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- CATEGORIES B2C
-- ============================================================
CREATE TABLE categories_b2c (
  id        SERIAL PRIMARY KEY,
  name      TEXT    NOT NULL,
  parent_id INTEGER REFERENCES categories_b2c(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES B2B
-- ============================================================
CREATE TABLE categories_b2b (
  id        SERIAL PRIMARY KEY,
  name      TEXT    NOT NULL,
  parent_id INTEGER REFERENCES categories_b2b(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE user_profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type user_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- B2C USERS
-- ============================================================
CREATE TABLE users_b2c (
  id           UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  birth_year   INTEGER NOT NULL CHECK (birth_year <= EXTRACT(YEAR FROM NOW()) - 18),
  gender       gender_type NOT NULL,
  street_address TEXT,
  postal_code  TEXT,
  city         TEXT,
  county_id    INTEGER REFERENCES counties(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users_b2c_categories (
  user_id     UUID    REFERENCES users_b2c(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories_b2c(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, category_id)
);

-- ============================================================
-- B2B USERS
-- ============================================================
CREATE TABLE users_b2b (
  id             UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_name   TEXT NOT NULL,
  org_number     TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  street_address TEXT,
  postal_code    TEXT,
  city           TEXT,
  county_id      INTEGER REFERENCES counties(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users_b2b_categories (
  user_id     UUID    REFERENCES users_b2b(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories_b2b(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, category_id)
);

-- ============================================================
-- COMPANIES (avsändare av reklam)
-- ============================================================
CREATE TABLE companies (
  id                      UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  org_number              TEXT NOT NULL UNIQUE,
  registered_name         TEXT NOT NULL,
  public_name             TEXT NOT NULL,
  logo_url                TEXT,
  contact_person          TEXT,
  contact_email           TEXT,
  contact_phone           TEXT,
  website                 TEXT,
  company_description     TEXT,
  sends_b2b               BOOLEAN DEFAULT FALSE,
  -- Faktura
  billing_method          billing_method,
  billing_address         TEXT,
  billing_postal_code     TEXT,
  billing_city            TEXT,
  billing_reference       TEXT,
  billing_email           TEXT,
  billing_email_reference TEXT,
  -- Status
  is_active               BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE company_counties (
  company_id UUID    REFERENCES companies(id) ON DELETE CASCADE,
  county_id  INTEGER REFERENCES counties(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, county_id)
);

CREATE TABLE company_categories_b2c (
  company_id  UUID    REFERENCES companies(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories_b2c(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, category_id)
);

CREATE TABLE company_categories_b2b (
  company_id  UUID    REFERENCES companies(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories_b2b(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, category_id)
);

-- ============================================================
-- ADMINS
-- ============================================================
CREATE TABLE admins (
  id    UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL
);

-- ============================================================
-- ADS (Reklamblad)
-- ============================================================
CREATE TABLE ads (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id       UUID REFERENCES companies(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  file_url         TEXT NOT NULL,
  file_type        TEXT NOT NULL,  -- 'pdf','jpg','png','mp4' etc.
  ad_type          ad_type NOT NULL,
  valid_from       DATE NOT NULL,
  valid_to         DATE NOT NULL,
  -- Targeting
  target_all       BOOLEAN DEFAULT TRUE,
  target_genders   gender_type[],          -- NULL = alla kön
  target_age_groups TEXT[],                -- ['18-25','26-35'] etc., NULL = alla åldrar
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (valid_to >= valid_from)
);

-- Länsstyrning för annonser
CREATE TABLE ad_target_counties (
  ad_id     UUID    REFERENCES ads(id) ON DELETE CASCADE,
  county_id INTEGER REFERENCES counties(id) ON DELETE CASCADE,
  PRIMARY KEY (ad_id, county_id)
);

-- Kategori-targeting B2C (avgör om annonsen hamnar på fliken "Intressereklam")
CREATE TABLE ad_target_categories_b2c (
  ad_id       UUID    REFERENCES ads(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories_b2c(id) ON DELETE CASCADE,
  PRIMARY KEY (ad_id, category_id)
);

-- Kategori-targeting B2B
CREATE TABLE ad_target_categories_b2b (
  ad_id       UUID    REFERENCES ads(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories_b2b(id) ON DELETE CASCADE,
  PRIMARY KEY (ad_id, category_id)
);

-- ============================================================
-- AD READS (läsningar – grund för fakturering)
-- En användare debiteras max 1 gång per reklamblad
-- ============================================================
CREATE TABLE ad_reads (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id       UUID REFERENCES ads(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  tab_source  SMALLINT NOT NULL CHECK (tab_source IN (1,2,3)),
  -- 1 = Favoriter, 2 = Intressereklam, 3 = All reklam
  read_at     TIMESTAMPTZ DEFAULT NOW(),
  is_billed   BOOLEAN DEFAULT FALSE,
  UNIQUE (ad_id, user_id)  -- Debiteras bara 1 gång per användare + reklamblad
);

-- ============================================================
-- USER FAVORITES (företag man följer)
-- ============================================================
CREATE TABLE user_favorites (
  user_id    UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, company_id)
);

-- ============================================================
-- SAVED ADS (sparad reklam – flik 5)
-- ============================================================
CREATE TABLE saved_ads (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id  UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  ad_id    UUID REFERENCES ads(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, ad_id)
);

-- ============================================================
-- DISCARDED ADS (slängd reklam – döljs från listor)
-- ============================================================
CREATE TABLE discarded_ads (
  user_id      UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  ad_id        UUID REFERENCES ads(id) ON DELETE CASCADE,
  discarded_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, ad_id)
);

-- ============================================================
-- BILLING ARCHIVE (exporterade fakturaunderlag)
-- ============================================================
CREATE TABLE billing_archive (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  archived_at   TIMESTAMPTZ DEFAULT NOW(),
  archived_by   UUID REFERENCES user_profiles(id),
  period_label  TEXT,  -- t.ex. "Februari 2026"
  data          JSONB NOT NULL  -- snapshot av faktureringsdatan
);

-- ============================================================
-- VIEWS
-- ============================================================

-- Faktureringsöversikt per företag (ej arkiverade läsningar)
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
LEFT JOIN ads a           ON a.company_id = c.id
LEFT JOIN ad_reads ar     ON ar.ad_id = a.id AND ar.is_billed = FALSE
LEFT JOIN user_profiles up ON up.id = ar.user_id
GROUP BY c.id, c.public_name, c.billing_method, c.billing_email,
         c.billing_address, c.billing_postal_code, c.billing_city,
         c.billing_reference, c.billing_email_reference;

-- Aktiva annonser (för visning i dashboard)
CREATE OR REPLACE VIEW active_ads AS
SELECT a.*, c.public_name AS company_name, c.logo_url AS company_logo
FROM ads a
JOIN companies c ON c.id = a.company_id
WHERE a.valid_from <= CURRENT_DATE
  AND a.valid_to   >= CURRENT_DATE;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Hjälpfunktion: hämta user_type för inloggad användare
CREATE OR REPLACE FUNCTION get_user_type(uid UUID)
RETURNS user_type AS $$
  SELECT user_type FROM user_profiles WHERE id = uid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Trigger: uppdatera updated_at automatiskt
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_b2c_updated_at   BEFORE UPDATE ON users_b2c   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER users_b2b_updated_at   BEFORE UPDATE ON users_b2b   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER companies_updated_at   BEFORE UPDATE ON companies   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER ads_updated_at         BEFORE UPDATE ON ads         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER user_profiles_updated  BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE user_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_b2c             ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_b2c_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_b2b             ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_b2b_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies             ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_counties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_categories_b2c ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_categories_b2b ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_target_counties    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_target_categories_b2c ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_target_categories_b2b ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_reads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_ads             ENABLE ROW LEVEL SECURITY;
ALTER TABLE discarded_ads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_archive       ENABLE ROW LEVEL SECURITY;

-- Categories & counties – läsbara av alla inloggade
ALTER TABLE categories_b2c ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories_b2b ENABLE ROW LEVEL SECURITY;
ALTER TABLE counties        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inloggade kan läsa kategorier B2C"
  ON categories_b2c FOR SELECT TO authenticated USING (is_active = TRUE);
CREATE POLICY "Admin kan hantera kategorier B2C"
  ON categories_b2c FOR ALL TO authenticated
  USING (get_user_type(auth.uid()) = 'admin');

CREATE POLICY "Inloggade kan läsa kategorier B2B"
  ON categories_b2b FOR SELECT TO authenticated USING (is_active = TRUE);
CREATE POLICY "Admin kan hantera kategorier B2B"
  ON categories_b2b FOR ALL TO authenticated
  USING (get_user_type(auth.uid()) = 'admin');

CREATE POLICY "Inloggade kan läsa län"
  ON counties FOR SELECT TO authenticated USING (TRUE);

-- user_profiles
CREATE POLICY "Användare ser sin egen profil"
  ON user_profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Användare skapar sin profil"
  ON user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Admin ser alla profiler"
  ON user_profiles FOR ALL TO authenticated USING (get_user_type(auth.uid()) = 'admin');

-- users_b2c
CREATE POLICY "B2C ser sin data"
  ON users_b2c FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "B2C uppdaterar sin data"
  ON users_b2c FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "B2C skapar sin profil"
  ON users_b2c FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Admin ser alla B2C"
  ON users_b2c FOR ALL TO authenticated USING (get_user_type(auth.uid()) = 'admin');

-- users_b2c_categories
CREATE POLICY "B2C hanterar sina kategorier"
  ON users_b2c_categories FOR ALL TO authenticated USING (user_id = auth.uid());

-- users_b2b
CREATE POLICY "B2B ser sin data"
  ON users_b2b FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "B2B uppdaterar sin data"
  ON users_b2b FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "B2B skapar sin profil"
  ON users_b2b FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Admin ser alla B2B"
  ON users_b2b FOR ALL TO authenticated USING (get_user_type(auth.uid()) = 'admin');

-- users_b2b_categories
CREATE POLICY "B2B hanterar sina kategorier"
  ON users_b2b_categories FOR ALL TO authenticated USING (user_id = auth.uid());

-- companies
CREATE POLICY "Företag ser sin data"
  ON companies FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Företag uppdaterar sin data"
  ON companies FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Företag skapar sin profil"
  ON companies FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Inloggade ser publika företagsuppgifter"
  ON companies FOR SELECT TO authenticated
  USING (is_active = TRUE);
CREATE POLICY "Admin hanterar företag"
  ON companies FOR ALL TO authenticated USING (get_user_type(auth.uid()) = 'admin');

-- ads – alla inloggade kan läsa aktiva annonser riktade till dem
CREATE POLICY "Inloggade ser aktiva annonser"
  ON ads FOR SELECT TO authenticated
  USING (valid_from <= CURRENT_DATE AND valid_to >= CURRENT_DATE);
CREATE POLICY "Företag hanterar sina annonser"
  ON ads FOR ALL TO authenticated USING (company_id = auth.uid());

-- ad_reads
CREATE POLICY "Användare skapar sina läsningar"
  ON ad_reads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Användare ser sina läsningar"
  ON ad_reads FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Företag ser läsningar av sina annonser"
  ON ad_reads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM ads WHERE ads.id = ad_reads.ad_id AND ads.company_id = auth.uid()));
CREATE POLICY "Admin ser alla läsningar"
  ON ad_reads FOR ALL TO authenticated USING (get_user_type(auth.uid()) = 'admin');

-- user_favorites
CREATE POLICY "Användare hanterar sina favoriter"
  ON user_favorites FOR ALL TO authenticated USING (user_id = auth.uid());

-- saved_ads
CREATE POLICY "Användare hanterar sparad reklam"
  ON saved_ads FOR ALL TO authenticated USING (user_id = auth.uid());

-- discarded_ads
CREATE POLICY "Användare hanterar slängd reklam"
  ON discarded_ads FOR ALL TO authenticated USING (user_id = auth.uid());

-- billing_archive
CREATE POLICY "Admin hanterar fakturaarkiv"
  ON billing_archive FOR ALL TO authenticated USING (get_user_type(auth.uid()) = 'admin');

-- ============================================================
-- INDEXES (prestanda)
-- ============================================================
CREATE INDEX idx_ads_company_id     ON ads(company_id);
CREATE INDEX idx_ads_valid_dates    ON ads(valid_from, valid_to);
CREATE INDEX idx_ads_type           ON ads(ad_type);
CREATE INDEX idx_ad_reads_ad_id     ON ad_reads(ad_id);
CREATE INDEX idx_ad_reads_user_id   ON ad_reads(user_id);
CREATE INDEX idx_ad_reads_billed    ON ad_reads(is_billed);
CREATE INDEX idx_user_fav_user      ON user_favorites(user_id);
CREATE INDEX idx_user_fav_company   ON user_favorites(company_id);
CREATE INDEX idx_saved_ads_user     ON saved_ads(user_id);
CREATE INDEX idx_discarded_user     ON discarded_ads(user_id);
CREATE INDEX idx_companies_active   ON companies(is_active);
