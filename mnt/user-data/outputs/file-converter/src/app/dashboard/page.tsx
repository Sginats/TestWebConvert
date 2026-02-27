import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const userId = (session.user as any).id;

  const [wallet, recentJobs, recentTransactions, recentPurchases] = await Promise.all([
    prisma.tokenWallet.findUnique({ where: { userId } }),
    prisma.conversionJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.purchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <DashboardClient
          user={session.user as any}
          balance={wallet?.balance ?? 0}
          recentJobs={recentJobs}
          recentTransactions={recentTransactions}
          recentPurchases={recentPurchases}
        />
      </main>
    </>
  );
}
