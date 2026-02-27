import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOutputPath, mimeToExt } from '@/lib/storage';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const job = await prisma.conversionJob.findUnique({
    where: { downloadToken: params.token },
  });

  if (!job || !job.outputPath) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Only allow owner or admin
  if (job.userId !== userId && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (job.status !== 'DONE') {
    return NextResponse.json({ error: 'File not ready' }, { status: 400 });
  }

  const filePath = getOutputPath(job.outputPath);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const ext = mimeToExt(job.outputMime);
  const filename = `converted.${ext}`;

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': job.outputMime,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(fileBuffer.length),
    },
  });
}
