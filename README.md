# Yoga Land

Production-oriented payment-to-QR flow built with Next.js App Router and TypeScript.

## Highlights

- App Router with server-first data loading for page entry data.
- Products are stored in DB (not hardcoded in frontend).
- Admin-only controls and routes for QR scanning and records management.
- QR generation + acceptance workflow with persisted transaction records.
- Email delivery support via Resend.

## Tech stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- Drizzle ORM + SQLite/libSQL (Turso-ready)

## Fresh setup

1. Install dependencies:

```bash
npm install
```

2. Create local env file from template (if missing):

```bash
cp .env.example .env.local
```

3. Fill required variables in `.env.local`:

```bash
DATABASE_URL=file:./data/app.db
SESSION_SECRET=replace-me

# optional (email delivery)
RESEND_API_KEY=
RESEND_FROM_EMAIL=delivered@resend.dev
```

4. Initialize local database and seed base data (products + admin):

```bash
npm run db:migrate:local
npm run db:seed:local
```

Or run all local setup in one command:

```bash
npm run setup:local
```

5. Start development server:

```bash
npm run dev
```

Open http://localhost:3000

## Useful commands

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Seeders

- Unified seed (products + admin):

```bash
npm run db:seed
```

- Unified seed with `.env.local` / `.env`:

```bash
npm run db:seed:local
npm run db:seed:env
```

- Run each seeder separately:

```bash
npm run db:seed:products
npm run db:seed:admin

npm run db:seed:products:local
npm run db:seed:admin:local

npm run db:seed:products:env
npm run db:seed:admin:env
```

## Notes about local artifacts

- Local SQLite files under `data/` are ignored by git.
- Local certificates are ignored by git (`certificates/`).
- Environment files (`.env*`) are ignored.

## Database

- Local mode: `DATABASE_URL=file:./data/app.db`
- Hosted mode: `DATABASE_URL=libsql://...` + `DATABASE_AUTH_TOKEN=...`
- Schema lives in `src/lib/db/schema.ts`
- Migrations live in `drizzle/`
