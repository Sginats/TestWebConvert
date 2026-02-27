'use client';

import { useState } from 'react';
import { Coins, Zap, CheckCircle } from 'lucide-react';
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
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Token Shop</h1>
        <p className="text-muted-foreground mt-1">
          Balance: <span className="text-primary font-medium">{balance} tokens</span>
          {mockMode && (
            <span className="ml-2 text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
              Mock mode — no real payments
            </span>
          )}
        </p>
      </div>

      {/* Packs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`glass rounded-2xl p-6 flex flex-col ${pack.highlight ? 'border-primary/40' : ''}`}
          >
            {pack.highlight && (
              <div className="text-xs text-primary font-medium mb-2 uppercase tracking-wider">
                ⭐ Most Popular
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-primary/15 rounded-xl flex items-center justify-center">
                <Coins className="w-4.5 h-4.5 text-primary" />
              </div>
              <span className="font-semibold">{pack.label}</span>
            </div>
            <div className="text-3xl font-bold mb-0.5">{pack.price}</div>
            <div className="text-muted-foreground text-sm mb-4">{pack.tokens} tokens</div>

            <ul className="space-y-1.5 mb-6 text-sm text-muted-foreground flex-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ~{Math.floor(pack.tokens / 2)} image conversions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ~{Math.floor(pack.tokens / 4)} document conversions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Never expire
              </li>
            </ul>

            <button
              onClick={() => handlePurchase(pack.id)}
              disabled={loading === pack.id}
              className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50 ${
                pack.highlight
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'bg-secondary/70 text-foreground hover:bg-secondary border border-border'
              }`}
            >
              {loading === pack.id ? (
                'Processing…'
              ) : mockMode ? (
                <span className="flex items-center justify-center gap-2">
                  <Zap className="w-3.5 h-3.5" /> Mock Purchase
                </span>
              ) : (
                'Buy Now'
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Purchase history */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Purchase History</h2>
        {recentPurchases.length === 0 ? (
          <div className="glass rounded-xl p-6 text-center text-muted-foreground text-sm">
            No purchases yet.
          </div>
        ) : (
          <div className="space-y-2">
            {recentPurchases.map((p) => (
              <div key={p.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{p.packId}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  {p.provider === 'mock' && (
                    <span className="text-xs bg-yellow-500/15 text-yellow-400 px-1.5 py-0.5 rounded">mock</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">€{(p.amountCents / 100).toFixed(2)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.status === 'COMPLETED'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-yellow-500/15 text-yellow-400'
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
