import Link from 'next/link';
import { ArrowRight, Zap, Shield, RefreshCw, FileImage, FileText } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold gradient-text">FileForge</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-sm px-3 py-1.5 rounded-full mb-6">
          <Zap className="w-3.5 h-3.5" />
          Fast, secure file conversion
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Convert files with{' '}
          <span className="gradient-text">precision</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Professional image, document, and more — powered by a simple token system.
          No subscriptions. Pay only for what you convert.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            Start converting <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground transition-colors px-6 py-3"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: FileImage,
              title: 'Image Conversion',
              desc: 'PNG, JPG, WebP — convert with optional resize. 1x token multiplier.',
            },
            {
              icon: FileText,
              title: 'Document Conversion',
              desc: 'TXT to PDF and PDF to TXT with proper formatting. 2x multiplier.',
            },
            {
              icon: Shield,
              title: 'Secure & Private',
              desc: 'Files stored by UUID, unguessable download links, auto-deleted after 7 days.',
            },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 animate-fade-in">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing simple */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Simple token pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { pack: '50 tokens', price: '€4.99', note: 'Starter' },
            { pack: '200 tokens', price: '€14.99', note: 'Most popular', highlight: true },
            { pack: '500 tokens', price: '€29.99', note: 'Best value' },
          ].map((p) => (
            <div
              key={p.pack}
              className={`glass rounded-2xl p-6 text-center ${p.highlight ? 'border-primary/50' : ''}`}
            >
              {p.highlight && (
                <div className="text-xs text-primary font-medium mb-2 uppercase tracking-wider">
                  ⭐ {p.note}
                </div>
              )}
              <div className="text-3xl font-bold mb-1">{p.price}</div>
              <div className="text-muted-foreground">{p.pack}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-muted-foreground text-sm mt-6">
          New accounts start with <strong className="text-foreground">20 free tokens</strong>
        </p>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-muted-foreground text-sm">
        <p>© 2025 FileForge. Built with Next.js 14 + TypeScript.</p>
      </footer>
    </div>
  );
}
