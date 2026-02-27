'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Coins, Clock, Download, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Job {
  id: string;
  inputMime: string;
  outputMime: string;
  status: string;
  costTokens: number;
  createdAt: string | Date;
  downloadToken: string;
  error?: string | null;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  reason: string;
  createdAt: string | Date;
}

interface Purchase {
  id: string;
  packId: string;
  amountCents: number;
  status: string;
  createdAt: string | Date;
}

interface Props {
  user: { id: string; email: string; name?: string; role: string };
  balance: number;
  recentJobs: Job[];
  recentTransactions: Transaction[];
  recentPurchases: Purchase[];
}

function StatusChip({ status }: { status: string }) {
  const variants: Record<string, string> = {
    QUEUED: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    PROCESSING: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    DONE: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    FAILED: 'bg-red-500/15 text-red-400 border border-red-500/30',
    CANCELED: 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${variants[status] ?? 'bg-secondary text-foreground'}`}>
      {status}
    </span>
  );
}

function mimeLabel(mime: string) {
  const map: Record<string, string> = {
    'image/png': 'PNG', 'image/jpeg': 'JPG', 'image/webp': 'WEBP',
    'application/pdf': 'PDF', 'text/plain': 'TXT',
  };
  return map[mime] ?? mime;
}

export function DashboardClient({ user, balance, recentJobs, recentTransactions, recentPurchases }: Props) {
  const [jobs, setJobs] = useState<Job[]>(recentJobs);
  const { toast } = useToast();

  async function cancelJob(jobId: string) {
    const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
    if (res.ok) {
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'CANCELED' } : j)));
      toast({ title: 'Job canceled', description: 'Tokens have been refunded.' });
    } else {
      const d = await res.json();
      toast({ title: 'Error', description: d.error, variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back{user.name ? `, ${user.name}` : ''}!
        </h1>
        <p className="text-muted-foreground mt-1">{user.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Coins className="w-4 h-4" /> Token Balance
          </div>
          <div className="text-3xl font-bold text-primary">{balance}</div>
          <Link href="/shop" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-2">
            Buy more <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <CheckCircle className="w-4 h-4" /> Completed Jobs
          </div>
          <div className="text-3xl font-bold">{recentJobs.filter((j) => j.status === 'DONE').length}</div>
          <p className="text-xs text-muted-foreground mt-2">Last 5 shown</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Clock className="w-4 h-4" /> Pending
          </div>
          <div className="text-3xl font-bold">{recentJobs.filter((j) => j.status === 'QUEUED' || j.status === 'PROCESSING').length}</div>
          <Link href="/convert" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-2">
            Convert a file <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Recent Jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Conversions</h2>
          <Link href="/convert" className="text-sm text-primary hover:underline flex items-center gap-1">
            New conversion <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {jobs.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
            <p>No conversions yet.</p>
            <Link href="/convert" className="text-primary text-sm hover:underline mt-2 inline-block">Start your first conversion →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <StatusChip status={job.status} />
                  <span className="text-sm font-medium whitespace-nowrap">
                    {mimeLabel(job.inputMime)} → {mimeLabel(job.outputMime)}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                  {job.error && (
                    <span className="text-xs text-red-400 truncate max-w-[200px]" title={job.error}>
                      {job.error}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{job.costTokens} tkn</span>
                  {job.status === 'DONE' && (
                    <a
                      href={`/api/download/${job.downloadToken}`}
                      className="flex items-center gap-1 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                  )}
                  {job.status === 'QUEUED' && (
                    <button
                      onClick={() => cancelJob(job.id)}
                      className="flex items-center gap-1 text-xs bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Token history + purchases grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Token History</h2>
          <div className="space-y-2">
            {recentTransactions.length === 0 ? (
              <div className="glass rounded-xl p-4 text-center text-muted-foreground text-sm">No transactions yet.</div>
            ) : recentTransactions.map((t) => (
              <div key={t.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate max-w-[200px]" title={t.reason}>{t.reason}</span>
                <span className={t.type === 'CREDIT' ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                  {t.type === 'CREDIT' ? '+' : '-'}{t.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Purchases</h2>
          <div className="space-y-2">
            {recentPurchases.length === 0 ? (
              <div className="glass rounded-xl p-4 text-center text-muted-foreground text-sm">
                No purchases yet. <Link href="/shop" className="text-primary hover:underline">Visit shop →</Link>
              </div>
            ) : recentPurchases.map((p) => (
              <div key={p.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                <span className="font-medium">{p.packId}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">€{(p.amountCents / 100).toFixed(2)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
