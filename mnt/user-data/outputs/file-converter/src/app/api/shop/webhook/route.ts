import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { creditTokens } from '@/lib/tokens';
import { createAuditLog } from '@/lib/audit';
import { getPackById } from '@/lib/pricing';

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const stripeSession = event.data.object as Stripe.Checkout.Session;
    const { purchaseId, userId, packId, tokens } = stripeSession.metadata ?? {};

    if (!purchaseId || !userId || !packId || !tokens) {
      console.error('Missing metadata in Stripe webhook');
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
    if (!purchase || purchase.status === 'COMPLETED') {
      return NextResponse.json({ ok: true }); // already processed
    }

    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: 'COMPLETED' },
    });

    const tokenCount = parseInt(tokens);
    await creditTokens(userId, tokenCount, `Purchased ${packId}`);
    await createAuditLog('tokens.purchased', userId, { packId, tokens: tokenCount, purchaseId });
  }

  return NextResponse.json({ received: true });
}
