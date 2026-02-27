import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getBalance, getTransactionHistory } from '@/lib/tokens';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const balance = await getBalance(userId);
  const transactions = await getTransactionHistory(userId, 30);

  return NextResponse.json({ balance, transactions });
}
