# FileForge — File Converter

A premium, production-ready file converter web app built with Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Prisma + PostgreSQL, BullMQ + Redis, and NextAuth.

---

## Tech Stack

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS (Custom Neon Theme)
- **Auth**: NextAuth v4 (Credentials provider + JWT)
- **Database**: PostgreSQL via Prisma ORM
- **Queue**: BullMQ + Redis for resilient background conversion
- **Storage**: Hybrid Cloud Storage (Local FS for dev, Cloudflare R2/S3 for production)
- **Payments**: Stripe Checkout + Mock Payment Mode
- **Validation**: Zod (Environment, API, Forms)

---

## Setup & Deployment

### Prerequisites

- Node.js 20+
- npm / pnpm
- Docker (for local DB/Redis)

### 1. Environment Configuration

Copy `.env.example` to `.env` and fill in the required values.

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/fileforge"

# Auth
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Redis
REDIS_URL="redis://localhost:6379"

# Storage (R2/S3 - Required for Vercel)
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_ENDPOINT="..."
R2_BUCKET="..."
```

### 2. Local Development

```bash
# Install dependencies
npm install

# Start DB and Redis
docker compose up -d

# Initialize Database
npx prisma migrate dev
npx prisma db seed

# Start Web Server
npm run dev

# Start Worker (Required for conversions)
npm run worker
```

### 3. Vercel Deployment

1. Connect your repo to Vercel.
2. Add all environment variables from `.env`.
3. Set `NEXTAUTH_URL` to your production domain.
4. Ensure `R2_*` variables are set for persistent storage (Vercel filesystem is ephemeral).
5. The worker needs to be hosted separately (e.g., on Railway, Render, or a VPS) as Vercel doesn't support long-running background processes.

---

## Robustness & Features

- **Health Checks**: Visit `/api/health` to verify system status (DB, Redis, Env).
- **Rate Limiting**: Redis-backed rate limiter on auth endpoints.
- **S3 Integration**: Automatically uses S3/R2 if environment variables are present.
- **Audit Logs**: Comprehensive tracking of all critical user actions.
- **Refund Logic**: Automatic token refund if a conversion job fails after all retries.

---

## Token Pricing

| Category | Multiplier | Example |
|----------|------------|---------|
| Images   | 1x         | PNG to WebP |
| Documents| 2x         | PDF to Text |

**Formula**: `Math.max(1, Math.round((2 + Math.ceil(fileMB / 5)) * multiplier))`

---

## Project Structure

```
src/
├── app/             # App Router (Pages & API)
├── components/      # UI Components (Flashy Neon Theme)
├── lib/             # Business Logic & Abstractions
│   ├── env.ts       # Strict Env Validation
│   ├── storage.ts   # S3/Local Hybrid Storage
│   ├── rateLimit.ts # Redis-backed Limiter
│   └── ...
├── worker/          # BullMQ Worker Engine
└── ...
```

---

## File Cleanup

Old output files (>7 days) are deleted with:

```bash
npm run cleanup
```

You can add this to a cron job:
```bash
# Run daily at 3am
0 3 * * * cd /path/to/app && npm run cleanup
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

---

## Known Limitations

1. **No server-side token refresh**: The JWT balance shown in the navbar is from login time. Refresh the page to see updated balance after purchases.
2. **Audio conversion**: Currently only images and documents are supported.
3. **PDF extraction quality**: `pdf-parse` handles text-based PDFs well but scanned/image PDFs won't extract text.
4. **Email verification**: Registration is immediate for demo purposes.

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
