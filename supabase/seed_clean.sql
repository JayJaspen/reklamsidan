-- ============================================================
-- REKLAMSIDAN – Seed Data (med rensning)
-- ============================================================

-- Rensa tabellerna först
TRUNCATE TABLE categories_b2c RESTART IDENTITY CASCADE;
TRUNCATE TABLE categories_b2b RESTART IDENTITY CASCADE;
TRUNCATE TABLE counties RESTART IDENTITY CASCADE;

-- ============================================================
-- COUNTIES
-- ============================================================
INSERT INTO counties (name, code, is_ehandel) VALUES
  ('Blekinge län',         'K',       FALSE),
  ('Dalarnas län',         'W',       FALSE),
  ('Gävleborgs län',       'X',       FALSE),
  ('Gotlands län',         'I',       FALSE),
  ('Hallands län',         'N',       FALSE),
  ('Jämtlands län',        'Z',       FALSE),
  ('Jönköpings län',       'F',       FALSE),
  ('Kalmar län',           'H',       FALSE),
  ('Kronobergs län',       'G',       FALSE),
  ('Norrbottens län',      'BD',      FALSE),
  ('Skåne län',            'M',       FALSE),
  ('Stockholms län',       'AB',      FALSE),
  ('Södermanlands län',    'D',       FALSE),
  ('Uppsala län',          'C',       FALSE),
  ('Värmlands län',        'S',       FALSE),
  ('Västerbottens län',    'AC',      FALSE),
  ('Västernorrlands län',  'Y',       FALSE),
  ('Västmanlands län',     'U',       FALSE),
  ('Västra Götalands län', 'O',       FALSE),
  ('Örebro län',           'T',       FALSE),
  ('Östergötlands län',    'E',       FALSE),
  ('E-handlare',           'EHANDEL', TRUE);

-- ============================================================
-- CATEGORIES B2C
-- ============================================================
INSERT INTO categories_b2c (id, name, parent_id, sort_order) VALUES
  (1,  'Mat & Dryck',             NULL, 1),
  (2,  'Mode & Kläder',           NULL, 2),
  (3,  'Hem & Inredning',         NULL, 3),
  (4,  'Elektronik & Tech',       NULL, 4),
  (5,  'Skönhet & Hälsa',         NULL, 5),
  (6,  'Sport & Fritid',          NULL, 6),
  (7,  'Barn & Familj',           NULL, 7),
  (8,  'Resor & Upplevelser',     NULL, 8),
  (9,  'Fordon & Motor',          NULL, 9),
  (10, 'Bostad & Fastighet',      NULL, 10),
  (11, 'Underhållning & Kultur',  NULL, 11),
  (12, 'Finans & Försäkring',     NULL, 12),
  (13, 'Djur',                    NULL, 13),
  (14, 'Utbildning',              NULL, 14),
  (15, 'Tjänster',                NULL, 15);

INSERT INTO categories_b2c (name, parent_id, sort_order) VALUES
  ('Dagligvaror & Livsmedel', 1, 1), ('Restaurang & Café', 1, 2),
  ('Hälsokost & Ekologiskt', 1, 3), ('Alkohol & Vin', 1, 4), ('Catering', 1, 5),
  ('Dam', 2, 1), ('Herr', 2, 2), ('Barn', 2, 3), ('Skor', 2, 4),
  ('Accessoarer & Smycken', 2, 5), ('Sportmode', 2, 6),
  ('Möbler', 3, 1), ('Inredningsdetaljer', 3, 2), ('Belysning', 3, 3),
  ('Textilier', 3, 4), ('Kök & Matlagning', 3, 5), ('Trädgård & Utomhus', 3, 6),
  ('Mobiltelefoner & Tillbehör', 4, 1), ('Datorer & Surfplattor', 4, 2),
  ('TV & Ljud', 4, 3), ('Smarta hem-produkter', 4, 4), ('Gaming', 4, 5),
  ('Hudvård', 5, 1), ('Hårvård', 5, 2), ('Makeup & Kosmetika', 5, 3),
  ('Parfym', 5, 4), ('Hälsa & Välmående', 5, 5), ('Apotek', 5, 6),
  ('Sportutrustning', 6, 1), ('Friluftsliv & Camping', 6, 2),
  ('Cykel', 6, 3), ('Gym & Träning', 6, 4), ('Jakt & Fiske', 6, 5),
  ('Leksaker & Spel', 7, 1), ('Barnkläder', 7, 2),
  ('Babyutrustning', 7, 3), ('Skola & Utbildning', 7, 4),
  ('Paketresor', 8, 1), ('Hotell & Boende', 8, 2), ('Flyg', 8, 3),
  ('Aktiviteter & Upplevelser', 8, 4), ('Kryssningar', 8, 5),
  ('Bilar', 9, 1), ('MC & Moped', 9, 2), ('Bil- & MC-tillbehör', 9, 3),
  ('Däck & Fälgar', 9, 4), ('Bilservice & Reparation', 9, 5),
  ('Mäklare', 10, 1), ('Hyresrätter', 10, 2), ('Renovering & Bygg', 10, 3),
  ('Hemförsäkring', 10, 4), ('Städ & Hemservice', 10, 5),
  ('Streaming & Media', 11, 1), ('Böcker & Tidningar', 11, 2),
  ('Musik & Konserter', 11, 3), ('Film & Teater', 11, 4), ('Spel & Hobby', 11, 5),
  ('Bank & Lån', 12, 1), ('Försäkringar', 12, 2),
  ('Pension & Sparande', 12, 3), ('Kreditkort', 12, 4),
  ('Djurfoder', 13, 1), ('Djurtillbehör', 13, 2),
  ('Veterinär', 13, 3), ('Djurservice', 13, 4),
  ('Kurser & Utbildning', 14, 1), ('Körkort', 14, 2),
  ('Språkkurser', 14, 3), ('Online-utbildning', 14, 4),
  ('Frisör & Skönhetssalong', 15, 1), ('Hantverkstjänster', 15, 2),
  ('IT-support', 15, 3), ('Juridik & Rådgivning', 15, 4);

-- ============================================================
-- CATEGORIES B2B
-- ============================================================
INSERT INTO categories_b2b (id, name, parent_id, sort_order) VALUES
  (1,  'IT & Teknik',                    NULL, 1),
  (2,  'Marknadsföring & Kommunikation', NULL, 2),
  (3,  'Juridik & Ekonomi',             NULL, 3),
  (4,  'HR & Bemanning',                 NULL, 4),
  (5,  'Logistik & Transport',           NULL, 5),
  (6,  'Fastighet & Facility',           NULL, 6),
  (7,  'Bygg & Konstruktion',            NULL, 7),
  (8,  'Industri & Tillverkning',        NULL, 8),
  (9,  'Livsmedel & Restaurang',         NULL, 9),
  (10, 'Kontorsmaterial & Förbrukning',  NULL, 10),
  (11, 'Hälsa & Friskvård',             NULL, 11),
  (12, 'Finans & Försäkring',           NULL, 12),
  (13, 'Energi & Miljö',                NULL, 13),
  (14, 'Event & Konferens',             NULL, 14),
  (15, 'Konsulting & Utbildning',       NULL, 15);

INSERT INTO categories_b2b (name, parent_id, sort_order) VALUES
  ('Mjukvara & SaaS', 1, 1), ('Hårdvara & Nätverk', 1, 2),
  ('IT-säkerhet', 1, 3), ('Molntjänster', 1, 4), ('Telecom', 1, 5),
  ('Reklambyråer', 2, 1), ('Digital marknadsföring', 2, 2),
  ('Trycksaker & Profilprodukter', 2, 3), ('PR & Media', 2, 4), ('Foto & Video', 2, 5),
  ('Redovisning & Revision', 3, 1), ('Juridiska tjänster', 3, 2),
  ('Löneadministration', 3, 3), ('Affärsjuridik', 3, 4),
  ('Rekrytering', 4, 1), ('Bemanning & Interim', 4, 2),
  ('Kompetensutveckling', 4, 3), ('HR-system', 4, 4),
  ('Frakt & Spedition', 5, 1), ('Lagerhållning', 5, 2),
  ('Budtjänster', 5, 3), ('Fordonsflottor', 5, 4),
  ('Kommersiella fastigheter', 6, 1), ('Städtjänster', 6, 2),
  ('Säkerhet & Bevakning', 6, 3), ('Energi & Miljö', 6, 4),
  ('Byggmaterial', 7, 1), ('Byggtjänster', 7, 2), ('VVS', 7, 3),
  ('El & Kraft', 7, 4), ('Arkitektur & Design', 7, 5),
  ('Maskiner & Utrustning', 8, 1), ('Råmaterial & Komponenter', 8, 2),
  ('Industriservice', 8, 3), ('Skyddsutrustning & Arbetskläder', 8, 4),
  ('Grossistleveranser', 9, 1), ('Restaurangutrustning', 9, 2),
  ('Dryckesleveranser', 9, 3), ('Catering & Events', 9, 4),
  ('Kontorsmaterial', 10, 1), ('Skrivare & Kopiatorer', 10, 2), ('Förbrukningsvaror', 10, 3),
  ('Företagshälsovård', 11, 1), ('Friskvård & Gym', 11, 2),
  ('Ergonomi', 11, 3), ('Psykosocial hälsa', 11, 4),
  ('Företagsförsäkringar', 12, 1), ('Företagslån & Leasing', 12, 2), ('Factoring & Inkasso', 12, 3),
  ('El & Energi', 13, 1), ('Solenergi', 13, 2),
  ('Miljötjänster', 13, 3), ('Avfallshantering', 13, 4),
  ('Konferensanläggningar', 14, 1), ('Teambuilding', 14, 2),
  ('AV-utrustning', 14, 3), ('Hotell & Logi', 14, 4),
  ('Managementkonsulting', 15, 1), ('Affärsutveckling', 15, 2),
  ('Coaching & Mentoring', 15, 3), ('Utbildningsprogram', 15, 4);

-- Återställ sekvenser
SELECT setval('categories_b2c_id_seq', (SELECT MAX(id) FROM categories_b2c));
SELECT setval('categories_b2b_id_seq', (SELECT MAX(id) FROM categories_b2b));
