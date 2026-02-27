import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  saveInputFile,
  mimeToExt,
  ALLOWED_MIME_TYPES,
  isConversionSupported,
} from '@/lib/storage';
import { calculateTokenCost } from '@/lib/pricing';
import { debitTokens } from '@/lib/tokens';
import { enqueueConversionJob } from '@/lib/queue';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';
import { getRedis } from '@/lib/rateLimit';
import { TransactionType } from '@prisma/client';

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const querySchema = z.object({
  outputMime: z.string(),
  resizeWidth: z.coerce.number().int().positive().optional(),
  resizeHeight: z.coerce.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const requestId = req.headers.get('x-request-id');

  // Parse query params
  const searchParams = req.nextUrl.searchParams;
  const queryParsed = querySchema.safeParse({
    outputMime: searchParams.get('outputMime'),
    resizeWidth: searchParams.get('resizeWidth') || undefined,
    resizeHeight: searchParams.get('resizeHeight') || undefined,
  });
  if (!queryParsed.success) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }
  const { outputMime, resizeWidth, resizeHeight } = queryParsed.data;

  // Idempotency check
  if (requestId) {
    try {
      const redis = getRedis();
      const existingJobId = await redis.get(`idempotency:${userId}:${requestId}`);
      if (existingJobId) {
        const existingJob = await prisma.conversionJob.findUnique({ where: { id: existingJobId } });
        if (existingJob) {
          return NextResponse.json({
            jobId: existingJob.id,
            costTokens: existingJob.costTokens,
            status: existingJob.status,
            duplicate: true,
          }, { status: 201 });
        }
      }
    } catch (e) {
      console.warn('Idempotency check failed:', e);
    }
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });

  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  // Validate MIME type
  const inputMime = file.type;
  if (!ALLOWED_MIME_TYPES.includes(inputMime)) {
    return NextResponse.json({ error: `File type '${inputMime}' not allowed` }, { status: 400 });
  }

  if (!isConversionSupported(inputMime, outputMime)) {
    return NextResponse.json(
      { error: `Conversion from ${inputMime} to ${outputMime} not supported` },
      { status: 400 },
    );
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
  }

  // Calculate token cost
  const costTokens = calculateTokenCost(file.size, inputMime, outputMime);

  // Save input file FIRST (it's safe as it's just a file on disk/S3)
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = mimeToExt(inputMime);
  const inputFilename = await saveInputFile(buffer, ext);

  try {
    // Atomic debit + job creation
    const job = await prisma.$transaction(async (tx) => {
      const wallet = await tx.tokenWallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < costTokens) {
        throw new Error('INSUFFICIENT_TOKENS');
      }

      // Debit
      await tx.tokenWallet.update({
        where: { userId },
        data: { balance: { decrement: costTokens } },
      });

      // Record transaction
      await tx.tokenTransaction.create({
        data: {
          userId,
          amount: costTokens,
          type: TransactionType.DEBIT,
          reason: `Conversion: ${inputMime} -> ${outputMime}`,
        },
      });

      // Create Job
      return tx.conversionJob.create({
        data: {
          userId,
          inputPath: inputFilename,
          inputMime,
          outputMime,
          costTokens,
          status: 'QUEUED',
        },
      });
    });

    // Enqueue BullMQ job (outside transaction)
    await enqueueConversionJob({
      jobId: job.id,
      userId,
      inputPath: inputFilename,
      inputMime,
      outputMime,
      costTokens,
      resizeWidth,
      resizeHeight,
    });

    // Save idempotency key
    if (requestId) {
      try {
        const redis = getRedis();
        await redis.set(`idempotency:${userId}:${requestId}`, job.id, 'EX', 3600);
      } catch (e) {
        console.warn('Failed to save idempotency key:', e);
      }
    }

    await createAuditLog('job.created', userId, {
      jobId: job.id,
      inputMime,
      outputMime,
      costTokens,
    });

    return NextResponse.json({ jobId: job.id, costTokens }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'INSUFFICIENT_TOKENS') {
      return NextResponse.json({ error: 'Insufficient tokens.' }, { status: 402 });
    }
    console.error('Conversion creation failed:', e);
    return NextResponse.json({ error: 'Failed to initialize conversion' }, { status: 500 });
  }
}
