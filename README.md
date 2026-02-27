# FileForge — File Converter

A production-ready file converter web app built with Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Prisma + PostgreSQL, BullMQ + Redis, and NextAuth.

---

## Tech Stack

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui components
- **Auth**: NextAuth with Credentials provider (argon2 password hashing)
- **Database**: PostgreSQL via Prisma ORM
- **Queue**: BullMQ + Redis for background conversion jobs
- **Storage**: Local filesystem (`/storage`) with abstraction layer for future S3
- **Payments**: Stripe Checkout (with mock mode when keys are missing)

---

## Setup

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Docker + Docker Compose

### 1. Clone & install

```bash
git clone <repo>
cd file-converter
cp .env.example .env
pnpm install
```

### 2. Start Docker services

```bash
docker compose up -d
# Starts PostgreSQL on :5432 and Redis on :6379
```

### 3. Run database migrations + seed

```bash
pnpm prisma migrate dev --name init
pnpm prisma db seed
```

Seed creates:
- Admin: `admin@example.com` / `Admin123!` (9999 tokens)
- User: `user@example.com` / `User123!` (20 tokens)

### 4. Start the web server

```bash
pnpm dev
# Available at http://localhost:3000
```

### 5. Start the worker (separate terminal)

```bash
pnpm worker
# BullMQ worker that processes conversion jobs
```

---

## Running Tests

```bash
pnpm test
```

Tests cover:
- Token debit/credit logic
- Pricing calculation
- Conversion endpoint logic (MIME whitelist, supported conversions)

---

## Stripe Integration

### With real Stripe (test mode)

1. Create a Stripe account and get test API keys
2. Update `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   MOCK_PAYMENTS=false
   ```
3. Install Stripe CLI and forward webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/shop/webhook
   ```

### Mock Payments (default)

When `MOCK_PAYMENTS=true` (or `STRIPE_SECRET_KEY` is empty), the shop shows a "Mock Purchase" button that:
- Instantly credits tokens
- Creates a real `Purchase` record with `provider: "mock"`
- No actual payment processing

---

## File Cleanup

Old output files (>7 days) are deleted with:

```bash
pnpm cleanup
```

You can add this to a cron job:
```bash
# Run daily at 3am
0 3 * * * cd /path/to/app && pnpm cleanup
```

---

## Supported Conversions

| Input | Output | Multiplier |
|-------|--------|------------|
| PNG   | JPG, WebP | x1 |
| JPG   | PNG, WebP | x1 |
| WebP  | PNG, JPG | x1 |
| TXT   | PDF | x2 |
| PDF   | TXT | x2 |

### Token Pricing Formula

```
sizeBonus = ceil(fileSizeMB / 5)
baseCost  = 2 + sizeBonus
finalCost = baseCost × multiplier (1 for images, 2 for docs)
```

---

## Known Limitations

1. **No server-side token refresh**: The JWT balance shown in the navbar is from login time. Refresh the page to see updated balance after purchases.
2. **In-memory rate limiter**: The rate limiter resets on server restart. Use Redis for production.
3. **No audio conversion**: Omitted as there are no reliable pure-JS audio conversion libraries.
4. **PDF extraction quality**: `pdf-parse` handles text-based PDFs well but scanned/image PDFs won't extract text.
5. **Local storage only**: Files are stored on disk. For production, implement the S3 path in `src/lib/storage.ts`.
6. **Worker must run separately**: Run `pnpm worker` in a separate process. In production, use PM2 or a Kubernetes job.
7. **No email verification**: Registration is immediate with no email confirmation step.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/               # REST API endpoints
│   ├── (auth)/            # Login, register pages
│   ├── dashboard/         # Protected pages
│   └── ...
├── components/            # React components
│   ├── layout/           # Navbar
│   ├── dashboard/
│   ├── convert/
│   ├── shop/
│   ├── admin/
│   └── ui/               # Shared UI primitives
├── lib/                   # Core business logic
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # DB client
│   ├── queue.ts          # BullMQ setup
│   ├── storage.ts        # File storage abstraction
│   ├── tokens.ts         # Token wallet operations
│   ├── pricing.ts        # Token cost calculation
│   ├── audit.ts          # Audit logging
│   └── conversions/      # Sharp + pdf-lib + pdf-parse
├── worker/               # BullMQ worker process
└── types/                # TypeScript type extensions
```
