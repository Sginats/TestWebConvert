import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPackById } from '@/lib/pricing';
import { prisma } from '@/lib/prisma';
import { creditTokens } from '@/lib/tokens';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const schema = z.object({ packId: z.string() });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const mockMode = process.env.MOCK_PAYMENTS === 'true' || !process.env.STRIPE_SECRET_KEY;
  if (!mockMode) {
    return NextResponse.json({ error: 'Mock payments disabled' }, { status: 403 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });

  const pack = getPackById(parsed.data.packId);
  if (!pack) return NextResponse.json({ error: 'Pack not found' }, { status: 404 });

  // Create purchase record
  const purchase = await prisma.purchase.create({
    data: {
      userId,
      packId: pack.id,
      amountCents: pack.amountCents,
      status: 'COMPLETED',
      provider: 'mock',
      providerSessionId: `mock_${Date.now()}`,
    },
  });

  // Credit tokens
  const newBalance = await creditTokens(userId, pack.tokens, `Purchased ${pack.id} (mock)`);

  await createAuditLog('tokens.purchased', userId, {
    packId: pack.id,
    tokens: pack.tokens,
    purchaseId: purchase.id,
    mock: true,
  });

  return NextResponse.json({ success: true, newBalance, tokens: pack.tokens });
}
