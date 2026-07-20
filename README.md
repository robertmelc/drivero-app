# Drivero

Správa firemního vozového parku — předávací protokoly, hlídání termínů (STK, pojištění,
dálniční známka, servis), digitální kniha jízd a appka pro řidiče. Next.js 14 (App Router)
+ PostgreSQL (Prisma).

## Co je hotové v tomhle scaffoldu

- **`prisma/schema.prisma`** — kompletní DB schéma podle návrhu (companies, users, vehicles,
  vehicle_assignments, handover_protocols, service_records, trip_log_entries, fuel_expenses,
  notifications, documents, audit_logs)
- **Auth** — registrace firmy, login, session přes httpOnly JWT cookie (`lib/auth.ts`)
- **API endpointy**:
  - `POST /api/auth/register` — založení firmy + admin účtu
  - `POST /api/auth/login`
  - `GET/POST /api/vehicles`, `GET/PATCH /api/vehicles/:id`
  - `GET/POST /api/trips`, `PATCH /api/trips/:id` (append-only logika s `edited_from_id`)
  - `GET /api/trips/export` — měsíční XLS export
  - `GET /api/notifications`
  - `GET /api/cron/check-deadlines` — denní job generující upozornění (STK/pojištění/známka/servis)
- **Homepage** (`app/page.tsx`) — reálná React/Tailwind verze marketingové stránky
- **Seed data** (`prisma/seed.ts`) — stejný demo scénář jako v prototypu (Drivero Demo s.r.o.,
  Jan Novák, Škoda Octavia 3AB 4521)

## Co ještě chybí (další kroky)

- Přihlašovací a registrační stránky (`app/login/page.tsx`, `app/register/page.tsx`) — formuláře
  jsou hotové jako mockup v `drivero-homepage.html`, zbývá je přepsat do React
  a napojit na `/api/auth/*`
- Admin dashboard, detail vozidla, appka řidiče a předávací protokol jako reálné stránky —
  vizuální předloha je v `drivero-wireframes.html`
- Upload fotek a PDF generování protokolu (endpoint `/api/documents` a `/api/handover-protocols/:id/pdf`
  z API návrhu ještě nejsou implementované)
- Odesílání e-mailů (pozvánka, upozornění, uvítací) — šablony jsou hotové
  (`drivero-invite-email.html` atd.), zbývá napojit e-mailovou službu (Resend/Postmark)

## Lokální spuštění

```bash
npm install
cp .env.example .env       # doplň DATABASE_URL a JWT_SECRET
npx prisma migrate dev     # vytvoří tabulky podle schema.prisma
npm run db:seed            # naplní demo daty
npm run dev                # http://localhost:3000
```

Demo přihlášení po seedu: `admin@drivero-demo.cz` / `demo12345`

## Databáze — Supabase

Založ si **nový Supabase projekt** pro Drivero (samostatný od projektu examen — jiná appka, jiná
databáze). V Project Settings → Database najdeš dva connection stringy:

- **Connection pooling** (port `6543`, transaction mode) → `DATABASE_URL` v `.env`
- **Connection string** (port `5432`, přímé spojení) → `DIRECT_URL` v `.env`

Prisma na Vercelu (serverless) potřebuje obě — pooler pro běžný provoz appky, direct connection
jen pro `prisma migrate`. Bez `DIRECT_URL` migrace přes pgbouncer selžou.

## Deploy (Vercel)

1. Nahraj repo na GitHub, naimportuj do Vercelu
2. V Project Settings → Environment Variables nastav `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`,
   `APP_URL`, `CRON_SECRET` (pro `/api/cron/check-deadlines`)
3. `vercel.json` už obsahuje denní cron na kontrolu termínů (6:00 UTC)
4. Doména: přidej `drivero.eu` / `app.drivero.eu` v Project Settings → Domains

## Tech stack

- Next.js 14 (App Router, Route Handlers)
- PostgreSQL + Prisma ORM
- Tailwind CSS (barvy a tokeny v `tailwind.config.ts` odpovídají vizuální identitě)
- Zod pro validaci vstupů
- jose (JWT) + bcryptjs (hashování hesel)
- xlsx pro export knihy jízd
