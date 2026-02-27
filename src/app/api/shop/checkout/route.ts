import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPackById } from '@/lib/pricing';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { z } from 'zod';

const schema = z.object({ packId: z.string() });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });

  const pack = getPackById(parsed.data.packId);
  if (!pack) return NextResponse.json({ error: 'Pack not found' }, { status: 404 });

  const mockMode = process.env.MOCK_PAYMENTS === 'true' || !process.env.STRIPE_SECRET_KEY;

  if (mockMode) {
    // Return a mock intent
    return NextResponse.json({ mock: true, packId: pack.id });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  // Create a pending purchase record
  const purchase = await prisma.purchase.create({
    data: {
      userId,
      packId: pack.id,
      amountCents: pack.amountCents,
      status: 'PENDING',
    },
  });

  const stripeSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: `${pack.label} - File Converter Tokens` },
          unit_amount: pack.amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      purchaseId: purchase.id,
      userId,
      packId: pack.id,
      tokens: String(pack.tokens),
    },
    success_url: `${appUrl}/shop?success=true`,
    cancel_url: `${appUrl}/shop?canceled=true`,
  });

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { providerSessionId: stripeSession.id },
  });

  return NextResponse.json({ url: stripeSession.url });
}
