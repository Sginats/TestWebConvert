'use client';

import { useState } from 'react';
import { Shield, Users, Activity, FileText, Search } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string | Date;
  wallet: { balance: number } | null;
}

interface Job {
  id: string;
  inputMime: string;
  outputMime: string;
  status: string;
  costTokens: number;
  createdAt: string | Date;
  user: { email: string };
  error?: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  createdAt: string | Date;
  user: { email: string } | null;
  meta: unknown;
}

interface AdminClientProps {
  users: User[];
  jobs: Job[];
  auditLogs: AuditLog[];
}

type Tab = 'users' | 'jobs' | 'audit';

const STATUS_COLORS: Record<string, string> = {
  QUEUED: 'bg-yellow-500/15 text-yellow-400',
  PROCESSING: 'bg-blue-500/15 text-blue-400',
  DONE: 'bg-emerald-500/15 text-emerald-400',
  FAILED: 'bg-red-500/15 text-red-400',
  CANCELED: 'bg-zinc-500/15 text-zinc-400',
};

function mimeLabel(mime: string) {
  const map: Record<string, string> = {
    'image/png': 'PNG', 'image/jpeg': 'JPG', 'image/webp': 'WEBP',
    'application/pdf': 'PDF', 'text/plain': 'TXT',
  };
  return map[mime] ?? mime;
}

export function AdminClient({ users, jobs, auditLogs }: AdminClientProps) {
  const [tab, setTab] = useState<Tab>('users');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredUsers = users.filter(
    (u) => !search || u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredJobs = jobs.filter((j) => {
    const matchesStatus = !statusFilter || j.status === statusFilter;
    const matchesSearch = !search || j.user.email.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-0.5">System management and monitoring</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="text-muted-foreground text-sm mb-1">Total Users</div>
          <div className="text-3xl font-bold">{users.length}</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-muted-foreground text-sm mb-1">Total Jobs</div>
          <div className="text-3xl font-bold">{jobs.length}</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-muted-foreground text-sm mb-1">Failed Jobs</div>
          <div className="text-3xl font-bold text-red-400">{jobs.filter((j) => j.status === 'FAILED').length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50">
        {(['users', 'jobs', 'audit'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(''); setStatusFilter(''); }}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'users' ? <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{t}</span> :
             t === 'jobs' ? <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" />{t}</span> :
             <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />audit</span>}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {tab === 'jobs' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All statuses</option>
            {['QUEUED', 'PROCESSING', 'DONE', 'FAILED', 'CANCELED'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {/* Users table */}
      {tab === 'users' && (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Balance</th>
                <th className="text-left px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.name ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.role === 'ADMIN' ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-primary font-medium">{u.wallet?.balance ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-6 text-center text-muted-foreground text-sm">No users found.</div>
          )}
        </div>
      )}

      {/* Jobs table */}
      {tab === 'jobs' && (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-4 py-3 font-medium">Conversion</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Cost</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((j) => (
                <tr key={j.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{j.user.email}</td>
                  <td className="px-4 py-3 font-medium">{mimeLabel(j.inputMime)} → {mimeLabel(j.outputMime)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[j.status] ?? ''}`}>
                      {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{j.costTokens} tkn</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(j.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredJobs.length === 0 && (
            <div className="p-6 text-center text-muted-foreground text-sm">No jobs found.</div>
          )}
        </div>
      )}

      {/* Audit logs */}
      {tab === 'audit' && (
        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div key={log.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded text-primary">
                  {log.action}
                </span>
                <span className="text-muted-foreground">{log.user?.email ?? 'System'}</span>
              </div>
              <span className="text-muted-foreground text-xs">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <div className="glass rounded-xl p-6 text-center text-muted-foreground text-sm">No audit logs yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
