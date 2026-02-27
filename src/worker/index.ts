// src/worker/index.ts
// Run with: pnpm worker

import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { PrismaClient, JobStatus } from '@prisma/client';
import { createRedisConnection, CONVERSION_QUEUE, ConversionJobData } from '../lib/queue';
import { getInputPath, getOutputPath, saveOutputFile, mimeToExt } from '../lib/storage';
import { convertImage } from '../lib/image';
import { txtToPdf, pdfToTxt } from '../lib/document';
import { creditTokens } from '../lib/tokens';
import fs from 'fs';

const prisma = new PrismaClient();

async function processConversionJob(job: Job<ConversionJobData>) {
  const { jobId, userId, inputPath, inputMime, outputMime, costTokens, resizeWidth, resizeHeight } =
    job.data;

  console.log(`[Worker] Processing job ${jobId} (${inputMime} -> ${outputMime})`);

  // Mark as PROCESSING
  await prisma.conversionJob.update({
    where: { id: jobId },
    data: { status: JobStatus.PROCESSING },
  });

  // Read input
  const fullInputPath = getInputPath(inputPath);
  if (!fs.existsSync(fullInputPath)) {
    throw new Error(`Input file not found: ${fullInputPath}`);
  }
  const inputBuffer = await fs.promises.readFile(fullInputPath);

  // Perform conversion
  let outputBuffer: Buffer;
  const outputExt = mimeToExt(outputMime);

  if (inputMime.startsWith('image/') && outputMime.startsWith('image/')) {
    outputBuffer = await convertImage(inputBuffer, outputMime, { resizeWidth, resizeHeight });
  } else if (inputMime === 'text/plain' && outputMime === 'application/pdf') {
    outputBuffer = await txtToPdf(inputBuffer.toString('utf-8'));
  } else if (inputMime === 'application/pdf' && outputMime === 'text/plain') {
    const text = await pdfToTxt(inputBuffer);
    outputBuffer = Buffer.from(text, 'utf-8');
  } else {
    throw new Error(`Unsupported conversion: ${inputMime} -> ${outputMime}`);
  }

  // Save output
  const outputFilename = await saveOutputFile(outputBuffer, outputExt);
  const outputPath = outputFilename;

  // Mark as DONE
  await prisma.conversionJob.update({
    where: { id: jobId },
    data: { status: JobStatus.DONE, outputPath, updatedAt: new Date() },
  });

  console.log(`[Worker] Job ${jobId} completed. Output: ${outputFilename}`);
}

async function handleJobFailure(job: Job<ConversionJobData> | undefined, error: Error) {
  if (!job) return;
  const { jobId, userId, costTokens } = job.data;

  console.error(`[Worker] Job ${jobId} failed:`, error.message);

  // Only refund on final failure (not retries)
  if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
    try {
      await prisma.conversionJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.FAILED,
          error: error.message,
          updatedAt: new Date(),
        },
      });

      // Refund tokens
      await creditTokens(userId, costTokens, `Refund for failed conversion job ${jobId}`);
      console.log(`[Worker] Refunded ${costTokens} tokens to user ${userId}`);
    } catch (refundError) {
      console.error('[Worker] Failed to refund tokens:', refundError);
    }
  }
}

const worker = new Worker<ConversionJobData>(
  CONVERSION_QUEUE,
  async (job) => {
    await processConversionJob(job);
  },
  {
    connection: createRedisConnection(),
    concurrency: 3,
  },
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, error) => {
  handleJobFailure(job, error);
});

worker.on('error', (error) => {
  console.error('[Worker] Worker error:', error);
});

console.log('[Worker] BullMQ worker started, waiting for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
