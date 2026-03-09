# Reklamsidan – Projektstatus

> Senast uppdaterad: 2026-03-09
> Stack: Next.js 15 (App Router) + Supabase (PostgreSQL + RLS + Storage)

---

## Vad är Reklamsidan?

En svensk plattform för digital reklam. Företag laddar upp reklamblad (bilder/PDF), och användare (B2C-konsumenter eller B2B-inköpare) kan bläddra bland annonser, följa favorit-leverantörer och filtrera på kategori och län.

**Tre roller:**
- `foretag` – sänder reklam, hanterar sin profil
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

**Rätt (filtrera):**
```typescript
const countyIdx = SWEDISH_COUNTIES.indexOf(searchCounty)
const { data: countyLinks } = await supabase
  .from('company_counties')
  .select('company_id')
  .eq('county_id', countyIdx + 1)
const countyIds = countyLinks.map(r => r.company_id)
query = query.in('id', countyIds)
```

---

## Databasschema (nyckeldelar)

```
companies          – företagsprofiler (id = auth.uid() för inloggat företag)
                   – sends_b2c BOOLEAN DEFAULT TRUE (ny kolumn, se migration nedan)
                   – sends_b2b BOOLEAN DEFAULT FALSE
ads                – annonser (ad_type: 'b2c' | 'b2b', valid_from/to, file_url, file_type)
active_ads         – VIEW: ads + JOIN companies, filtrerar automatiskt på aktiva datum
counties           – uppslagstabell: id SERIAL, name TEXT, code TEXT
company_counties   – join: company_id UUID + county_id INTEGER
categories_b2c     – B2C kategorier (parent_id NULL = förälder, annars underkategori)
categories_b2b     – B2B kategorier
company_categories_b2c – join: company_id + category_id
company_categories_b2b – join: company_id + category_id
user_favorites     – join: user_id + company_id
discarded_ads      – join: user_id + ad_id (bortvalda annonser)
```

**Viktigt om `active_ads`-vyn:**
```sql
SELECT a.*, c.public_name AS company_name, c.logo_url AS company_logo
FROM ads a JOIN companies c ON c.id = a.company_id
WHERE a.valid_from <= CURRENT_DATE AND a.valid_to >= CURRENT_DATE
```

`AdCard`-komponenten kräver fälten `company_name: string` och `company_logo: string | null`.
Dessa kommer från vyn ELLER måste mappas manuellt vid direktfråga mot `ads`.

---

## Migrations (körda i Supabase)

| Fil | Innehåll |
|-----|----------|
| `fix_rls_and_storage_policies.sql` | Skärpte ads RLS – tog ev. bort "alla ser aktiva annonser"-policy |
| `fix_favoriter_rls.sql` | RLS-fix för user_favorites |
| `fix_logo_rls_and_cost_limit.sql` | Logo-storage RLS + cost_limit på companies |
| `add_anon_read_categories.sql` | Anon-läsning av kategorier |
| `fix_company_counties_and_ads_rls.sql` | County RLS + ads SELECT policy (status okänd) |
| `add_sends_b2c_and_fix_all_policies.sql` | **⚠ MÅSTE KÖRAS** – Se nedan |

### ⚠ Kör denna migration i Supabase SQL Editor

`supabase/migrations/add_sends_b2c_and_fix_all_policies.sql` **HAR INTE körts** mot databasen.

Den innehåller:
1. `ALTER TABLE companies ADD COLUMN sends_b2c BOOLEAN DEFAULT TRUE` – krävs för B2C-filtrering
2. `company_counties` RLS: SELECT för alla inloggade + ALL för eget företag (fix för länval)
3. `ads` SELECT policy: återskapat "Authenticated see active ads"
4. `company_categories_b2c/b2b` ALL policy för eget företag (fix för kategorisparning)
5. `categories_b2c/b2b` INSERT policy för företag och admin (krävs för Kategorier-fliken)

---

## Filstruktur

```
src/app/(dashboard)/
├── b2c/
│   ├── all-reklam/page.tsx     – Bläddra bland B2C-annonser, filtrera på namn/kategori/län
│   ├── favoriter/page.tsx      – Mina följda företag + sökning (auto-visar alla vid sidladdning)
│   └── favoritreklam/page.tsx  – Annonser från följda företag (client component)
├── b2b/
│   ├── all-reklam/page.tsx     – Bläddra bland B2B-annonser, filtrera på namn/kategori/län
│   ├── favoriter/page.tsx      – Mina följda leverantörer + sökning (auto-visar alla vid sidladdning)
│   └── favoritreklam/page.tsx  – Annonser från följda leverantörer (client component)
├── foretag/
│   ├── statistik/page.tsx      – Statistik + aktiva annonser visas direkt
│   ├── skicka-reklam/page.tsx  – Skapa ny annons
│   ├── kategorier/page.tsx     – Lägg till kategorier (ny sida, Session 3)
│   └── min-sida/page.tsx       – Profil + länval + målgrupp (B2C/B2B) + kategorier
└── admin/
    ├── page.tsx                 – Översikt
    ├── foretag/page.tsx         – Hantera företag
    ├── annonser/page.tsx        – Hantera annonser
    └── kategorier/page.tsx      – Hantera kategorier (full CRUD)

src/components/
└── AdCard.tsx                   – Kortvy för en annons (kräver company_name + company_logo)

src/lib/
├── supabase/
│   ├── client.ts               – Klient-side Supabase-klient
│   └── server.ts               – Server-side Supabase-klient (cookies)
└── utils.ts                    – SWEDISH_COUNTIES array (22 element)
```

---

## Åtgärdade buggar (historik)

### Session 1 – 12 buggar
- Statistiksida för företag (annonser, visningar, klick)
- Min sida – fälteditoring och spara
- Favoriter – grundläggande följ/sluta-följa
- Login-flöde
- Admin-filter
- B2B-målgruppsräkning
- All-reklam-filtrering

### Session 2 – 4 buggar (2026-03-07)

| # | Bugg | Rotorsak | Fix |
|---|------|----------|-----|
| 1 | B2C Favoritreklam visade ingenting | `ads` RLS blockerade B2C-användare | Konverterat till client component |
| 2 | B2C Favoriter – inga företag i "Mina favoriter" | `.select('counties')` – kolumnen finns inte | Tagit bort `counties` från SELECT |
| 3 | B2C Favoriter – sökning returnerade inget | Klient-side-filter på `company.counties` | Länfilter via `company_counties`-tabellen |
| 4 | Min sida – länsval sparades inte | `counties: form.counties` ignoreras (kolumnen finns inte) | Ladda/spara via `company_counties` join |

### Session 3 – 7 förbättringar (2026-03-09)

| # | Uppgift | Fil(er) | Ändring |
|---|---------|---------|---------|
| 1 | Login – UX | `(auth)/login/page.tsx` | "Glömt lösenord?" flyttad under lösenordsfält; eye-knapp `tabIndex={-1}` |
| 2 | Foretag kategorier | `(dashboard)/foretag/kategorier/page.tsx` (NY) + `foretag/layout.tsx` | Ny flik "Kategorier" – företag kan lägga till B2C/B2B-kategorier med duplikatskydd |
| 3 | Statistik – aktiva annonser | `foretag/statistik/page.tsx` | Visar aktiva annonsblad direkt, eller "Du har inga aktiva reklamblad just nu" |
| 4 | Min sida – länval | `foretag/min-sida/page.tsx` | Felkontroll på DELETE + migration som fixar RLS |
| 5 | All reklam – kategorifilter | `b2c/all-reklam/page.tsx` + `b2b/all-reklam/page.tsx` | Kategori-dropdown (optgroup) i sökformuläret för både B2C och B2B |
| 6 | Favoriter – tomma resultat | `b2c/favoriter/page.tsx` + `b2b/favoriter/page.tsx` | Auto-laddar alla företag vid sidladdning; tar bort tidigt avbrott vid tom sökning |
| 7 | Målgrupp (sends_b2c) | `foretag/min-sida/page.tsx` + `(auth)/register/foretag/page.tsx` + migration | Nytt "Målgrupp"-avsnitt med B2C/B2B-kryssrutor vid registrering och i Min sida |

**Nyckelfix i Favoriter (session 3):**
- Borttagen "early return" när inga sökkriterier angetts
- B2C Favoriter: ersatt `company_categories_b2c`-baserat filter med `sends_b2c = true`
- B2B Favoriter: borttagen `sends_b2b = true` från `loadFavorites` (favoriserade företag visas alltid oavsett om de ändrar sin inriktning senare)
- Båda sidorna: `handleSearch('', '', '')` triggas automatiskt vid sidladdning

---

## Kända kvarstående problem / TODO

- [ ] **⚠ KRITISK: Kör migration** `add_sends_b2c_and_fix_all_policies.sql` i Supabase SQL Editor
- [ ] **Push till GitHub**: Kör `git push` manuellt efter att ha kontrollerat att allt ser rätt ut
- [ ] Verifiera att länval i Min sida sparas korrekt efter migration
- [ ] Verifiera att Favoriter visar företag korrekt i produktion
- [ ] Överväg att lägga till felvisning (toast/alert) vid PostgREST-fel i klientkomponenter

---

## Snabbstartkommandon

```bash
# Starta dev-server
cd Reklamsidan
npm run dev

# Pusha senaste commit
git push

# Visa senaste commits
git log --oneline -10
```
