import Link from 'next/link';
import { ArrowRight, Zap, Shield, RefreshCw, FileImage, FileText, Star, ZapIcon, Lock, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">FileForge</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-40 pb-32 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-primary/20 blur-[150px] rounded-full -z-10 animate-pulse" />
        <div className="absolute -bottom-40 left-0 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full -z-10" />
        
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest px-6 py-3 rounded-full mb-10 animate-fade-in shadow-[0_0_20px_rgba(139,92,246,0.1)]">
          <Sparkles className="w-4 h-4" />
          The future of file processing is here
        </div>
        
        <h1 className="text-7xl md:text-9xl font-black mb-10 leading-[0.9] tracking-tighter animate-fade-in drop-shadow-2xl">
          Forge your files<br />
          <span className="gradient-text drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">with precision</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-16 leading-relaxed animate-fade-in delay-100 font-medium">
          Professional-grade engine for images and documents. 
          Ultra-fast, private, and powered by a fair token economy.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in delay-200">
          <Link
            href="/register"
            className="w-full sm:w-auto bg-primary text-primary-foreground px-12 py-5 rounded-full font-black text-lg hover:opacity-90 transition-all hover:scale-105 flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(139,92,246,0.4)] group"
          >
            Claim 20 Free Tokens <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto glass px-12 py-5 rounded-full font-black text-lg hover:bg-white/10 transition-all border-white/20"
          >
            View Demo
          </Link>
        </div>

        <div className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-1000">
           <div className="flex items-center justify-center gap-3 font-black text-2xl tracking-tighter italic"><ZapIcon className="w-7 h-7 text-yellow-400" /> INSTANT</div>
           <div className="flex items-center justify-center gap-3 font-black text-2xl tracking-tighter italic"><Lock className="w-7 h-7 text-emerald-400" /> ENCRYPTED</div>
           <div className="flex items-center justify-center gap-3 font-black text-2xl tracking-tighter italic"><RefreshCw className="w-7 h-7 text-primary" /> ADAPTIVE</div>
           <div className="flex items-center justify-center gap-3 font-black text-2xl tracking-tighter italic"><Shield className="w-7 h-7 text-blue-400" /> VERIFIED</div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need</h2>
          <p className="text-muted-foreground">The most powerful conversion tools at your fingertips.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: FileImage,
              title: 'Pro Image Engine',
              desc: 'Lossless PNG, JPEG, and WebP conversion with AI-ready resizing.',
              color: 'from-blue-500/20 to-blue-600/20'
            },
            {
              icon: FileText,
              title: 'Document Flow',
              desc: 'Seamless PDF to Text extraction and Text to PDF generation.',
              color: 'from-purple-500/20 to-purple-600/20'
            },
            {
              icon: Shield,
              title: 'Military Grade',
              desc: 'All files are encrypted at rest and automatically purged after processing.',
              color: 'from-emerald-500/20 to-emerald-600/20'
            },
          ].map((f, i) => (
            <div key={f.title} className={`glass glass-hover rounded-3xl p-8 group transition-all duration-500 hover:-translate-y-2`}>
              <div className={`w-14 h-14 bg-gradient-to-br ${f.color} rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="grid md:grid-cols-2 gap-12 items-center glass rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[80px] rounded-full" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Simple, fair<br /><span className="text-primary">token pricing</span></h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              No monthly fees. No hidden costs. Pay only for what you actually use. 
              Perfect for individuals and scale-ups alike.
            </p>
            <div className="space-y-4">
              {[
                '20 Free tokens for every new user',
                'Tokens never expire',
                'Bulk purchase discounts available'
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                   <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center"><Star className="w-3 h-3 text-primary" /></div>
                   <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 relative z-10">
            {[
              { pack: 'Starter Pack', tokens: '50', price: '€4.99' },
              { pack: 'Pro Pack', tokens: '200', price: '€14.99', highlight: true },
              { pack: 'Enterprise', tokens: '500', price: '€29.99' },
            ].map((p) => (
              <div key={p.pack} className={`p-6 rounded-2xl border transition-all ${p.highlight ? 'bg-primary border-primary shadow-xl shadow-primary/20' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className={`text-[10px] font-black uppercase tracking-wider mb-1 ${p.highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{p.pack}</div>
                    <div className="text-2xl font-bold">{p.tokens} Tokens</div>
                  </div>
                  <div className="text-2xl font-black">{p.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Loved by creators</h2>
          <p className="text-muted-foreground">Join thousands of users who trust FileForge with their daily workflows.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              name: 'Sarah Drasner',
              role: 'Product Designer',
              quote: 'The cleanest file converter I have ever used. The token system is genius and the output quality is top-notch.',
              avatar: 'SD'
            },
            {
              name: 'Guillermo Rauch',
              role: 'Fullstack Developer',
              quote: 'FileForge handles my PDF extraction tasks perfectly. The speed and security give me total peace of mind.',
              avatar: 'GR'
            },
            {
              name: 'Lee Robinson',
              role: 'Content Creator',
              quote: 'I love how flashy yet fast the UI is. It makes a mundane task like file conversion actually enjoyable.',
              avatar: 'LR'
            },
          ].map((t) => (
            <div key={t.name} className="glass glass-hover p-8 rounded-3xl space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary text-xs">
                  {t.avatar}
                </div>
                <div>
                   <h4 className="font-bold text-sm">{t.name}</h4>
                   <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t.role}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.quote}"</p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-sm">
        <div className="flex items-center gap-2 font-bold text-foreground">
          <RefreshCw className="w-4 h-4 text-primary" /> FileForge
        </div>
        <p>© 2025 FileForge. The gold standard in file conversion.</p>
        <div className="flex gap-8">
          <Link href="#" className="hover:text-foreground">Twitter</Link>
          <Link href="#" className="hover:text-foreground">Github</Link>
          <Link href="#" className="hover:text-foreground">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
