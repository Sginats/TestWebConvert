'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      toast({ title: 'Login failed', description: result.error, variant: 'destructive' });
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[100px] rounded-full -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full -z-10" />
      
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
              <RefreshCw className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-3xl font-black tracking-tighter">FileForge</span>
          </Link>
          <p className="text-muted-foreground mt-4 font-medium italic">Welcome back to the forge.</p>
        </div>

        <div className="glass rounded-[2.5rem] p-10 shadow-2xl border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                placeholder="name@company.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-5 rounded-2xl font-black text-lg hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Authenticating…</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-muted-foreground font-medium">
              New here?{' '}
              <Link href="/register" className="text-primary font-bold hover:underline underline-offset-4">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 glass rounded-2xl p-4 text-center border-white/5">
           <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Demo Access</p>
           <p className="text-sm font-medium">admin@example.com / Admin123!</p>
        </div>
      </div>
    </div>
  );
}
