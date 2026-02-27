import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { ConvertClient } from '@/components/convert/convert-client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ConvertPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const userId = (session.user as any).id;
  const recentJobs = await prisma.conversionJob.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <ConvertClient 
          balance={(session.user as any).balance ?? 0} 
          recentJobs={JSON.parse(JSON.stringify(recentJobs))}
        />
      </main>
    </>
  );
}
