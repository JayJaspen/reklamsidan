# Reklamsidan – Projektstatus

> Senast uppdaterad: 2026-03-16 (Session 8)
> Stack: Next.js 15 (App Router) + Supabase (PostgreSQL + RLS + Storage) + Tailwind CSS

---

## Vad är Reklamsidan?

En svensk plattform för digital reklam. Företag laddar upp reklamblad (bilder/PDF/MP4), och användare (B2C-konsumenter eller B2B-inköpare) kan bläddra bland annonser, följa favoritleverantörer och filtrera på kategori och län.

**Fyra roller:**
- `foretag` – sänder reklam, hanterar sin profil, ser statistik
- `b2c` – privatpersoner som ser B2C-annonser
- `b2b` – inköpare som ser B2B-annonser
- `admin` – administrerar hela plattformen

---

## Kritisk databaskunskap

### `counties`-kolumnen finns INTE på `companies`

Det vanligaste misstaget i koden. Kommunerna lagras i en separat join-tabell:

```sql
company_counties (
  company_id UUID,   -- referens till companies.id
  county_id  INTEGER -- referens till counties.id (1–22)
)
```

`SWEDISH_COUNTIES`-arrayen i `src/lib/utils.ts` innehåller 22 element.
Mapping: `SWEDISH_COUNTIES[i]` ↔ `county_id = i + 1` i databasen.

**Aldrig:**
```typescript
.select('id, public_name, counties')   // fel – kolumnen finns inte!
.contains('counties', [filter.county]) // fel – kolumnen finns inte!
counties: form.counties                // fel – sparas inte!
```

**Rätt (läsa):**
```typescript
const { data } = await supabase
  .from('company_counties')
  .select('county_id')
  .eq('company_id', userId)
const names = (data ?? []).map(r => SWEDISH_COUNTIES[r.county_id - 1]).filter(Boolean)
```

**Rätt (spara):**
```typescript
await supabase.from('company_counties').delete().eq('company_id', userId)
const inserts = form.counties.map(name => {
  const idx = SWEDISH_COUNTIES.indexOf(name)
  return idx >= 0 ? { company_id: userId, county_id: idx + 1 } : null
}).filter(Boolean)
if (inserts.length > 0) await supabase.from('company_counties').insert(inserts)
```

### Supabase-querys returnerar `PromiseLike`, inte `Promise`

`.catch()` finns INTE på `PromiseLike`. Använd alltid `async/await` + `try/catch/finally`:

```typescript
// FEL
useEffect(() => {
  supabase.from('...').select('...').then(...).catch(...) // catch saknas!
}, [])

// RÄTT
useEffect(() => {
  async function load() {
    try {
      const { data, error } = await supabase.from('...').select('...')
      if (error) throw error
      setData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  load()
}, [])
```

---

## Databasschema (nyckeldelar)

```
companies              – företagsprofiler (id = auth.uid() för inloggat företag)
                       – sends_b2c BOOLEAN DEFAULT TRUE
                       – sends_b2b BOOLEAN DEFAULT FALSE
                       – is_active BOOLEAN (admin kan spärra konton; sätts FALSE vid "Avsluta tjänsten")
ads                    – annonser (ad_type: 'b2c'|'b2b', valid_from/to, file_url, file_type)
                       – is_published BOOLEAN NOT NULL DEFAULT TRUE (avpublicera utan att ta bort)
saved_ads              – join: user_id + ad_id + saved_at TIMESTAMPTZ
ad_reads               – join: ad_id + user_id + read_at + tab_source
                       – UNIQUE constraint: (ad_id, user_id, tab_source) – en rad per tab per användare
user_favorites         – join: user_id + company_id + notify_jobs BOOLEAN DEFAULT false
discarded_ads          – join: user_id + ad_id (bortvalda annonser)
users_b2c              – B2C-profiler (gender, birth_year, county_id)
users_b2b              – B2B-profiler (company_name, county_id)
users_b2c_categories   – join: user_id + category_id (B2C kategoriintresse)
users_b2b_categories   – join: user_id + category_id (B2B kategoriintresse)
categories_b2c         – B2C-kategorier (parent_id NULL = förälder)
categories_b2b         – B2B-kategorier
company_counties       – join: company_id + county_id
user_profiles          – alla användare (id, user_type: 'b2c'|'b2b'|'admin')
```

---

## Migrations (körda i Supabase)

Alla filer ligger i `supabase/migrations/`. Kör dem i Supabase Dashboard → SQL Editor.

| Fil | Innehåll | Status |
|-----|----------|--------|
| `fix_rls_and_storage_policies.sql` | ads RLS, storage-policies | ✅ Körd |
| `fix_favoriter_rls.sql` | RLS för user_favorites, company_select_own_favorites | ✅ Körd |
| `fix_logo_rls_and_cost_limit.sql` | Logo-storage RLS + cost_limit på companies | ✅ Körd |
| `add_anon_read_categories.sql` | Anon-läsning av kategorier | ✅ Körd |
| `fix_company_counties_and_ads_rls.sql` | County RLS + ads SELECT-policy | ✅ Körd |
| `add_sends_b2c_and_fix_all_policies.sql` | sends_b2c-kolumn, category RLS | ✅ Körd |
| `add_push_subscriptions.sql` | Push-notiser (web push subscriptions) | ✅ Körd |
| `add_storage_security.sql` | Storage bucket-policies | ✅ Körd |
| `fix_saved_ads_and_category_rls.sql` | **Session 4** – se nedan | ✅ Körd |
| `fix_ad_reads_unique_constraint.sql` | **Session 5** – byt UNIQUE-constraint på ad_reads | ✅ Körd |
| `fix_companies_ad_count_filter.sql` | **Session 5** – RPC get_companies_with_ad_count + p_company_ids | ✅ Körd |
| `add_is_published_to_ads.sql` | **Session 5** – is_published kolumn + ny active_ads-vy | ✅ Körd |
| `20260311_jobbmarknad.sql` | **Session 6** – job_categories + jobs tabeller + RLS | ✅ Körd |
| `20260311_jobs_salary.sql` | **Session 6** – salary_min, salary_max, salary_period på jobs | ✅ Körd |
| `20260311_jobs_deadline.sql` | **Session 6** – application_deadline (DATE) på jobs | ✅ Körd |
| `20260311_user_favorites_notify_jobs.sql` | **Session 6** – notify_jobs BOOLEAN på user_favorites | ⬜ Kör i Supabase |
| `20260311_fix_ad_count_published.sql` | **Session 6** – RPC filterar nu på is_published = TRUE | ⬜ Kör i Supabase |
| `20260311_jobs_is_billed.sql` | **Session 7** – is_billed BOOLEAN på jobs (faktureringsspårning) | ⬜ Kör i Supabase |
| `20260316_session8_fixes.sql` | **Session 8** – billing_archive.jobs_data, jobs_company_read_own, expire_outdated_jobs(), companies read policy | ⬜ Kör i Supabase |

### `fix_saved_ads_and_category_rls.sql` (Session 4)

Löser två buggar:

1. **Sparad reklam visades inte** – `ads` RLS-policyn `"Authenticated see active ads"` blockerade utgångna annonser. Ny policy `"Users can read own saved ads"` låter användare läsa sina sparade annonser oavsett `valid_to`.

2. **Målgrupp uppdaterades inte vid kategorival** – `users_b2c_categories` och `users_b2b_categories` hade `USING (user_id = auth.uid())` vilket blockerade företagskonton. Nya policies `"Companies can read category interests b2c/b2b"` låter företag läsa alla rader.

---

## Filstruktur

```
src/app/(dashboard)/
├── b2c/
│   ├── all-reklam/page.tsx      – Bläddra bland B2C-annonser, filtrera på namn/kategori/län
│   ├── favoriter/page.tsx       – Mina följda företag + notify_jobs-toggle per bolag + sökning
│   ├── favoritreklam/page.tsx   – Annonser + jobbannonser från följda företag (server component)
│   ├── jobbmarknad/page.tsx     – Jobbannonser med filter, visar ej förrän "Sök jobb" klickas
│   └── sparad/page.tsx          – Sparad reklam (async/await + try/finally)
├── b2b/
│   ├── all-reklam/page.tsx      – Bläddra bland B2B-annonser, filtrera på namn/kategori/län
│   ├── favoriter/page.tsx       – Mina följda leverantörer + sökning
│   ├── favoritreklam/page.tsx   – Annonser från följda leverantörer (client component)
│   └── sparad/page.tsx          – Sparad reklam (async/await + try/finally)
├── foretag/
│   ├── statistik/page.tsx       – Statistik + aktiva annonser + prislista (inkl. årsavgift 499 kr)
│   ├── skicka-reklam/page.tsx   – Skapa ny annons (målgruppsräknare med Set-union)
│   ├── kategorier/page.tsx      – Lägg till kategorier
│   ├── jobbmarknad/page.tsx     – Publicera/redigera/ta bort jobbannonser
│   └── min-sida/page.tsx        – Profil + länval + målgrupp (B2C/B2B) + kategorier
└── admin/
    ├── page.tsx                  – Översikt
    ├── foretag/page.tsx          – Hantera företag (inkl. Spärra konto + bekräftelsedialog)
    ├── annonser/page.tsx         – Hantera annonser
    └── kategorier/page.tsx       – Hantera kategorier (full CRUD)

src/components/
├── AdCard.tsx                    – Kortvy för en annons; onConflict: 'ad_id,user_id,tab_source'
├── PdfViewer.tsx                 – Blädderbar PDF-visare med PDF.js (prev/next + "Sida X av Y")
├── NotificationPermission.tsx    – Auto-aktiverar push vid sidladdning (1.5s fördröjning)
└── DashboardNav.tsx              – Navigation (logo uppdaterad)

src/lib/
├── supabase/
│   ├── client.ts                 – Klient-side Supabase-klient
│   └── server.ts                 – Server-side Supabase-klient (cookies)
├── webpush.ts                    – Web Push (VAPID, AES-128-GCM) – Uint8Array<ArrayBuffer>
└── utils.ts                      – SWEDISH_COUNTIES (22), JOB_COUNTIES (21), CITIES_BY_COUNTY

public/
├── logo.png                      – Beskuren logotyp (853×254, 20px marginal)
├── pdf.worker.min.mjs            – PDF.js worker (serveras statiskt för PdfViewer)
└── favicon/icons/manifest        – PWA-ikoner
```

---

## Åtgärdade buggar / förbättringar per session

### Session 1
- Statistiksida för företag, Min sida, Favoriter, Login-flöde, Admin-filter, B2B-målgrupp, All-reklam-filtrering

### Session 2 (2026-03-07)

| # | Bugg | Fix |
|---|------|-----|
| 1 | B2C Favoritreklam visade ingenting | Konverterat till client component, RLS-fix |
| 2 | B2C Favoriter – inga företag | `.select('counties')` tog bort (kolumnen finns inte) |
| 3 | B2C Favoriter – sökning returnerade inget | Länfilter via `company_counties`-tabellen |
| 4 | Min sida – länsval sparades inte | Ladda/spara via `company_counties` join-tabell |

### Session 3 (2026-03-09)

| # | Uppgift | Fil(er) |
|---|---------|---------|
| 1 | Login UX – "Glömt lösenord?" under lösenordsfält | `(auth)/login/page.tsx` |
| 2 | Ny flik "Kategorier" för företag | `foretag/kategorier/page.tsx` (ny) |
| 3 | Statistik – aktiva annonsblad visas direkt | `foretag/statistik/page.tsx` |
| 4 | Min sida – länval felkontroll | `foretag/min-sida/page.tsx` |
| 5 | All reklam – kategorifilter (optgroup) | `b2c/all-reklam/` + `b2b/all-reklam/` |
| 6 | Favoriter – auto-laddar alla vid sidladdning | `b2c/favoriter/` + `b2b/favoriter/` |
| 7 | Målgrupp sends_b2c/b2b vid registrering | `foretag/min-sida/` + `register/foretag/` |

### Session 5 (2026-03-10)

| # | Uppgift | Fil(er) | Detalj |
|---|---------|---------|--------|
| 1 | Faktureringsbugg – intressereklam debiterades 1 kr istf 3 kr | `AdCard.tsx` + `fix_ad_reads_unique_constraint.sql` | UNIQUE-constraint ändrad till `(ad_id, user_id, tab_source)`; upsert-nyckel uppdaterad |
| 2 | N+1-query i All reklam-sidor | `b2c/all-reklam/` + `b2b/all-reklam/` + `fix_companies_ad_count_filter.sql` | RPC `get_companies_with_ad_count` fick ny parameter `p_company_ids UUID[]` |
| 3 | Avpublicera aktiv annons (Statistik-fliken) | `foretag/statistik/page.tsx` + `add_is_published_to_ads.sql` | `is_published = false` istf att ändra `valid_to` (undviker CHECK-constraint) |
| 4 | Målgruppsräknare visade 0 | `foretag/skicka-reklam/page.tsx` | Filtrar på `birth_year`-kolumnen (inte `age_group` som inte finns) |
| 5 | Färgschema → lila/violet (premium-känsla) | `tailwind.config.js` | primary-paletten bytt från blå → amber → purple/violet |
| 6 | Logotypfärg mörkare blå + skarpare | `public/logo.png` | PIL/Pillow: cyan → #1a56db + UnsharpMask |
| 7 | "Avsluta tjänsten" för företag (Min sida) | `foretag/min-sida/page.tsx` | Sätter `companies.is_active = false` → loggar ut → redirect `/` |
| 8 | "Avsluta tjänsten" för B2C-användare | `b2c/min-sida/page.tsx` | Raderar `users_b2c`-rad → loggar ut → redirect `/` |
| 9 | "Avsluta tjänsten" för B2B-användare | `b2b/min-sida/page.tsx` | Raderar `users_b2b`-rad → loggar ut → redirect `/` |
| 10 | Push-notiser auto-aktiveras vid sidladdning | `NotificationPermission.tsx` | `Notification.requestPermission()` triggas automatiskt efter 1,5 s om tillstånd är 'default'; re-prenumererar tyst om 'granted' men ingen aktiv sub |
| 11 | active_ads-vy återskapad med JOIN | Supabase SQL (direkt) | `DROP VIEW` + `CREATE VIEW` med `JOIN companies` + `is_published = TRUE` |

### Session 6 (2026-03-11)

| # | Uppgift | Fil(er) | Detalj |
|---|---------|---------|--------|
| 1 | Jobbmarknad för företag | `foretag/jobbmarknad/page.tsx` (ny) | Publicera/redigera/ta bort jobbannonser med titel, beskrivning, kategori, lön, plats/distans, sista ansökningsdag, kontakt |
| 2 | Jobbmarknad för B2C | `b2c/jobbmarknad/page.tsx` (ny) | Filtrera jobb på kategori/län/stad – visar INGET förrän "Sök jobb" klickas |
| 3 | Jobbmarknad-flik i navigation | `foretag/layout.tsx` + `b2c/layout.tsx` | 💼 Jobbmarknad tillagd i båda naverna |
| 4 | JOB_COUNTIES + CITIES_BY_COUNTY | `src/lib/utils.ts` | 21 svenska län + städer per län |
| 5 | Supabase: job_categories + jobs | `20260311_jobbmarknad.sql` | 14 kategorier, RLS-policies |
| 6 | Lönespann i jobbannonser | `foretag/jobbmarknad/` + `b2c/jobbmarknad/` + `20260311_jobs_salary.sql` | salary_min/max/period, synligt direkt i kortvy |
| 7 | Sista ansökningsdatum | `foretag/jobbmarknad/` + `b2c/jobbmarknad/` + `20260311_jobs_deadline.sql` | application_deadline (DATE), synligt i orange i kortvy |
| 8 | URL-normalisering i jobbformulär | `foretag/jobbmarknad/page.tsx` | Lägger till https:// automatiskt om det saknas |
| 9 | E-post som text (ej länk) i B2C | `b2c/jobbmarknad/page.tsx` | Kandidater ser e-postadressen som ren text |
| 10 | notify_jobs-toggle i Favoriter | `b2c/favoriter/page.tsx` + `20260311_user_favorites_notify_jobs.sql` | Per favoritföretag: slå på/av jobbannonser i Favoritreklam |
| 11 | Jobbannonser i Favoritreklam | `b2c/favoritreklam/page.tsx` | Sektion "💼 Jobbannonser från dina favoriter" visas om notify_jobs = true för ≥1 bolag |
| 12 | Fix annonsräkning i All reklam | `b2c/all-reklam/page.tsx` + `20260311_fix_ad_count_published.sql` | RPC räknade opublicerade utkast – lade till is_published = TRUE filter |
| 13 | Push-notiser: push_subscriptions tom | Diagnos | Auto-prompt tystas av webbläsaren om ingen interaktion. Lösning: klicka klock-ikonen manuellt. Nästa steg: mer synlig notis-banner |
| 14 | Bugfix: Kan ej läsa jobbannonser i Favoritreklam | `b2c/favoritreklam/page.tsx` | Kortvy hade ingen expand-funktion. Ersatt med `<details>/<summary>` som visar full beskrivning + ansök-knapp |
| 15 | Bugfix: PWA mobil visar blandat innehåll (Favoritreklam + Favoriter) | `b2c/favoritreklam/page.tsx` | Lade till `export const dynamic = 'force-dynamic'` – Next.js serverade cachad sida |

### Session 8 (2026-03-16)

| # | Uppgift | Fil(er) | Detalj |
|---|---------|---------|--------|
| 1 | Arkiverade fakturor synliga i admin | `admin/fakturering/page.tsx` | "Visa arkiv"-knapp visar tidigare perioder med utfällbar detalj per bolag |
| 2 | Jobbannonser integrerade i företagets faktureringsrad | `admin/fakturering/page.tsx` | Bolag med ENBART jobbannonser (ej i billing_summary) visas nu i samma tabell. Jobs ingår i företagets expanderade vy |
| 3 | Länfiltrering fungerar i admin Användare | `admin/anvandare/page.tsx` | `county_id`-matchning mot `SWEDISH_COUNTIES`-index – filtret applicerades inte tidigare |
| 4 | Jobbannonser avpubliceras automatiskt | `b2c/jobbmarknad/page.tsx` + `20260316_session8_fixes.sql` | Query filtrerar bort utgångna jobb (`application_deadline < idag`). SQL-funktion `expire_outdated_jobs()` + pg_cron-instruktioner i migrationen |
| 5 | Logotyp visas på jobbannonser för B2C | `b2c/jobbmarknad/page.tsx` | Företagsinfo hämtas separat (istf embedded join) – mer tillförlitligt för B2C-användare |
| 6 | Företag kan se avpublicerade egna jobb | `20260316_session8_fixes.sql` | Policy `jobs_company_read_own` – tidigare visade RLS bara `is_active=true` |
| 7 | billing_archive sparar nu även jobbannonser | `admin/fakturering/page.tsx` + `20260316_session8_fixes.sql` | Ny kolumn `jobs_data JSONB` – arkivering inkluderar både reklamblad och jobb |

### Session 7 (2026-03-11)

| # | Uppgift | Fil(er) | Detalj |
|---|---------|---------|--------|
| 1 | Bugfix: Kan ej läsa jobbannonser i Favoritreklam | `b2c/favoritreklam/page.tsx` | Jobb visades i kompakt rad utan expandmöjlighet. Bytt till `<details>/<summary>` – klicka kortet för att läsa full beskrivning + ansök-knapp |
| 2 | Bugfix: PWA mobil blandat innehåll (Favoritreklam + Favoriter) | `b2c/favoritreklam/page.tsx` | Saknades `export const dynamic = 'force-dynamic'` → Next.js cachade sidan och blandade innehåll. Tillagt. |
| 3 | Prisinformation i Jobbmarknad | `foretag/jobbmarknad/page.tsx` | Infobanner: "1 490 kr exkl. moms – debiteras på nästkommande kvartalsfaktura" |
| 4 | Avpublicera/återpublicera jobbannons | `foretag/jobbmarknad/page.tsx` | EyeOff/Eye-knapp per annons, "Avpublicerad"-badge, `is_active`-toggle |
| 5 | Jobbannonser i admin Fakturering | `admin/fakturering/page.tsx` + `20260311_jobs_is_billed.sql` | Separat tabell för jobbannonser (1 490 kr/st), rubrik ingår i Excel-export och arkivering markerar `is_billed = true` |

### Session 4 (2026-03-09)

| # | Uppgift | Fil(er) | Detalj |
|---|---------|---------|--------|
| 1 | TypeScript-fix `webpush.ts` | `src/lib/webpush.ts` | `Uint8Array<ArrayBuffer>` genomgående, `encryptPayload` returnerar `Uint8Array` istf `Buffer` |
| 2 | Logga större på landningssidan | `src/app/page.tsx` | h-24, ny aspektratio 853×254 |
| 3 | Logga beskuren (ta bort vit yta) | `public/logo.png` | ImageMagick trim + 20px kant |
| 4 | Logga i auth-layout (login/register) | `src/app/(auth)/layout.tsx` | Ersatte megafon-ikon med `<Image src="/logo.png">` |
| 5 | Logga i footer | `src/app/page.tsx` | Ersatte megafon-ikon i footer |
| 6 | Smalare header, större logga | `DashboardNav.tsx` + `page.tsx` | h-14 header, logo 200×60 |
| 7 | Sparad reklam laddade inte | `b2c/sparad/` + `b2b/sparad/` | Rewrite med async/await + try/finally, `setLoading(false)` i finally |
| 8 | Målgruppsräknare – korrekt logik | `foretag/skicka-reklam/page.tsx` | Set-union: followers + kategoriintresserade → demografifilter |
| 9 | Admin – spärra företagskonton | `admin/foretag/page.tsx` | Bekräftelsedialog + ShieldOff/ShieldCheck-ikoner |
| 10 | RLS-fix sparad reklam | `supabase/migrations/fix_saved_ads_and_category_rls.sql` | Policy: users kan läsa egna sparade annonser oavsett `valid_to` |
| 11 | RLS-fix kategoriintresse | samma migration | Policy: företag kan läsa `users_b2c/b2b_categories` |
| 12 | Blädderbar PDF-visare | `src/components/PdfViewer.tsx` (ny) | PDF.js, canvas-rendering, prev/next, "Sida X av Y" |
| 13 | AdCard använder PdfViewer | `src/components/AdCard.tsx` | Ersatte `<iframe>` med `<PdfViewer>` för PDF-filer |
| 14 | Årsavgift i prislistan | `foretag/statistik/page.tsx` | Gul rad "Årsavgift – 499 kr/år" ovanför B2C/B2B-korten |

---

## Prissättning (som visas i appen)

| Typ | Situation | Pris |
|-----|-----------|------|
| B2C | Favorit- & intressereklam | 3 kr/läsning |
| B2C | Generell reklam | 1 kr/läsning |
| B2B | Favorit- & intressereklam | 5 kr/läsning |
| B2B | Generell reklam | 3 kr/läsning |
| — | Årsavgift | 499 kr/år |

---

## ⚠️ Viktigt – git-arbetsflöde

Ändringar som görs i filerna av Claude (via editor) sparas direkt på disk men **committas inte automatiskt**. Du måste alltid köra:

```bash
git add -A
git commit -m "beskrivning"
git push
```

Annars deployas aldrig ändringarna till Vercel, även om du trycker "push" i ett GUI-verktyg utan att ha committat.

---

## Senaste git-commits (Session 6)

```
feat: add application deadline to job listings
feat: add salary range to job listings
fix: normalize application URL, show email as plain text in job listings
feat: job listings show collapsed cards, expand on click to reveal description
fix: correct companies join type in b2c jobbmarknad
feat: add Jobbmarknad feature for B2C and company dashboards
fix: jobbmarknad manual search, favorites job notify toggle, ad count published filter
```

### Commits att köra (ej pushade ännu om session avbröts):
```powershell
git add "src/app/(dashboard)/b2c/jobbmarknad/page.tsx" `
        "src/app/(dashboard)/b2c/favoriter/page.tsx" `
        "src/app/(dashboard)/b2c/favoritreklam/page.tsx" `
        supabase/migrations/20260311_user_favorites_notify_jobs.sql `
        supabase/migrations/20260311_fix_ad_count_published.sql `
        PROJEKT_STATUS.md
git commit -m "fix: jobbmarknad manual search, favorites job notify toggle, ad count published filter"
git push
```

### SQL att köra i Supabase (ej körda):
```sql
-- 1. notify_jobs-kolumn
ALTER TABLE user_favorites
  ADD COLUMN IF NOT EXISTS notify_jobs BOOLEAN NOT NULL DEFAULT false;

-- 2. Fix annonsräkning
CREATE OR REPLACE FUNCTION get_companies_with_ad_count(
  p_type TEXT, p_company_ids UUID[] DEFAULT NULL, p_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (id UUID, public_name TEXT, logo_url TEXT, ad_count BIGINT)
LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT c.id, c.public_name, c.logo_url, COUNT(a.id) AS ad_count
  FROM companies c
  LEFT JOIN ads a ON a.company_id = c.id AND a.ad_type = p_type::ad_type
    AND a.valid_from <= p_date AND a.valid_to >= p_date AND a.is_published = TRUE
  WHERE c.is_active = TRUE
    AND CASE WHEN p_type = 'b2c' THEN c.sends_b2c ELSE c.sends_b2b END = TRUE
    AND (p_company_ids IS NULL OR c.id = ANY(p_company_ids))
  GROUP BY c.id, c.public_name, c.logo_url ORDER BY c.public_name;
$$;
GRANT EXECUTE ON FUNCTION get_companies_with_ad_count(TEXT, UUID[], DATE) TO authenticated;
```

---

## Snabbstartkommandon

```bash
# Starta dev-server
cd Reklamsidan
npm run dev

# Pusha senaste commits
git push

# Visa senaste commits
git log --oneline -10
```
