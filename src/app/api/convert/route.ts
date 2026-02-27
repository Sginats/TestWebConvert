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

  // Debit tokens
  const debitResult = await debitTokens(
    userId,
    costTokens,
    `Conversion job: ${inputMime} -> ${outputMime}`,
  );
  if (!debitResult.success) {
    return NextResponse.json(
      { error: `Insufficient tokens. Need ${costTokens}, have ${debitResult.balance}.` },
      { status: 402 },
    );
  }

  // Save input file
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = mimeToExt(inputMime);
  const inputFilename = await saveInputFile(buffer, ext);

  // Create DB job
  const job = await prisma.conversionJob.create({
    data: {
      userId,
      inputPath: inputFilename,
      inputMime,
      outputMime,
      costTokens,
      status: 'QUEUED',
    },
  });

  // Enqueue BullMQ job
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

  await createAuditLog('job.created', userId, {
    jobId: job.id,
    inputMime,
    outputMime,
    costTokens,
  });

  return NextResponse.json({ jobId: job.id, costTokens }, { status: 201 });
}
