# FileForge — File Converter

A premium, production-ready file converter web app built with Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Prisma + PostgreSQL, BullMQ + Redis, and NextAuth.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js 20+**
- **Docker** (for local database and Redis)
- **Cloudflare R2 or AWS S3 Bucket** (Required for production/Vercel)

### 2. Installation
```bash
git clone https://github.com/Sginats/TestWebConvert.git
cd TestWebConvert
npm install
```

### 3. Local Development
```bash
# Setup environment
cp .env.example .env

# Start local services (PostgreSQL & Redis)
docker compose up -d

# Push schema and seed initial data (20 free tokens for admin@example.com)
npx prisma migrate dev
npx prisma db seed

# Run the web application
npm run dev

# Run the background worker (Critical for processing files)
npm run worker
```

---

## 🚀 Deployment Guide (Vercel + Railway)

### Web Frontend (Vercel)
1. **Connect Repository**: Link your fork to Vercel.
2. **Environment Variables**: Add all variables from `.env`. 
   - `NEXTAUTH_URL`: Your production domain.
   - `NEXTAUTH_SECRET`: Generate using `openssl rand -base64 32`.
   - `DATABASE_URL`: Use a managed PostgreSQL (Supabase/Railway).
   - `REDIS_URL`: Use a managed Redis (Upstash/Railway).
   - `R2_*`: **Required**. Vercel filesystem is ephemeral. Files must be stored in R2 or S3.
   - `WORKER_MODE`: Set to `inline` if you don't have a separate worker, or `external` (default) for production.
3. **Build Settings**: Default (Next.js).

### Background Worker (Railway/Render/VPS)
The worker **must** run in a persistent environment (not serverless).
1. Create a new service on Railway.
2. Connect the same repository.
3. Set the **Start Command** to `npm run worker`.
4. Ensure it has the same `DATABASE_URL`, `REDIS_URL`, and `R2_*` variables.

---

## 🛠 Features & Guardrails

- **Idempotency**: All conversion requests use `x-request-id` to prevent double-charging on network retries.
- **Atomic Transactions**: Token debiting and job creation are committed together or not at all.
- **Hybrid Storage**: Automatically switches between local filesystem (dev) and S3/R2 (prod) based on environment flags.
- **Health Monitoring**: Monitor system health at `/api/health`.
- **Diagnostics**: Debug session issues at `/api/debug/auth-session`.
- **Automatic Refunds**: If a job fails after all retries (BullMQ), tokens are automatically credited back to the user.
- **Rate Limiting**: Redis-backed protection on `/api/auth` and `/api/convert`.

---

## 💎 Token Economy

| Category | Multiplier | Base Fee | Total (1MB File) |
|----------|------------|----------|------------------|
| Images   | 1x         | 2 TKN    | 3 TKN            |
| Documents| 2x         | 2 TKN    | 6 TKN            |

**Formula**: `Math.max(1, Math.round((2 + Math.ceil(fileMB / 5)) * multiplier))`

---

## 📂 Project Structure

```
src/
├── app/             # App Router (Pages & API)
├── components/      # UI Components (Premium Dark Neon)
├── lib/             # Business Logic & Core Abstractions
│   ├── auth.ts      # NextAuth configuration
│   ├── storage.ts   # S3/Local Hybrid Storage
│   ├── env.ts       # Strict Zod-based Env Validation
│   └── ...
├── worker/          # BullMQ Worker Engine
└── ...
```

---

## 🧹 Maintenance
Clean up old output files (>7 days) with:
```bash
npm run cleanup
```
Recommended: Set up a daily cron job.
