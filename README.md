## Run locally
1. `cp .env.example .env` and fill values
2. `docker compose up -d`
3. `pnpm i`
4. `pnpm prisma migrate dev`
5. `pnpm dev`

## Worker
`pnpm worker`