'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Coins, LogOut, Settings, LayoutDashboard, ArrowLeftRight, ShoppingBag, Shield } from 'lucide-react';

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
    <nav className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold gradient-text">
            FileForge
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === link.href
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Token balance */}
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-sm">
            <Coins className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-primary">{user?.balance ?? 0}</span>
          </div>

          <Link
            href="/settings"
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary/50"
          >
            <Settings className="w-4 h-4" />
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary/50"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
