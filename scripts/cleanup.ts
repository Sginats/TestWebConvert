// scripts/cleanup.ts
// Run with: pnpm cleanup
// Can also be scheduled with a cron job

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const STORAGE_DIR = process.env.STORAGE_DIR ?? './storage';
const OUTPUT_DIR = path.join(STORAGE_DIR, 'outputs');
const RETENTION_DAYS = 7;

async function cleanup() {
  console.log('[Cleanup] Starting file cleanup...');
  const now = Date.now();
  const maxAge = RETENTION_DAYS * 24 * 60 * 60 * 1000;
  let deleted = 0;

  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log('[Cleanup] Output directory does not exist. Nothing to clean.');
    return;
  }

  const files = fs.readdirSync(OUTPUT_DIR);
  for (const file of files) {
    const filePath = path.join(OUTPUT_DIR, file);
    const stat = fs.statSync(filePath);
    if (now - stat.mtimeMs > maxAge) {
      fs.unlinkSync(filePath);
      deleted++;
      console.log(`[Cleanup] Deleted: ${file}`);
    }
  }

  // Also mark old DONE jobs as having no output
  await prisma.conversionJob.updateMany({
    where: {
      status: 'DONE',
      updatedAt: { lt: new Date(now - maxAge) },
    },
    data: { outputPath: null },
  });

  console.log(`[Cleanup] Done. Deleted ${deleted} file(s).`);
  await prisma.$disconnect();
}

cleanup().catch((err) => {
  console.error('[Cleanup] Error:', err);
  process.exit(1);
});
