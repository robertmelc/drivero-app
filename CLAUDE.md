# Drivero — kontext projektu pro Claude Code

## Co appka je

Drivero (drivero.eu) je česká B2B SaaS appka na správu vozového parku pro malé a střední firmy — bez GPS hardwaru. Řidič si zapisuje jízdy, tankování a účast na předání vozidla sám z telefonu.

## Proč vznikla

Zakladatel (Robert) řešil s manželkou situaci, kdy firemní auto přecházelo mezi kolegy bez jasného předávacího protokolu — nikdo přesně nevěděl, kdo je za auto zodpovědný a v jakém je stavu. Výsledkem byl zničený motor (oprava v autorizovaném servisu ~300 000 Kč, nakonec vyřešeno levněji v neautorizovaném servisu) a později pokuta 500 Kč za propadlou STK, protože si toho zase nikdo nevšiml.

Z toho plyne hlavní odlišení appky od konkurence: **neřeší "kde auto je" (GPS tracking), řeší "kdo je za auto právě zodpovědný a v jakém je stavu"** — předávací protokol s digitálním podpisem a automatické hlídání termínů (STK, pojištění, dálniční známka, servis).

## Tech stack

Next.js 14 (App Router) + PostgreSQL (Prisma 5.22) + Tailwind CSS + bcryptjs + jose (JWT) + xlsx (export) + Zod + Supabase (DB + Storage) + Vercel (hosting) + GitHub (source) + Resend (transakční e-maily)

## Design systém

Glassmorphism, tmavé pozadí (`#05070A`), zelený akcent (`#34E37A`/signal), mint (`#AFFFD4`). Komponenty stylu `glass-panel`, gradient tlačítka `from-signal to-signal-dim`. Logo: gauge/tachometr piktogram (`GaugeIcon` v `components/icons.tsx`).

## Hotové funkce (stav k 22. 7. 2026)

- Registrace firmy, přihlašování (admin/účetní/řidič role), JWT session
- Reálné e-mailové pozvánky pro řidiče přes Resend (`pozvanka@drivero.eu`, ověřená doména) — admin zadá jen e-mail, řidič si sám nastaví heslo přes odkaz
- Vozidla — přidání, detail, přehled, přiřazení řidiče
- Kniha jízd — zápis jízdy řidičem, automatický přepočet stavu tachometru, export do XLS (`/api/trips/export`)
- Historie servisu — záznamy s typem, cenou, dodavatelem
- Tankování — zápis + vyfocení účtenky (Supabase Storage bucket `receipts`)
- Předávací protokol — fotodokumentace (6 slotů) + dva digitální podpisy (canvas), Supabase Storage bucket `handover-photos`
- Statistiky — 4 karty na dashboardu admina (km, náklady palivo/servis, blížící se termíny), měsíční souhrn u řidiče
- Mobilní responzivita ověřena na 375px, PWA (instalovatelné na plochu, `display: standalone`)
- Marketingová stránka `/o-nas` s příběhem vzniku appky

## Důležité architektonické vzory

- **Upload souborů jde vždy přímo z prohlížeče do Supabase Storage** (přes `/api/upload/sign` → `createSignedUploadUrl()` → `supabaseBrowser.storage.uploadToSignedUrl()`), nikdy přes tělo requestu na Vercel — Vercel má limit ~4,5 MB na payload serverless funkce, což by u reálných fotek z mobilu spadlo (`FUNCTION_PAYLOAD_TOO_LARGE`). Bucket se předává jako parametr, whitelistovaný v `/api/upload/sign` (`handover-photos`, `receipts`).
- **Auth** — `lib/auth.ts`: JWT session cookie (`drivero_session`, 30 dní) + samostatné pozvánkové tokeny (`purpose: "invite"` claim, 7 dní, stejný `JWT_SECRET`, žádná DB tabulka navíc). `requireSession()` a `requireRole()` jsou standardní guard pro Route Handlers.
- **Vždy ověřovat `companyId` scope** v DB dotazech — appka je multi-tenant, jedna DB pro všechny firmy.

## Environment proměnné (v `.env` i ve Vercelu)

`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (tajný, jen server-side), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (veřejné, pro browser-side upload), `RESEND_API_KEY`, `APP_URL` (pozor: **lokálně `http://localhost:3000`, na Vercelu `https://drivero.eu`** — ne `app.drivero.eu`, appka běží na hlavní doméně).

## Poučení z chyb (ať se neopakují)

1. **Po jakékoli úpravě souboru vždy ověř `grep` na unikátní řetězec z nové verze**, než předpokládej, že se změna projevila — jednou se stalo, že drag-and-drop přesun souboru tiše selhal a appka běžela na staré verzi.
2. **Název proměnné prostředí ve Vercelu si vždy znovu přečti/zkontroluj** — jednou vznikl bug z chybějícího prvního písmene (`EXT_PUBLIC...` místo `NEXT_PUBLIC...`), appka pak spadla na bílou stránku jen na jedné konkrétní podstránce, protože `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` vracelo `undefined`.
3. **`NEXT_PUBLIC_*` proměnné se appce zapékají do kódu při buildu, ne za běhu** — pokud se přidají do Vercelu až po pushnutí commitu, je potřeba ruční "Redeploy", jinak je build nezachytí.
4. **Než psát kód napojený na existující DB tabulku, vždy ověř přesná jména sloupců v `prisma/schema.prisma`** — nejednou se odhad (např. `costAmount`) lišil od reality (`amount` u jiné tabulky).

## Konkurence a byznys kontext

Appka cílí na segment firem s 2–30 vozidly (ČR odhad: nízké desítky tisíc firem). Hlavní konkurence: GPS hardware appky (Commander — 9 200+ zákazníků, 100 000+ vozidel, součást Seyfor grupy; Webdispečink) za ~200–400 Kč/vozidlo/měsíc + hardware; mezinárodní software-only konkurent Fleetio (8 500+ flotil, $4–10/vozidlo/měsíc). Plánovaná cena Drivero: 149 Kč/vozidlo Základ (do 5 vozidel), 99 Kč/vozidlo Profi (neomezeně), roční sleva ~20 %.

## Workflow s uživatelem

Robert (zakladatel) nemá IT/programátorské zázemí — potřebuje jasné, konkrétní kroky, ne technický žargon bez vysvětlení. Osvědčený postup: Claude (v chatu) navrhne zadání na základě projektové historie a znalosti appky → Robert ho přepošle Claude Code → Claude Code si ověří detaily přímo v kódu/schématu než začne psát → implementuje a otestuje end-to-end (ideálně i s reálnými daty, ne jen vizuální kontrolou) → Robert potvrdí commit a push → přidá případné nové env proměnné do Vercelu → ověří na produkci (drivero.eu).
