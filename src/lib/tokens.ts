import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

export async function getOrCreateWallet(userId: string) {
  return prisma.tokenWallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 20 },
  });
}

export async function getBalance(userId: string): Promise<number> {
  const wallet = await getOrCreateWallet(userId);
  return wallet.balance;
}

export async function debitTokens(
  userId: string,
  amount: number,
  reason: string,
): Promise<{ success: boolean; balance: number }> {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.tokenWallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < amount) {
      return { success: false, balance: wallet?.balance ?? 0 };
    }

    const updated = await tx.tokenWallet.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    });

    await tx.tokenTransaction.create({
      data: {
        userId,
        amount,
        type: TransactionType.DEBIT,
        reason,
      },
    });

    return { success: true, balance: updated.balance };
  });
}

export async function creditTokens(
  userId: string,
  amount: number,
  reason: string,
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.tokenWallet.upsert({
      where: { userId },
      update: { balance: { increment: amount } },
      create: { userId, balance: amount },
    });

    await tx.tokenTransaction.create({
      data: {
        userId,
        amount,
        type: TransactionType.CREDIT,
        reason,
      },
    });

    return updated.balance;
  });
}

export async function getTransactionHistory(userId: string, limit = 20) {
  return prisma.tokenTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
