import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const url = req.nextUrl;
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = 20;

  const [jobs, total] = await Promise.all([
    prisma.conversionJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.conversionJob.count({ where: { userId } }),
  ]);

  return NextResponse.json({ jobs, total, page, limit });
}
