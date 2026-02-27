import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { AdminClient } from '@/components/admin/admin-client';
import { prisma } from '@/lib/prisma';

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/dashboard');
  }

  const [users, jobs, auditLogs] = await Promise.all([
    prisma.user.findMany({
      include: { wallet: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.conversionJob.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.auditLog.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <AdminClient
          users={users.map(({ passwordHash, ...u }) => u)}
          jobs={jobs}
          auditLogs={auditLogs}
        />
      </main>
    </>
  );
}
