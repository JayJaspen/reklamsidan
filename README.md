# Reklamsidan

Digital reklamplattform byggd med **Next.js 15**, **Supabase** och **Tailwind CSS**.
Driftsätts på **Vercel** och når adressen **www.reklamsidan.se**.

---

## Snabbstart

### 1. Klona och installera

```bash
cd reklamsidan
npm install
```

### 2. Skapa Supabase-projekt

1. Gå till [supabase.com](https://supabase.com) → New project
2. Notera: **Project URL** och **anon key** (Settings → API)
3. Skapa en storage bucket: **`company-assets`** (Public bucket)

### 3. Konfigurera miljövariabler

```bash
cp .env.local.example .env.local
# Fyll i dina Supabase-uppgifter
```

### 4. Kör databas-schema

I Supabase → SQL Editor → New query, kör i ordning:

```sql
-- Steg 1: Skapa tabeller och policies
\i supabase/schema.sql

-- Steg 2: Fyll på med kategorier och län
\i supabase/seed.sql
```

Eller klistra in filernas innehåll direkt i SQL Editor.

### 5. Skapa admin-konto

Admin-konton skapas manuellt. I SQL Editor, efter att du skapat ett konto via `/register/b2c`:

```sql
-- Ersätt med faktiskt user-ID från auth.users
UPDATE user_profiles SET user_type = 'admin' WHERE id = 'DIN-USER-ID';
INSERT INTO admins (id, email) VALUES ('DIN-USER-ID', 'admin@reklamsidan.se');
```

### 6. Starta lokalt

```bash
npm run dev
# Öppna http://localhost:3000
```

### 7. Driftsätt på Vercel

```bash
# Installera Vercel CLI
npm i -g vercel

# Driftsätt
vercel

# Lägg till miljövariabler i Vercel Dashboard →
# Settings → Environment Variables
```

---

## Projektstruktur

```
src/
├── app/
│   ├── (auth)/               # Login + registreringssidor
│   │   ├── login/
│   │   └── register/
│   │       ├── page.tsx      # Välj kontotyp
│   │       ├── b2c/          # Privatperson
│   │       ├── b2b/          # Mottagarföretag
│   │       └── foretag/      # Annonsörföretag
│   ├── (dashboard)/
│   │   ├── admin/            # Admin (3 flikar)
│   │   ├── b2c/              # Privatperson (5 flikar)
│   │   ├── b2b/              # B2B-mottagare (5 flikar)
│   │   └── foretag/          # Annonsör (3 flikar)
│   ├── api/
│   │   └── bolagsinfo/       # Allabolag.se-integration (placeholder)
│   └── auth/callback/        # Supabase auth callback
├── components/
│   ├── DashboardNav.tsx       # Tab-navigering
│   └── AdCard.tsx             # Reklamkort med modal
└── lib/
    ├── supabase/
    │   ├── client.ts          # Browser-klient
    │   └── server.ts          # Server-klient
    └── utils.ts               # Hjälpfunktioner, konstanter
supabase/
├── schema.sql                 # Databas-schema, RLS, vyer, index
└── seed.sql                   # Kategorier och Sveriges 21 län
```

---

## Debiteringsmodell

| Kategori           | Mottagare | Pris/läsning |
|--------------------|-----------|-------------|
| Favorit-reklam     | B2C       | 3 kr exkl. moms |
| Intresse-reklam    | B2C       | 3 kr exkl. moms |
| Generell reklam    | B2C       | 1 kr exkl. moms |
| Favorit-reklam     | B2B       | 5 kr exkl. moms |
| Intresse-reklam    | B2B       | 5 kr exkl. moms |
| Generell reklam    | B2B       | 3 kr exkl. moms |

En användare debiteras **max en gång per reklamblad** oavsett hur många gånger de läser det.

---

## Allabolag.se API

Företagsuppslagningstjänsten är inbyggd som placeholder i `/api/bolagsinfo`.
För att aktivera riktig integration:
1. Registrera dig på [allabolag.se](https://www.allabolag.se) för API-åtkomst
2. Lägg till `ALLABOLAG_API_KEY` i `.env.local`
3. Uppdatera `src/app/api/bolagsinfo/route.ts`

---

## Nästa omgång (Round 2)

Planerade funktioner att bygga:
- [ ] Företag-statistik: fullständig analys med grafer
- [ ] PDF-export (admin: användarlista, företagslista, faktura)
- [ ] Supabase Storage: komplett filhantering för annonser
- [ ] Admin: kategorier CRUD (lägg till/ta bort/döp om)
- [ ] B2C/B2B: sökning i "All reklam" med kategorifiltrering
- [ ] Push-notiser när ny favorit-reklam anländer
- [ ] Faktureringsexport Excel (xlsx)

---

## Tech Stack

- **Next.js 15** – App Router
- **Supabase** – PostgreSQL + Auth + Storage + RLS
- **Tailwind CSS** – Styling
- **TypeScript** – Typsäkerhet
- **Vercel** – Driftsättning
- **lucide-react** – Ikoner
- **date-fns** – Datumhantering
- **react-hook-form + zod** – Formulärvalidering
