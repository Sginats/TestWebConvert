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
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            Welcome{user.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-muted-foreground font-medium">
            Manage your conversions and balance.
          </p>
        </div>
        <div className="text-sm bg-white/5 px-4 py-2 rounded-xl border border-white/5 font-mono text-muted-foreground">
          {user.email}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass rounded-[2rem] p-8 group hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3 text-muted-foreground text-xs font-bold uppercase tracking-widest mb-4">
            <Coins className="w-4 h-4 text-primary" /> Token Balance
          </div>
          <div className="text-5xl font-black text-primary mb-4 drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]">{balance}</div>
          <Link href="/shop" className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all">
            Top up Balance <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="glass rounded-[2rem] p-8 group hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3 text-muted-foreground text-xs font-bold uppercase tracking-widest mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Completed
          </div>
          <div className="text-5xl font-black mb-4">{recentJobs.filter((j) => j.status === 'DONE').length}</div>
          <p className="text-xs text-muted-foreground font-medium">Total successful jobs in history</p>
        </div>
        <div className="glass rounded-[2rem] p-8 group hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3 text-muted-foreground text-xs font-bold uppercase tracking-widest mb-4">
            <Clock className="w-4 h-4 text-amber-400" /> In Queue
          </div>
          <div className="text-5xl font-black mb-4">{recentJobs.filter((j) => j.status === 'QUEUED' || j.status === 'PROCESSING').length}</div>
          <Link href="/convert" className="inline-flex items-center gap-2 bg-white/5 text-foreground px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-all border border-white/5">
            New Job <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Recent Jobs Table-like */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-widest">Recent Conversions</h2>
          <Link href="/convert" className="text-xs font-bold text-primary hover:underline flex items-center gap-2">
            VIEW ALL <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {jobs.length === 0 ? (
          <div className="glass rounded-[2rem] p-12 text-center text-muted-foreground border-dashed border-white/10">
            <p className="text-lg font-bold mb-4">Your forge is cold.</p>
            <Link href="/convert" className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all inline-block shadow-lg shadow-primary/20">
              Start first conversion
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {jobs.map((job) => (
              <div key={job.id} className="glass glass-hover rounded-2xl p-5 flex items-center justify-between gap-6 transition-all">
                <div className="flex items-center gap-6 min-w-0">
                  <StatusChip status={job.status} />
                  <div className="flex flex-col">
                    <span className="text-base font-black tracking-tight">
                      {mimeLabel(job.inputMime)} <ArrowRight className="inline w-3 h-3 mx-1 text-muted-foreground" /> {mimeLabel(job.outputMime)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {job.error && (
                    <span className="text-xs text-red-400 font-medium truncate max-w-[200px]" title={job.error}>
                      {job.error}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                     <div className="text-[10px] text-muted-foreground font-bold uppercase">Cost</div>
                     <div className="text-sm font-black">{job.costTokens} TKN</div>
                  </div>
                  {job.status === 'DONE' && (
                    <a
                      href={`/api/download/${job.downloadToken}`}
                      className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-emerald-500/20"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  )}
                  {job.status === 'QUEUED' && (
                    <button
                      onClick={() => cancelJob(job.id)}
                      className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
        <div className="space-y-6">
          <h2 className="text-xl font-black uppercase tracking-widest">Token Activity</h2>
          <div className="glass rounded-[2rem] p-6 space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-medium italic">No recent activity</div>
            ) : recentTransactions.map((t) => (
              <div key={t.id} className="bg-white/5 rounded-xl px-5 py-4 flex items-center justify-between hover:bg-white/10 transition-all border border-transparent hover:border-white/5">
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-tight text-foreground/90">{t.reason}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
                <span className={`text-base font-black ${t.type === 'CREDIT' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.type === 'CREDIT' ? '+' : '-'}{t.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-black uppercase tracking-widest">Recent Purchases</h2>
          <div className="glass rounded-[2rem] p-6 space-y-3">
            {recentPurchases.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="font-medium italic mb-4">No purchases yet</p>
                <Link href="/shop" className="text-xs font-black text-primary hover:underline">VISIT SHOP</Link>
              </div>
            ) : recentPurchases.map((p) => (
              <div key={p.id} className="bg-white/5 rounded-xl px-5 py-4 flex items-center justify-between hover:bg-white/10 transition-all border border-transparent hover:border-white/5">
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-tight uppercase">{p.packId.replace('_', ' ')}</span>
                  <span className="text-[10px] text-muted-foreground font-bold">{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-base font-black">€{(p.amountCents / 100).toFixed(2)}</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${p.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
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
