'use client';

import { useState } from 'react';
import { Coins, Zap, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PACKS = [
  { id: 'pack_50', tokens: 50, amountCents: 499, price: '€4.99', label: 'Starter' },
  { id: 'pack_200', tokens: 200, amountCents: 1499, price: '€14.99', label: 'Popular', highlight: true },
  { id: 'pack_500', tokens: 500, amountCents: 2999, price: '€29.99', label: 'Best Value' },
];

interface Purchase {
  id: string;
  packId: string;
  amountCents: number;
  status: string;
  provider: string;
  createdAt: string | Date;
}

interface ShopClientProps {
  balance: number;
  purchases: Purchase[];
  mockMode: boolean;
}

export function ShopClient({ balance: initialBalance, purchases, mockMode }: ShopClientProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [loading, setLoading] = useState<string | null>(null);
  const [recentPurchases, setRecentPurchases] = useState(purchases);
  const { toast } = useToast();

  async function handlePurchase(packId: string) {
    setLoading(packId);

    if (mockMode) {
      // Mock purchase
      const res = await fetch('/api/shop/mock-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      setLoading(null);
      if (res.ok) {
        setBalance(data.newBalance);
        toast({ title: `+${data.tokens} tokens added!`, description: 'Mock payment successful.' });
        // Refresh purchases
        const pRes = await fetch('/api/shop/purchases');
        const pData = await pRes.json();
        setRecentPurchases(pData.purchases);
      } else {
        toast({ title: 'Purchase failed', description: data.error, variant: 'destructive' });
      }
    } else {
      // Real Stripe checkout
      const res = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      setLoading(null);
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: 'Checkout failed', description: data.error, variant: 'destructive' });
      }
    }
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Token Shop</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            Add tokens to your account to start converting.
            {mockMode && (
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                Mock mode active
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl shadow-inner group">
          <Coins className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
          <div className="text-right">
             <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Balance</div>
             <div className="text-xl font-black leading-none">{balance} <span className="text-sm font-normal text-muted-foreground">tokens</span></div>
          </div>
        </div>
      </div>

      {/* Packs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`glass rounded-[2.5rem] p-8 flex flex-col relative transition-all duration-500 hover:-translate-y-2 group overflow-hidden ${
              pack.highlight ? 'border-primary shadow-[0_0_30px_rgba(139,92,246,0.1)]' : 'hover:border-white/20'
            }`}
          >
            {pack.highlight && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-bl-2xl">
                Most Popular
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:border-primary/50 transition-all duration-500 shadow-inner">
                <Coins className="w-6 h-6 text-primary group-hover:rotate-12 transition-transform" />
              </div>
              <span className="text-lg font-black tracking-tight">{pack.label}</span>
            </div>
            
            <div className="mb-6 relative z-10">
              <div className="text-4xl font-black mb-1">{pack.price}</div>
              <div className="text-primary font-black uppercase tracking-widest text-sm">{pack.tokens} Tokens</div>
            </div>

            <ul className="space-y-3 mb-8 text-sm text-muted-foreground flex-1 relative z-10 font-medium italic">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                </div>
                Up to {Math.floor(pack.tokens / 2)} images
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                </div>
                Up to {Math.floor(pack.tokens / 4)} docs
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                </div>
                Lifetime validity
              </li>
            </ul>

            <button
              onClick={() => handlePurchase(pack.id)}
              disabled={loading === pack.id}
              className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl disabled:opacity-50 relative z-10 flex items-center justify-center gap-2 ${
                pack.highlight
                  ? 'bg-primary text-primary-foreground shadow-primary/20 hover:scale-[1.03] active:scale-95'
                  : 'bg-white/5 text-foreground hover:bg-white/10 border border-white/10 hover:border-white/20 active:scale-95'
              }`}
            >
              {loading === pack.id ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Processing…</>
              ) : mockMode ? (
                <><Zap className="w-4 h-4" /> Mock Purchase</>
              ) : (
                'Purchase Now'
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Purchase history */}
      <div className="space-y-6">
        <h2 className="text-xl font-black uppercase tracking-widest">Order History</h2>
        {recentPurchases.length === 0 ? (
          <div className="glass rounded-[2rem] p-12 text-center text-muted-foreground border-dashed border-white/10">
            <p className="font-medium italic">No previous orders found.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {recentPurchases.map((p) => (
              <div key={p.id} className="glass glass-hover rounded-2xl px-6 py-5 flex items-center justify-between transition-all">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-base font-black tracking-tight uppercase">{p.packId.replace('_', ' ')}</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      {new Date(p.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </span>
                  </div>
                  {p.provider === 'mock' && (
                    <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter">Mock</span>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xl font-black tracking-tight text-foreground/90">€{(p.amountCents / 100).toFixed(2)}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${
                    p.status === 'COMPLETED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
