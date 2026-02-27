import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { removeJobFromQueue } from '@/lib/queue';
import { creditTokens } from '@/lib/tokens';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const jobId = params.id;

  const job = await prisma.conversionJob.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (job.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (job.status !== 'QUEUED') {
    return NextResponse.json({ error: 'Job cannot be canceled (not in QUEUED state)' }, { status: 400 });
  }

  // Remove from BullMQ
  await removeJobFromQueue(jobId);

  // Update DB
  await prisma.conversionJob.update({
    where: { id: jobId },
    data: { status: 'CANCELED' },
  });

  // Refund tokens
  await creditTokens(userId, job.costTokens, `Refund for canceled job ${jobId}`);

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const job = await prisma.conversionJob.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (job.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json({ job });
}
