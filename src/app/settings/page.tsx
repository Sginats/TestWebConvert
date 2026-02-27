import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { SettingsClient } from '@/components/settings/settings-client';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <SettingsClient user={session.user as any} />
      </main>
    </>
  );
}
