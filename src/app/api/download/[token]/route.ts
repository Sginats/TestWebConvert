import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile, getDownloadUrl, mimeToExt } from '@/lib/storage';

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

  const downloadUrl = await getDownloadUrl(job.outputPath);
  
  // If it's a remote URL (S3/R2), redirect to it
  if (downloadUrl.startsWith('http')) {
    return NextResponse.redirect(downloadUrl);
  }

  // Otherwise stream from local storage (development/fallback)
  try {
    const fileBuffer = await readFile(job.outputPath, 'outputs');
    const ext = mimeToExt(job.outputMime);
    const filename = `converted.${ext}`;

    return new NextResponse(fileBuffer as any, {
      headers: {
        'Content-Type': job.outputMime,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(fileBuffer.length),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
  }
}
