import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { Mail } from 'lucide-react';

export type LegalSection = {
  id: string;
  title: string;
  body: React.ReactNode;
};

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  intro: React.ReactNode;
  sections: LegalSection[];
};

// Shared shell for /privacy-policy, /terms and /data-deletion — a sticky
// section-jump nav (desktop) + numbered content, matching the site's
// existing dark-navy/gold editorial language (About, Contact). Pure Server
// Component: the table of contents is plain anchor links, so no client JS
// is needed to read a legal document.
export default function LegalPageShell({ eyebrow, title, lastUpdated, intro, sections }: LegalPageShellProps) {
  return (
    <main className="min-h-screen bg-[#0B1E42]">
      <Navbar />
      <CartDrawer />

      <div className="max-w-7xl mx-auto px-4 py-3 text-[11px] text-white/60">
        <Link href="/" className="text-[#C9A24A] font-medium">Home</Link>
        <span className="mx-2 opacity-50">›</span>
        <span>{title}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        <p className="text-[#C9A24A] serif italic text-sm tracking-[2px] mb-1">{eyebrow}</p>
        <h1 className="serif text-4xl md:text-5xl text-white mb-3">{title}</h1>
        <p className="text-xs tracking-[1px] uppercase text-white/50 mb-4">Last updated: {lastUpdated}</p>
        <p className="text-sm text-white/70 leading-relaxed max-w-2xl">{intro}</p>
      </div>

      <section className="max-w-7xl mx-auto px-4 pb-16 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 items-start">
        {/* Table of contents — sticky on desktop, hidden on mobile (content
            is a normal linear read on small screens). */}
        <nav
          aria-label="Sections"
          className="hidden lg:block sticky top-28 bg-white/5 border border-[#C9A24A]/20 rounded-lg p-4"
        >
          <div className="text-[10px] tracking-[2px] uppercase text-[#C9A24A] mb-3">On this page</div>
          <ol className="space-y-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex gap-2 text-xs text-white/65 hover:text-[#C9A24A] leading-snug transition-colors"
                >
                  <span className="text-white/35 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <span>{s.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Content */}
        <div className="bg-white border border-[rgba(184,137,58,0.18)] rounded-lg p-6 md:p-10">
          <div className="space-y-10">
            {sections.map((s, i) => (
              <div key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="serif text-xl md:text-2xl text-[#1a1410] mb-3 flex items-baseline gap-2.5">
                  <span className="text-[#b8893a] text-sm tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </h2>
                <div className="text-sm text-[#3a2f24] leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_strong]:text-[#1a1410] [&_strong]:font-semibold [&_a]:text-[#b8893a] [&_a]:font-semibold [&_a:hover]:underline">
                  {s.body}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-[rgba(184,137,58,0.18)] flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 text-sm text-[#3a2f24]">
            <Mail size={16} className="text-[#b8893a] flex-shrink-0" aria-hidden="true" />
            <span>
              Questions about this page? Write to{' '}
              <a href="mailto:info@omgpgems.com" className="text-[#b8893a] font-semibold hover:underline">
                info@omgpgems.com
              </a>
              .
            </span>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
