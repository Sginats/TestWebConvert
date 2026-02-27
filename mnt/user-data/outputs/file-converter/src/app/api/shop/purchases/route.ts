import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  const purchases = await prisma.purchase.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({ purchases });
}
