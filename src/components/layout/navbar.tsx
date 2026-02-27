'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Coins, LogOut, Settings, LayoutDashboard, ArrowLeftRight, ShoppingBag, Shield, RefreshCw } from 'lucide-react';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user as any;

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/convert', label: 'Convert', icon: ArrowLeftRight },
    { href: '/shop', label: 'Shop', icon: ShoppingBag },
    ...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <nav className="border-b border-white/5 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
              <RefreshCw className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tighter">FileForge</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Token balance pill */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-sm shadow-inner group">
            <Coins className="w-4 h-4 text-primary group-hover:scale-125 transition-transform" />
            <span className="font-bold">{user?.balance ?? 0}</span>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              className="text-muted-foreground hover:text-foreground transition-all p-2.5 rounded-full hover:bg-white/5"
            >
              <Settings className="w-4 h-4" />
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-muted-foreground hover:text-destructive transition-all p-2.5 rounded-full hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
