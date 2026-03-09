# Reklamsidan – Projektstatus

> Senast uppdaterad: 2026-03-09 (Session 4)
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
                       – is_active BOOLEAN (admin kan spärra konton)
ads                    – annonser (ad_type: 'b2c'|'b2b', valid_from/to, file_url, file_type)
saved_ads              – join: user_id + ad_id + saved_at TIMESTAMPTZ
ad_reads               – join: ad_id + user_id + read_at + tab_source
user_favorites         – join: user_id + company_id (följande)
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
│   ├── favoriter/page.tsx       – Mina följda företag + sökning (auto-visar alla vid sidladdning)
│   ├── favoritreklam/page.tsx   – Annonser från följda företag (client component)
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
│   └── min-sida/page.tsx        – Profil + länval + målgrupp (B2C/B2B) + kategorier
└── admin/
    ├── page.tsx                  – Översikt
    ├── foretag/page.tsx          – Hantera företag (inkl. Spärra konto + bekräftelsedialog)
    ├── annonser/page.tsx         – Hantera annonser
    └── kategorier/page.tsx       – Hantera kategorier (full CRUD)

src/components/
├── AdCard.tsx                    – Kortvy för en annons (visar PDF via PdfViewer)
├── PdfViewer.tsx                 – Blädderbar PDF-visare med PDF.js (prev/next + "Sida X av Y")
└── DashboardNav.tsx              – Navigation (logo uppdaterad)

src/lib/
├── supabase/
│   ├── client.ts                 – Klient-side Supabase-klient
│   └── server.ts                 – Server-side Supabase-klient (cookies)
├── webpush.ts                    – Web Push (VAPID, AES-128-GCM) – Uint8Array<ArrayBuffer>
└── utils.ts                      – SWEDISH_COUNTIES array (22 element)

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

## Senaste git-commits

```
16ffaac feat: lägg till årsavgift 499 kr i prislistan på statistiksidan
477070c feat: blädderbar PDF-visare (häftesvy) med PDF.js
5360928 fix: RLS-policyer för sparad reklam och kategoriintresse
4cbde8b style: replace megaphone icon with logo in page footer
0852894 feat: correct audience count + admin block company accounts
a946ed2 style: crop logo whitespace, slim headers, larger logo text
57ac9c7 fix: rewrite b2b/sparad useEffect with async/await to fix .catch() error
4b9c018 fix: rewrite b2c/sparad useEffect with async/await to fix .catch() error
2f1eb53 fix: larger logo, logo on login page, fix sparad-reklam loading
14f7037 style: increase logo size in header and dashboard nav
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
