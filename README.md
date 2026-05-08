# Yoga Land Mocked V1

Mocked payment-to-QR flow built with Next.js App Router and TypeScript.

## What this V1 includes

- Landing page with a CTA and 3 mocked products.
- Mock payment service with deterministic test mode (`auto`, `success`, `failed`).
- Redirect to success or failed pages.
- QR generation after successful payment.
- QR actions on success page:
  - copy URL
  - download as PDF
  - open in new tab
  - send by email (mocked, persisted in logs)
- Public QR details page with decoded payload.
- QR accept/decline actions that update persistent state.
- Admin/debug page to inspect transactions, QR records, and email logs.
- SQLite-compatible persistence via Drizzle (`DATABASE_URL`, optional `DATABASE_AUTH_TOKEN`).
- CRUD API for transactions and QR records.

## Tech stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- Drizzle ORM + SQLite/libSQL (Turso-ready)
- `qrcode` for QR generation
- `jspdf` for PDF export

## Getting started

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Open http://localhost:3000

Useful checks:

```bash
npm run lint
npm run build
```

Environment variables:

```bash
# local file mode
DATABASE_URL=file:./data/app.db

# hosted libSQL/Turso mode
# DATABASE_URL=libsql://<your-db>.turso.io
# DATABASE_AUTH_TOKEN=<your-token>
```

## User flow

1. Open landing page (`/`).
2. Select one of 3 products and choose mock result mode.
3. Click `Pay now`.
4. If payment succeeds:
   - redirected to `/payment/success`
   - QR record is generated
   - QR actions are available
5. If payment fails:
   - redirected to `/payment/failed`
6. Open QR details page (from QR link or direct URL `/qr/:id`).
7. Accept or decline QR.
8. Verify latest state on `/admin`.

## Data model

### Product

- `id`
- `name`
- `price`
- `currency`

### Transaction

- `id`
- `productId`
- `amount`
- `currency`
- `paymentStatus` (`pending` | `success` | `failed`)
- `qrId` (`string | null`)
- `createdAt`
- `updatedAt`

### QrRecord

- `id`
- `transactionId`
- `qrUrl`
- `payload`
- `decisionStatus` (`pending` | `accepted` | `declined`)
- `decisionAt` (`string | null`)
- `createdAt`
- `updatedAt`

### EmailLog

- `id`
- `to`
- `qrId`
- `status` (`sent` | `failed`)
- `createdAt`

## API

All responses are JSON. Validation errors return:

```json
{
  "error": "Validation failed",
  "details": "..."
}
```

### Products

- `GET /api/products`
  - Returns static mocked products.

### Checkout

- `POST /api/checkout`
  - Request:

```json
{
  "productId": "starter-pass",
  "mode": "success"
}
```

    - `mode` can be `auto`, `success`, `failed`.
    - On success returns redirect URL to `/payment/success?...`.
    - On failure returns redirect URL to `/payment/failed?...`.

### Transactions CRUD

- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/:id`
- `PATCH /api/transactions/:id`
- `DELETE /api/transactions/:id`

Create example:

```json
{
  "productId": "full-retreat",
  "paymentStatus": "pending"
}
```

Patch example:

```json
{
  "paymentStatus": "success",
  "qrId": "some-qr-id"
}
```

### QR records CRUD

- `GET /api/qr-records`
- `POST /api/qr-records`
- `GET /api/qr-records/:id`
- `PATCH /api/qr-records/:id`
- `DELETE /api/qr-records/:id`

Create example:

```json
{
  "transactionId": "tx-id",
  "qrUrl": "http://localhost:3000/qr/qr-id",
  "payload": "{\"transactionId\":\"tx-id\"}"
}
```

### QR decision endpoints

- `POST /api/qr-records/:id/accept`
- `POST /api/qr-records/:id/decline`

Rules:

- First decision from `pending` is accepted.
- Repeated decision attempts return `409` conflict and preserve state.

### Mock email

- `POST /api/email/send`

Request:

```json
{
  "qrId": "qr-id",
  "to": "user@example.com"
}
```

### Admin records

- `GET /api/admin/records`
  - Aggregated `transactions`, `qrRecords`, and `emailLogs`.

## Database

- Local mode: `DATABASE_URL=file:./data/app.db`
- Hosted mode (recommended for Vercel): `DATABASE_URL=libsql://...` and `DATABASE_AUTH_TOKEN=...`
- Schema is managed in `src/lib/db/schema.ts` and migrations are in `drizzle/`.

## Decisions

- Used Route Handlers under `app/api` for all API endpoints.
- Kept persistence in a file-backed repository to simplify later DB migration.
- QR payload stores payment context in JSON format.
- QR encodes a URL (`/qr/:id`) so mobile scan opens the details page directly.
- Accept/decline endpoints are idempotency-safe for already decided records.

## Known limitations (mocked v1)

- Payment provider is mocked (no external gateway yet).
- Email sending is mocked (only logs records).
- File-based JSON persistence is not suitable for high concurrency.
- No authentication/authorization yet.
- No dedicated automated tests added in this iteration.

## Migration plan to production

1. Replace payment simulation with real provider SDK/webhooks.
2. Move repositories from JSON file to Postgres (Prisma/Drizzle).
3. Add auth and role-based access for admin and decision actions.
4. Add transactional integrity and stronger idempotency keys.
5. Add integration tests for checkout, QR lifecycle, and decision endpoints.
