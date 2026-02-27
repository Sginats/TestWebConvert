import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { ShopClient } from '@/components/shop/shop-client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const userId = (session.user as any).id;
  const wallet = await prisma.tokenWallet.findUnique({ where: { userId } });
  const purchases = await prisma.purchase.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const mockMode = process.env.MOCK_PAYMENTS === 'true' || !process.env.STRIPE_SECRET_KEY;

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <ShopClient
          balance={wallet?.balance ?? 0}
          purchases={purchases}
          mockMode={mockMode}
        />
      </main>
    </>
  );
}
