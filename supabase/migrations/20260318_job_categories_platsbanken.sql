-- ============================================================
-- Uppdatera job_categories med Platsbanken/SSYK-2012-struktur
-- Lägger till parent_id för yrkesområde > yrkesgrupp-hierarki
-- ============================================================

-- 1. Lägg till parent_id om den inte finns
ALTER TABLE job_categories ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES job_categories(id);

-- 2. Rensa gamla platta kategorier och jobb (dev-miljö)
--    OBS: detta tar bort befintliga jobbannonser!
DELETE FROM jobs;
DELETE FROM job_categories;
ALTER SEQUENCE job_categories_id_seq RESTART WITH 1;

-- ============================================================
-- 3. Yrkesområden (föräldrar, parent_id = NULL)
-- ============================================================
INSERT INTO job_categories (name, parent_id, sort_order) VALUES
  ('Administration, ekonomi, juridik', NULL,  10),
  ('Bygg och anläggning',             NULL,  20),
  ('Data/IT',                          NULL,  30),
  ('Försäljning, inköp, marknadsföring', NULL, 40),
  ('Hälso- och sjukvård',             NULL,  50),
  ('Hotell, restaurang, storhushåll', NULL,  60),
  ('Industri och tillverkning',        NULL,  70),
  ('Installation, drift, underhåll',  NULL,  80),
  ('Kultur, media, design',            NULL,  90),
  ('Lantbruk, trädgård, skog, fiske',  NULL, 100),
  ('Pedagogik och utbildning',         NULL, 110),
  ('Socialt arbete, vård och omsorg',  NULL, 120),
  ('Teknik och ingenjörsarbete',       NULL, 130),
  ('Transport och logistik',           NULL, 140);

-- ============================================================
-- 4. Yrkesgrupper (barn, per yrkesområde)
-- ============================================================

-- Administration, ekonomi, juridik (id=1)
INSERT INTO job_categories (name, parent_id, sort_order) VALUES
  ('Ekonomi och redovisning',      1, 11),
  ('HR och personal',              1, 12),
  ('Inköp och upphandling',        1, 13),
  ('Juridik',                      1, 14),
  ('Kontor och administration',    1, 15),
  ('Revision och controlling',     1, 16);

-- Bygg och anläggning (id=2)
INSERT INTO job_categories (name, parent_id, sort_order) VALUES
  ('Anläggning och markarbete',    2, 21),
  ('Byggnadsarbete och snickeri',  2, 22),
  ('Husteknik (VVS, el, kyla)',    2, 23),
  ('Måleri, tapetsering och golv', 2, 24),
  ('Projektering och kalkyl',      2, 25);

-- Data/IT (id=3)
INSERT INTO job_categories (name, parent_id, sort_order) VALUES
  ('Systemutveckling och programmering', 3, 31),
  ('IT-drift, support och förvaltning',  3, 32),
  ('IT-arkitektur och design',           3, 33),
  ('IT-projektledning och scrum',        3, 34),
  ('Nätverks- och systemadministration', 3, 35),
  ('Data, analys och AI',                3, 36),
  ('Cybersäkerhet',                      3, 37);

-- Försäljning, inköp, marknadsföring (id=4)
INSERT INTO job_categories (name, parent_id, sort_order) VALUES
  ('Försäljning B2B',              4, 41),
  ('Försäljning B2C och butik',    4, 42),
  ('Marknadsföring och reklam',    4, 43),
  ('E-handel och digital försäljning', 4, 44),
  ('Kundservice och support',      4, 45),
  ('Inköp och logistik',           4, 46);

-- Hälso- och sjukvård (id=5)
INSERT INTO job_categories (name, parent_id, sort_order) VALUES
  ('Läkare och specialistläkare',        5, 51),
  ('Sjuksköterskor och barnmorskor',     5, 52),
  ('Undersköterskor och vårdbiträden',   5, 53),
  ('Tandvård',                           5, 54),
  ('Farmaci och apoteksarbete',          5, 55),
  ('Sjukgymnaster och arbetsterapeuter', 5, 56),
  ('Övrig hälso- och sjukvård',          5, 57);

-- Hotell, restaurang, storhushåll (id=6)
INSERT INTO job_categories (name, parent_id, sort_order) VALUES
  ('Kockar och kallskänkor',       6, 61),
  ('Bageri och konditori',         6, 62),
  ('Servering och bar',            6, 63),
  ('Hotell och reception',         6, 64),
  ('Städ och fastighetsservice',   6, 65);

-- Industri och tillverkning (id=7)
INSERT INTO job_categories (name, parent_id, sort_order) VALUES
  ('Maskinoperatörsarbete',        7, 71),
  ('Svetsning och plåtarbete',     7, 72),
  ('Mekanik och underhåll',        7, 73),
  ('Tillverkning och montering',   7, 74),
  ('Kvalitet och produktionsteknik', 7, 75),
  ('Lager och godshantering',      7, 76);

-- Installation, drift, underhåll (id=8)
INSERT INTO job_categories (name, parent_id, sort_order) VALUES
  ('El- och automationsarbete',    8, 81),
  ('VVS-installation',             8, 82),
  ('Fastighetsskötsel och service', 8, 83),
  ('Kyla och värmepump',           8, 84),
  ('Industri- och maskinunderhåll', 8, 85);

-- Kultur, media, design (id=9)
INSERT INTO job_categories (name, parent_id, sort_order) VALUES
  ('Grafisk design och UX/UI',     9, 91),
  ('Journalistik och redaktion',   9, 92),
  ('Film, foto och ljud',          9, 93),
  ('Konst, scen och teater',       9, 94),
  ('Arkitektur och inredning',     9, 95),
  ('PR och kommunikation',         9, 96);

-- Lantbruk, trädgård, skog, fiske (id=10)
INSERT INTO job_categories (name, parent_id, sort_order) VALUES
  ('Lantbruk och djurskötsel',    10, 101),
  ('Trädgård och park',           10, 102),
  ('Skog och skogsvård',          10, 103),
  ('Fiske och jakt',              10, 104);

-- Pedagogik och utbildning (id=11)
INSERT INTO job_categories (name, parent_id, sort_order) VALUES
  ('Förskola och fritidshem',     11, 111),
  ('Grundskola (1–9)',            11, 112),
  ('Gymnasieskola',               11, 113),
  ('Vuxenutbildning och SFI',     11, 114),
  ('Högskola och forskning',      11, 115),
  ('Specialpedagogik',            11, 116);

-- Socialt arbete, vård och omsorg (id=12)
INSERT INTO job_categories (name, parent_id, sort_order) VALUES
  ('Äldreomsorg',                 12, 121),
  ('Funktionsstöd och LSS',       12, 122),
  ('Personlig assistans',         12, 123),
  ('Socialt arbete och kuratorsarbete', 12, 124),
  ('Psykologi och psykoterapi',   12, 125),
  ('Barn och ungdomsvård',        12, 126);

-- Teknik och ingenjörsarbete (id=13)
INSERT INTO job_categories (name, parent_id, sort_order) VALUES
  ('Maskinteknik och mekanik',    13, 131),
  ('El- och energiteknik',        13, 132),
  ('Byggteknik och konstruktion', 13, 133),
  ('Kemi och processteknik',      13, 134),
  ('Miljöteknik och hållbarhet',  13, 135),
  ('Produktionsteknik och lean',  13, 136);

-- Transport och logistik (id=14)
INSERT INTO job_categories (name, parent_id, sort_order) VALUES
  ('Yrkestrafik – lastbil och truck', 14, 141),
  ('Persontransporter – buss och taxi', 14, 142),
  ('Lager och terminal',          14, 143),
  ('Flyg och sjöfart',            14, 144),
  ('Post, bud och distribution',  14, 145),
  ('Logistik och supply chain',   14, 146);
