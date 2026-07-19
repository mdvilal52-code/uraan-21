'use client';

import { useCallback, useState } from 'react';

type Phase = {
  id: string;
  title: string;
  icon: string;
  color: string;
  accent: string;
  description: string;
  prompt: string;
};

const PHASES: Phase[] = [
  {
    id: 'P0',
    title: 'Phase 0 — Audit & Baseline',
    icon: '🔍',
    color: 'from-slate-700 to-slate-900',
    accent: '#94a3b8',
    description:
      'Scan every file. Build dependency map. Flag all quality issues before touching any code.',
    prompt: `You are a Senior Frontend Engineer + UI/UX Architect with 20+ years of experience specializing in luxury e-commerce, Next.js 14, TypeScript, and Tailwind CSS.

═══════════════════════════════════════════════
PROJECT CONTEXT
═══════════════════════════════════════════════
Project: Om Gauri Pulta — Gems, Jewellery & Rudraksh (omgpgems.com)
Stack: Next.js 14 · TypeScript · Tailwind CSS · Supabase · Razorpay
Goal: Make the ENTIRE site look 4K / Retina / Ultra-Premium without touching branding, colors, business logic, APIs, auth, or SEO.

═══════════════════════════════════════════════
PHASE 0 TASK — DEEP AUDIT (READ ONLY, NO EDITS)
═══════════════════════════════════════════════

Step 1 — File Structure Audit
Run: find . -type f \\( -name "*.tsx" -o -name "*.ts" -o -name "*.css" -o -name "*.json" \\) | grep -v node_modules | grep -v .next | sort
→ List ALL component files, pages, layouts, styles.

Step 2 — Tailwind Config Audit
Read tailwind.config.ts / tailwind.config.js.
Check:
  - Is fontFamily set with premium stack?
  - Is screens config customized for 2K/4K?
  - Is content array complete?
  - Are custom shadows, borderRadius, keyframes defined?
  - Is darkMode configured?

Step 3 — Global CSS Audit
Read app/globals.css or styles/globals.css.
Check:
  - font-smoothing set?
  - text-rendering: optimizeLegibility set?
  - image-rendering for crisp icons?
  - CSS custom properties defined?
  - Any overflow:hidden missing causing horizontal scroll?

Step 4 — next.config Audit
Read next.config.js / next.config.ts.
Check:
  - images.domains or remotePatterns set?
  - images.formats: ['image/avif', 'image/webp'] set?
  - images.deviceSizes: full range including 3840?
  - images.imageSizes complete?
  - compiler.removeConsole for production?
  - experimental.optimizeCss?

Step 5 — Typography Audit
Scan all layout.tsx / _app files.
Check:
  - Google Fonts / Next/Font setup (is it local subset or full load?)
  - Font variables defined and applied to html tag?
  - Is Inter, Playfair Display, or equivalent premium serif loaded?

Step 6 — Image Audit
Run: grep -r "next/image\\|<img " --include="*.tsx" -l
For each file found:
  - Is next/image used (not <img>)?
  - Is width/height or fill defined?
  - Is quality prop set (85 minimum)?
  - Is sizes prop set for responsive?
  - Is priority set on above-fold images?
  - Is placeholder="blur" used for product images?

Step 7 — Responsive Audit
Scan all pages/components for:
  - Fixed pixel widths (e.g., w-[320px] on containers)
  - Missing breakpoints (sm:, md:, lg:, xl:, 2xl:)
  - Overflow-x issues
  - Missing max-w- on containers
  - Mobile-first vs desktop-first inconsistencies

Step 8 — Performance Audit
Check for:
  - useEffect without cleanup
  - Missing Suspense boundaries
  - Non-dynamic heavy imports
  - Missing loading.tsx files
  - Non-optimized SVG icons (inline vs sprite)

Step 9 — Accessibility Audit
Check for:
  - Missing aria-label on icon buttons
  - Missing alt text on images
  - Color contrast issues (luxury gold on white — verify ratio)
  - Missing focus-visible styles
  - Missing role attributes

Step 10 — Build Error Pre-Check
Run: npx tsc --noEmit 2>&1 | head -50
Run: npx next lint 2>&1 | head -50

═══════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════
Return a structured audit report:

CRITICAL ISSUES (will break build or cause major UX failures):
- [filename:line] Issue description

HIGH PRIORITY (visible quality degradation):
- [filename:line] Issue description

MEDIUM PRIORITY (polish improvements):
- [filename:line] Issue description

FILES TO MODIFY IN PHASE 1:
- List every file that needs changes

Do NOT make any edits in this phase. Audit only.
Proceed to Phase 1 when audit is complete.`,
  },
  {
    id: 'P1',
    title: 'Phase 1 — Foundation Layer',
    icon: '⚙️',
    color: 'from-amber-800 to-amber-950',
    accent: '#f59e0b',
    description:
      'tailwind.config, next.config, globals.css — the bedrock for all visual quality.',
    prompt: `You are a Senior Frontend Engineer + Performance Expert.

PROJECT: Om Gauri Pulta (omgpgems.com) — Next.js 14 + TypeScript + Tailwind CSS
CONSTRAINT: Do NOT change branding, colors, business logic, APIs, auth, or SEO metadata.

═══════════════════════════════════════════════
PHASE 1 — FOUNDATION LAYER (3 files)
═══════════════════════════════════════════════

FILE 1: tailwind.config.ts (FULL REPLACEMENT)
══════════════════════════════════════════════

Write a complete tailwind.config.ts with:

SCREENS (mobile-first, comprehensive):
screens: {
  'xs': '375px',
  'sm': '480px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
  '4k': '3840px',
}

FONT FAMILY (preserve existing brand fonts, add fallbacks):
fontFamily: {
  sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  serif: ['var(--font-playfair)', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
  mono: ['var(--font-mono)', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
}

FONT SIZE (precise fluid scale):
fontSize: {
  'xs': ['0.75rem', { lineHeight: '1.125rem', letterSpacing: '0.025em' }],
  'sm': ['0.875rem', { lineHeight: '1.3125rem', letterSpacing: '0.015em' }],
  'base': ['1rem', { lineHeight: '1.625rem', letterSpacing: '0.01em' }],
  'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0.005em' }],
  'xl': ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '0em' }],
  '2xl': ['1.5rem', { lineHeight: '2.25rem', letterSpacing: '-0.01em' }],
  '3xl': ['1.875rem', { lineHeight: '2.625rem', letterSpacing: '-0.015em' }],
  '4xl': ['2.25rem', { lineHeight: '2.9rem', letterSpacing: '-0.02em' }],
  '5xl': ['3rem', { lineHeight: '3.6rem', letterSpacing: '-0.025em' }],
  '6xl': ['3.75rem', { lineHeight: '4.3rem', letterSpacing: '-0.03em' }],
  '7xl': ['4.5rem', { lineHeight: '5rem', letterSpacing: '-0.035em' }],
  '8xl': ['6rem', { lineHeight: '6.5rem', letterSpacing: '-0.04em' }],
  '9xl': ['8rem', { lineHeight: '8.5rem', letterSpacing: '-0.045em' }],
}

BORDER RADIUS (premium, not generic):
borderRadius: {
  'none': '0',
  'sm': '0.25rem',
  DEFAULT: '0.5rem',
  'md': '0.625rem',
  'lg': '0.875rem',
  'xl': '1.25rem',
  '2xl': '1.75rem',
  '3xl': '2.5rem',
  'full': '9999px',
}

BOX SHADOW (luxury depth system):
boxShadow: {
  'xs': '0 1px 2px 0 rgb(0 0 0 / 0.04)',
  'sm': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
  DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  'md': '0 8px 20px -3px rgb(0 0 0 / 0.1), 0 4px 8px -4px rgb(0 0 0 / 0.06)',
  'lg': '0 15px 35px -5px rgb(0 0 0 / 0.12), 0 8px 16px -6px rgb(0 0 0 / 0.07)',
  'xl': '0 25px 50px -12px rgb(0 0 0 / 0.18)',
  '2xl': '0 35px 70px -15px rgb(0 0 0 / 0.22)',
  'luxury': '0 20px 60px -10px rgb(0 0 0 / 0.15), 0 0 0 1px rgb(255 255 255 / 0.05)',
  'card': '0 2px 8px rgb(0 0 0 / 0.06), 0 8px 24px rgb(0 0 0 / 0.04)',
  'card-hover': '0 8px 24px rgb(0 0 0 / 0.1), 0 20px 48px rgb(0 0 0 / 0.06)',
  'btn': '0 2px 8px rgb(0 0 0 / 0.15), 0 1px 2px rgb(0 0 0 / 0.1)',
  'btn-hover': '0 6px 20px rgb(0 0 0 / 0.2), 0 2px 6px rgb(0 0 0 / 0.12)',
  'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.06)',
  'none': 'none',
}

TRANSITION TIMING (smooth premium curves):
transitionTimingFunction: {
  'luxury': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'sharp': 'cubic-bezier(0.4, 0, 0.6, 1)',
  'out': 'cubic-bezier(0, 0, 0.2, 1)',
  'in': 'cubic-bezier(0.4, 0, 1, 1)',
}

TRANSITION DURATION:
transitionDuration: {
  '150': '150ms',
  '200': '200ms',
  '250': '250ms',
  '300': '300ms',
  '400': '400ms',
  '500': '500ms',
  '700': '700ms',
  '1000': '1000ms',
}

KEYFRAMES (premium animations):
keyframes: {
  'fade-in': {
    '0%': { opacity: '0', transform: 'translateY(8px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  'fade-in-up': {
    '0%': { opacity: '0', transform: 'translateY(24px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  'scale-in': {
    '0%': { opacity: '0', transform: 'scale(0.95)' },
    '100%': { opacity: '1', transform: 'scale(1)' },
  },
  'slide-in-right': {
    '0%': { opacity: '0', transform: 'translateX(24px)' },
    '100%': { opacity: '1', transform: 'translateX(0)' },
  },
  'shimmer': {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
  'pulse-gold': {
    '0%, 100%': { boxShadow: '0 0 0 0 rgb(var(--color-gold) / 0.4)' },
    '50%': { boxShadow: '0 0 0 8px rgb(var(--color-gold) / 0)' },
  },
  'spin-slow': {
    'to': { transform: 'rotate(360deg)' },
  },
}

ANIMATION:
animation: {
  'fade-in': 'fade-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
  'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
  'scale-in': 'scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
  'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
  'shimmer': 'shimmer 2s linear infinite',
  'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
  'spin-slow': 'spin-slow 3s linear infinite',
  'none': 'none',
}

BACKGROUND IMAGE:
backgroundImage: {
  'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgb(255 255 255 / 0.08) 50%, transparent 100%)',
  'luxury-gradient': 'linear-gradient(135deg, var(--tw-gradient-stops))',
  'radial-soft': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
}

SPACING additions:
spacing: {
  '18': '4.5rem',
  '22': '5.5rem',
  '26': '6.5rem',
  '30': '7.5rem',
  '34': '8.5rem',
  '38': '9.5rem',
  '42': '10.5rem',
  '46': '11.5rem',
  '50': '12.5rem',
  '54': '13.5rem',
  '58': '14.5rem',
  '62': '15.5rem',
  '66': '16.5rem',
  '70': '17.5rem',
  '88': '22rem',
  '92': '23rem',
  '96': '24rem',
  '100': '25rem',
  '112': '28rem',
  '128': '32rem',
  '144': '36rem',
  '160': '40rem',
}

MAX WIDTH:
maxWidth: {
  'xxs': '16rem',
  'xs': '20rem',
  'sm': '24rem',
  'md': '28rem',
  'lg': '32rem',
  'xl': '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
  '6xl': '72rem',
  '7xl': '80rem',
  '8xl': '90rem',
  '9xl': '100rem',
  'screen-sm': '640px',
  'screen-md': '768px',
  'screen-lg': '1024px',
  'screen-xl': '1280px',
  'screen-2xl': '1536px',
  'none': 'none',
  'full': '100%',
  'prose': '65ch',
}

ASPECT RATIO:
aspectRatio: {
  'square': '1 / 1',
  'video': '16 / 9',
  'portrait': '3 / 4',
  'landscape': '4 / 3',
  'product': '4 / 5',
  'hero': '21 / 9',
  'card': '3 / 2',
}

plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')]


FILE 2: next.config.js (FULL REPLACEMENT)
══════════════════════════════════════════

Write complete next.config.js:

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 375, 390, 430, 480, 540, 640, 750, 828, 1080, 1200, 1440, 1920, 2048, 2560, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 256, 384, 512],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // Keep all existing remotePatterns from current config
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  poweredByHeader: false,
  compress: true,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
    {
      source: '/fonts/(.*)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/_next/static/(.*)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
  ],
};

module.exports = nextConfig;


FILE 3: app/globals.css (CRITICAL ADDITIONS — merge, do not replace custom styles)
══════════════════════════════════════════

Add these at the TOP of globals.css after @tailwind directives:

/* ============================================
   ULTRA HD RENDERING — DO NOT REMOVE
   ============================================ */

/* 1. Anti-aliasing & sub-pixel rendering */
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1, "pnum" 1, "tnum" 0, "onum" 1, "lnum" 0;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  scroll-behavior: smooth;
}

/* 2. Box model reset (premium) */
*, *::before, *::after {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}

/* 3. Image quality */
img, video {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  max-width: 100%;
  height: auto;
}

/* 4. SVG sharpness */
svg {
  shape-rendering: geometricPrecision;
  text-rendering: geometricPrecision;
}

/* 5. Prevent horizontal scroll globally */
body {
  overflow-x: hidden;
  min-height: 100dvh;
  -webkit-font-smoothing: antialiased;
}

/* 6. Focus visible — accessibility + premium */
:focus-visible {
  outline: 2px solid var(--color-brand, #c9a84c);
  outline-offset: 3px;
  border-radius: 4px;
}
:focus:not(:focus-visible) {
  outline: none;
}

/* 7. Selection color — brand */
::selection {
  background-color: rgb(var(--color-gold-rgb, 201 168 76) / 0.25);
  color: inherit;
}

/* 8. Smooth scroll offset for sticky header */
:root {
  scroll-padding-top: 80px;
}

/* 9. Skeleton shimmer utility */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

/* 10. Premium scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgb(0 0 0 / 0.15);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
::-webkit-scrollbar-thumb:hover { background: rgb(0 0 0 / 0.3); }

/* 11. Print */
@media print {
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}

/* 12. Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* 13. High DPI / Retina media queries */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  img { image-rendering: -webkit-optimize-contrast; }
}

/* 14. Container utility */
.container-luxury {
  width: 100%;
  max-width: 1440px;
  margin-left: auto;
  margin-right: auto;
  padding-left: clamp(1rem, 4vw, 3rem);
  padding-right: clamp(1rem, 4vw, 3rem);
}

/* 15. Text balance */
h1, h2, h3, h4, h5, h6 {
  text-wrap: balance;
}
p {
  text-wrap: pretty;
}

After all edits, run:
  npx tsc --noEmit
  npx next lint --fix
  npm run build

Report any errors with full stack trace.`,
  },
  {
    id: 'P2',
    title: 'Phase 2 — Typography System',
    icon: '✍️',
    color: 'from-emerald-800 to-emerald-950',
    accent: '#34d399',
    description:
      'Font loading, rendering, spacing — every character crystal clear on all screens.',
    prompt: `You are a Senior Typography Specialist + Next.js 14 Expert.

PROJECT: Om Gauri Pulta (omgpgems.com)
CONSTRAINT: Keep existing brand font choices. Only improve loading, rendering, and spacing.

═══════════════════════════════════════════════
PHASE 2 — TYPOGRAPHY SYSTEM
═══════════════════════════════════════════════

STEP 1 — Read current app/layout.tsx font setup
Report what fonts are currently loaded and how.

STEP 2 — Upgrade font loading in app/layout.tsx
Replace with next/font/google (local subset, zero CLS):

import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  adjustFontFallback: true,
  weight: ['300', '400', '500', '600', '700', '800'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  preload: true,
  fallback: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
  adjustFontFallback: true,
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
});

Apply to <html> tag:
<html lang="en" className={\`\${inter.variable} \${playfair.variable}\`}>

STEP 3 — Create utility typography classes in globals.css

/* =========================================
   TYPOGRAPHY UTILITIES — LUXURY SCALE
   ========================================= */

/* Display headings — Playfair, very large */
.type-display-xl {
  font-family: var(--font-playfair), Georgia, serif;
  font-size: clamp(2.5rem, 6vw, 5rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  font-feature-settings: "kern" 1, "liga" 1;
}

.type-display-lg {
  font-family: var(--font-playfair), Georgia, serif;
  font-size: clamp(2rem, 4.5vw, 3.75rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.025em;
}

.type-display-md {
  font-family: var(--font-playfair), Georgia, serif;
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

/* Section headings — Inter */
.type-heading-lg {
  font-family: var(--font-inter), system-ui, sans-serif;
  font-size: clamp(1.25rem, 2.5vw, 1.875rem);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.015em;
}

/* Body — Inter, optimized */
.type-body-lg {
  font-family: var(--font-inter), system-ui, sans-serif;
  font-size: clamp(1rem, 1.2vw, 1.125rem);
  font-weight: 400;
  line-height: 1.75;
  letter-spacing: 0.005em;
}

.type-body {
  font-family: var(--font-inter), system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.625;
  letter-spacing: 0.01em;
}

/* Caption / label */
.type-caption {
  font-family: var(--font-inter), system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Price display */
.type-price {
  font-family: var(--font-inter), system-ui, sans-serif;
  font-feature-settings: "tnum" 1, "lnum" 1;
  font-variant-numeric: tabular-nums lining-nums;
}

STEP 4 — Scan ALL pages and replace raw Tailwind font classes
For each file in:
  app/(store)/page.tsx (Home)
  app/(store)/about/page.tsx
  app/(store)/products/page.tsx
  app/(store)/products/[id]/page.tsx
  app/(store)/cart/page.tsx
  app/(store)/checkout/page.tsx
  app/(store)/contact/page.tsx
  app/(store)/blog/page.tsx
  + any other pages

Rules:
  - h1 → font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight
  - h2 → font-serif text-2xl md:text-3xl lg:text-4xl font-semibold leading-snug tracking-tight
  - h3 → font-sans text-xl md:text-2xl font-semibold leading-snug
  - p (body) → font-sans text-base md:text-lg leading-relaxed tracking-wide text-opacity-90
  - label → font-sans text-xs font-semibold uppercase tracking-widest
  - price → font-sans tabular-nums text-xl md:text-2xl font-bold

STEP 5 — Verify output
Confirm fonts load in Chrome DevTools > Network tab filter: Font
Confirm no layout shift (CLS should be < 0.05 for text)
Confirm Playfair renders correctly at 1x and 2x DPR.

Run:
  npm run build

Report any build errors with full stack trace.`,
  },
  {
    id: 'P3',
    title: 'Phase 3 — Image & Media System',
    icon: '🖼️',
    color: 'from-blue-800 to-blue-950',
    accent: '#60a5fa',
    description:
      'Every image: AVIF/WebP, correct sizes, no blur, perfect aspect ratio.',
    prompt: `You are a Senior Next.js 14 Image Optimization Expert.

PROJECT: Om Gauri Pulta (omgpgems.com) — Luxury Jewellery
CONSTRAINT: Do not change image sources, only upgrade how they are rendered.

═══════════════════════════════════════════════
PHASE 3 — IMAGE & MEDIA SYSTEM
═══════════════════════════════════════════════

STEP 1 — Audit all image usage
Run: grep -rn "<img\\|next/image\\|Image from" --include="*.tsx" src/ app/ components/ | head -100
Identify every file using <img> tags (MUST be upgraded) vs next/image (audit props).

STEP 2 — Image Component Standards

For HERO images (above fold, full-width):
<Image
  src={src}
  alt={descriptiveAlt}
  fill
  priority
  quality={90}
  sizes="100vw"
  style={{ objectFit: 'cover', objectPosition: 'center' }}
  placeholder="blur"
  blurDataURL={blurDataURL}  // generate 10px inline base64 placeholder
/>

For PRODUCT CARD images (grid thumbnails):
<Image
  src={src}
  alt={productName + ' — Om Gauri Pulta'}
  fill
  quality={85}
  sizes="(max-width: 375px) 160px, (max-width: 480px) 200px, (max-width: 768px) calc(50vw - 24px), (max-width: 1024px) calc(33vw - 24px), (max-width: 1280px) calc(25vw - 24px), 320px"
  style={{ objectFit: 'cover', objectPosition: 'center top' }}
  placeholder="blur"
  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmM2YwZTgiLz48L3N2Zz4="
/>

For PRODUCT DETAIL images (large view):
<Image
  src={src}
  alt={alt}
  fill
  priority
  quality={95}
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 45vw"
  style={{ objectFit: 'contain', objectPosition: 'center' }}
/>

For CATEGORY BANNER images:
<Image
  src={src}
  alt={categoryName + ' collection — Om Gauri Pulta'}
  fill
  quality={88}
  sizes="(max-width: 768px) 100vw, 50vw"
  style={{ objectFit: 'cover', objectPosition: 'center' }}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQ..."
/>

For LOGO (SVG preferred):
- If logo is SVG → keep as <img> or inline SVG (SVG is already crisp)
- If logo is PNG → convert to next/image with specific width/height, quality={100}
- Provide 1x and 2x versions in public folder: logo.png + logo@2x.png

For AVATAR / SMALL ICONS:
<Image
  src={src}
  alt={alt}
  width={48}
  height={48}
  quality={90}
  style={{ borderRadius: '50%', objectFit: 'cover' }}
/>

STEP 3 — Create blur placeholder generator utility
Create lib/image-utils.ts:

export function getBlurDataURL(color = '#f3f0e8'): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const svg = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="rgb(\${r},\${g},\${b})"/></svg>\`;
  return \`data:image/svg+xml;base64,\${btoa(svg)}\`;
}

export function getProductImageProps(index: number) {
  return {
    priority: index < 4, // first 4 products eager, rest lazy
    quality: index === 0 ? 90 : 85,
    loading: index < 4 ? ('eager' as const) : ('lazy' as const),
    placeholder: 'blur' as const,
    blurDataURL: getBlurDataURL('#f5f0e8'),
  };
}

STEP 4 — Fix every <img> tag found in Step 1
Replace with next/image. Apply correct props per type above.
Ensure parent div has:
  - position: relative (for fill images)
  - Defined aspect-ratio OR height (never 0 height)
  - overflow-hidden

STEP 5 — Product image skeleton
Create components/ui/ImageSkeleton.tsx:

import { cn } from '@/lib/utils';

export function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-amber-50/50',
        'before:absolute before:inset-0',
        'before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent',
        'before:animate-shimmer before:bg-[length:200%_100%]',
        className
      )}
      aria-hidden="true"
    />
  );
}

STEP 6 — Run build and verify
npm run build
Check: No "Image with src ... has invalid props" warnings
Check: No "missing alt" warnings
Check: No layout shift from images (add explicit aspect-ratio wrappers)`,
  },
  {
    id: 'P4',
    title: 'Phase 4 — Component Library Upgrade',
    icon: '🧩',
    color: 'from-purple-800 to-purple-950',
    accent: '#c084fc',
    description:
      'Buttons, Cards, Forms, Badges, Inputs — every UI element pixel-perfect.',
    prompt: `You are a Senior React + Tailwind UI Component Engineer.

PROJECT: Om Gauri Pulta (omgpgems.com)
CONSTRAINT: Keep existing component APIs and props. Only improve visual quality.

═══════════════════════════════════════════════
PHASE 4 — COMPONENT LIBRARY UPGRADE
═══════════════════════════════════════════════

Create/upgrade these files. Read current version first, then improve.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT 1: components/ui/Button.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

'use client';
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'luxury';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-brand-600 text-white',
    'hover:bg-brand-700 active:bg-brand-800',
    'shadow-btn hover:shadow-btn-hover',
    'hover:-translate-y-0.5 active:translate-y-0',
  ),
  secondary: cn(
    'bg-brand-50 text-brand-700 border border-brand-200',
    'hover:bg-brand-100 active:bg-brand-200',
  ),
  outline: cn(
    'bg-transparent border-2 border-current',
    'hover:bg-current/5 active:bg-current/10',
  ),
  ghost: cn(
    'bg-transparent text-current',
    'hover:bg-current/8 active:bg-current/12',
  ),
  danger: cn(
    'bg-red-600 text-white',
    'hover:bg-red-700 active:bg-red-800',
    'shadow-btn hover:shadow-btn-hover',
  ),
  luxury: cn(
    'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600',
    'text-white font-semibold',
    'shadow-[0_2px_12px_rgb(180_120_0/0.35)] hover:shadow-[0_6px_24px_rgb(180_120_0/0.45)]',
    'hover:-translate-y-0.5 active:translate-y-0',
    'bg-[length:200%_100%] bg-left hover:bg-right',
  ),
};

const sizes: Record<ButtonSize, string> = {
  xs: 'h-7 px-3 text-xs gap-1 rounded-md',
  sm: 'h-9 px-4 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-6 text-base gap-2 rounded-xl',
  lg: 'h-13 px-8 text-lg gap-2.5 rounded-xl',
  xl: 'h-16 px-10 text-xl gap-3 rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, leftIcon, rightIcon, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        // Base
        'inline-flex items-center justify-center font-semibold',
        'transition-all duration-200 ease-smooth',
        'select-none cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'will-change-transform',
        // Touch targets
        'min-w-[44px] min-h-[44px]',
        // Variant
        variants[variant],
        // Size
        sizes[size],
        // Width
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
);
Button.displayName = 'Button';


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT 2: components/ui/Card.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Premium card with glass effect, equal height, hover lift:

export function Card({ className, hover = true, glass = false, ...props }) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl overflow-hidden',
        'bg-white border border-black/[0.06]',
        'shadow-card',
        hover && [
          'transition-all duration-300 ease-luxury',
          'hover:shadow-card-hover hover:-translate-y-1',
          'hover:border-black/10',
        ],
        glass && 'bg-white/70 backdrop-blur-xl',
        className
      )}
      {...props}
    />
  );
}

export function CardImage({ src, alt, aspectRatio = 'aspect-[4/5]', ...props }) {
  return (
    <div className={cn('relative overflow-hidden', aspectRatio)}>
      <Image
        src={src}
        alt={alt}
        fill
        quality={85}
        style={{ objectFit: 'cover' }}
        sizes="(max-width: 768px) calc(50vw - 24px), (max-width: 1280px) calc(33vw - 24px), 320px"
      />
      {/* Gradient overlay for text legibility if needed */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}

export function CardBody({ className, ...props }) {
  return <div className={cn('flex flex-col flex-1 p-5 md:p-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('px-5 pb-5 md:px-6 md:pb-6 pt-0 mt-auto', className)} {...props} />;
}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT 3: components/ui/Input.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Premium input with floating label effect:

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700 tracking-wide">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'h-12 px-4 rounded-xl w-full',
          'bg-white border border-gray-200',
          'text-gray-900 text-base placeholder:text-gray-400',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500',
          'hover:border-gray-300',
          'disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60',
          error && 'border-red-400 focus:ring-red-500/40 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><ErrorIcon /> {error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
);


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT 4: components/ui/Badge.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'luxury' | 'new' | 'sale';

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  luxury: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-transparent',
  new: 'bg-emerald-500 text-white border-transparent',
  sale: 'bg-red-500 text-white border-transparent',
};

export function Badge({ variant = 'default', className, children }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5',
      'text-xs font-semibold rounded-full border',
      'leading-none tracking-wide uppercase',
      badgeVariants[variant],
      className
    )}>
      {children}
    </span>
  );
}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT 5: components/ui/Skeleton.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100',
        'bg-[length:200%_100%] animate-shimmer',
        className
      )}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}


After all component upgrades:
npm run build
Fix any TypeScript errors immediately.`,
  },
  {
    id: 'P5',
    title: 'Phase 5 — Page-Level Fixes (All Pages)',
    icon: '📄',
    color: 'from-rose-800 to-rose-950',
    accent: '#fb7185',
    description:
      'Home, Products, Cart, Checkout, Contact — every page premium on every screen.',
    prompt: `You are a Senior Next.js 14 Frontend Developer specializing in luxury e-commerce UI.

PROJECT: Om Gauri Pulta (omgpgems.com)
CONSTRAINT: No business logic, API, auth, or content changes.

═══════════════════════════════════════════════
PHASE 5 — PAGE-LEVEL RESPONSIVE + QUALITY FIX
═══════════════════════════════════════════════

Process each page in this order. For EACH page:
1. Read the current file
2. Apply the improvements below
3. Save and move to next

━━━━━━━━━━━━━━━━━━━━
PAGE 1: HOME (app/page.tsx or app/(store)/page.tsx)
━━━━━━━━━━━━━━━━━━━━

Hero Section:
  - min-height: 100svh (NOT 100vh — avoids mobile browser bar issue)
  - Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12
  - H1: font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl
  - CTA buttons: flex-col sm:flex-row gap-4 (stacked on mobile, side by side on tablet+)
  - Hero image: priority, quality={90}, fill with object-cover

Featured Products Grid:
  - grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6
  - Equal height cards using flex-col h-full
  - Product image: aspect-[4/5] object-cover
  - Hover: group class on card, scale-[1.02] on image with overflow-hidden

Category Section:
  - grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6
  - Each card: aspect-[16/9] sm:aspect-[4/3] with overlay text

Testimonials:
  - Overflow carousel on mobile (scroll-x snap)
  - Grid on desktop: grid-cols-1 md:grid-cols-3

━━━━━━━━━━━━━━━━━━━━
PAGE 2: PRODUCTS (app/(store)/products/page.tsx)
━━━━━━━━━━━━━━━━━━━━

Filters:
  - Sidebar on desktop (lg:w-64), bottom sheet on mobile
  - Sticky top-[80px] sidebar

Product Grid:
  - grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5
  - gap-3 sm:gap-4 md:gap-5 lg:gap-6
  - Product card: group cursor-pointer

Pagination:
  - Center aligned, proper touch targets (min 44px)

━━━━━━━━━━━━━━━━━━━━
PAGE 3: PRODUCT DETAIL (app/(store)/products/[id]/page.tsx)
━━━━━━━━━━━━━━━━━━━━

Image Gallery:
  - Mobile: full-width horizontal scroll snap
  - Desktop: sticky left column (lg:sticky lg:top-[80px])
  - Main image: aspect-square with contain (not cover) for jewellery details
  - Thumbnails: flex gap-2 overflow-x-auto

Product Info:
  - Proper reading hierarchy: Category badge → Name → Rating → Price → Description → Add to Cart
  - Price: text-3xl md:text-4xl font-bold tabular-nums
  - Add to Cart button: h-14 w-full md:w-auto (full width on mobile)

━━━━━━━━━━━━━━━━━━━━
PAGE 4: CART (app/(store)/cart/page.tsx)
━━━━━━━━━━━━━━━━━━━━

Layout:
  - flex flex-col lg:flex-row gap-8
  - Cart items: flex-1 min-w-0
  - Order summary: lg:w-96 lg:flex-shrink-0

Cart item:
  - flex items-start gap-4
  - Image: w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover flex-shrink-0
  - Remove button: min 44x44 touch target

━━━━━━━━━━━━━━━━━━━━
PAGE 5: CHECKOUT (app/(store)/checkout/page.tsx)
━━━━━━━━━━━━━━━━━━━━

Form layout:
  - flex flex-col xl:flex-row gap-8
  - Form section: flex-1
  - Summary: xl:w-96

Form fields:
  - Full width on mobile
  - grid grid-cols-1 sm:grid-cols-2 gap-4 for side-by-side fields
  - Phone: international format input
  - All inputs: h-12 min-w-0 (prevent overflow)

━━━━━━━━━━━━━━━━━━━━
PAGE 6: CONTACT (app/(store)/contact/page.tsx)
━━━━━━━━━━━━━━━━━━━━
  - grid grid-cols-1 lg:grid-cols-2 gap-12
  - Map/info left, form right (swap order on mobile — form first)

━━━━━━━━━━━━━━━━━━━━
ALL PAGES — GLOBAL RULES
━━━━━━━━━━━━━━━━━━━━

Container: Always use max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16
Never use fixed widths like w-[800px] on responsive sections.
Every section: py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32
Section titles: text-center max-w-3xl mx-auto mb-8 md:mb-12 lg:mb-16
All buttons inside forms: type="submit" (not "button") for accessibility
All external links: target="_blank" rel="noopener noreferrer"

After ALL pages:
npm run build
List any remaining errors.`,
  },
  {
    id: 'P6',
    title: 'Phase 6 — Navigation & Header',
    icon: '🧭',
    color: 'from-indigo-800 to-indigo-950',
    accent: '#818cf8',
    description:
      'Sticky header, mobile menu, mega menu — zero flicker, buttery smooth.',
    prompt: `You are a Senior Frontend Engineer specializing in navigation UX and performance.

PROJECT: Om Gauri Pulta (omgpgems.com)
CONSTRAINT: Keep all nav links, routes, and branding. Only improve quality.

═══════════════════════════════════════════════
PHASE 6 — NAVIGATION & HEADER SYSTEM
═══════════════════════════════════════════════

Read: components/Header.tsx (or components/Navbar.tsx or app/components/header.tsx)
Read: components/MobileMenu.tsx (if exists)

━━━━━━━━━━━━━━━━━━━━
STICKY HEADER (anti-flicker)
━━━━━━━━━━━━━━━━━━━━

'use client';
import { useState, useEffect, useRef } from 'react';

function useScrolled(threshold = 10) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    // Initial check
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [threshold]);

  return scrolled;
}

Header classes:
  - Base: fixed top-0 left-0 right-0 z-50 will-change-transform
  - Transition: transition-all duration-300 ease-smooth
  - When not scrolled (hero): bg-transparent
  - When scrolled: bg-white/95 backdrop-blur-md shadow-sm border-b border-black/[0.06]

Height (consistent — prevents layout shift):
  - Mobile: h-16 (64px)
  - Desktop: h-20 (80px)

Add: <div style={{ height: scrolled ? '80px' : '0' }} /> if using fixed positioning
OR: use layout.tsx body padding-top: '80px'

━━━━━━━━━━━━━━━━━━━━
MOBILE HAMBURGER MENU
━━━━━━━━━━━━━━━━━━━━

Animated hamburger (pure CSS, no JS for the animation):

<button
  onClick={() => setOpen(!open)}
  className="relative w-11 h-11 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors"
  aria-label={open ? 'Close menu' : 'Open menu'}
  aria-expanded={open}
>
  <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
  <div className="w-5 flex flex-col gap-[5px]">
    <span className={cn(
      'block h-0.5 bg-current rounded-full transition-all duration-300',
      open ? 'rotate-45 translate-y-[7px]' : ''
    )} />
    <span className={cn(
      'block h-0.5 bg-current rounded-full transition-all duration-200',
      open ? 'opacity-0 scale-x-0' : ''
    )} />
    <span className={cn(
      'block h-0.5 bg-current rounded-full transition-all duration-300',
      open ? '-rotate-45 -translate-y-[7px]' : ''
    )} />
  </div>
</button>

Mobile menu panel (slide down / full-screen):
  - position: fixed, inset-0, z-40
  - bg-white
  - Transform: translateY(-100%) → translateY(0) when open
  - transition: transform 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94)
  - Close on: ESC key, outside click, route change
  - Body scroll lock: document.body.style.overflow = 'hidden' when open

━━━━━━━━━━━━━━━━━━━━
CART ICON BADGE
━━━━━━━━━━━━━━━━━━━━

<div className="relative">
  <CartIcon className="w-6 h-6" />
  {count > 0 && (
    <span className={cn(
      'absolute -top-2 -right-2',
      'min-w-[18px] h-[18px] px-1',
      'flex items-center justify-center',
      'text-[10px] font-bold text-white',
      'bg-brand-600 rounded-full',
      'ring-2 ring-white',
      'animate-scale-in',
    )}>
      {count > 99 ? '99+' : count}
    </span>
  )}
</div>

━━━━━━━━━━━━━━━━━━━━
ACTIVE LINK INDICATOR
━━━━━━━━━━━━━━━━━━━━

Use next/navigation usePathname:

const active = pathname === href || pathname.startsWith(href + '/');

className={cn(
  'relative text-sm font-medium transition-colors duration-200',
  'after:absolute after:bottom-0 after:left-0 after:right-0',
  'after:h-0.5 after:rounded-full after:bg-brand-600',
  'after:transition-transform after:duration-200',
  active ? 'text-brand-600 after:scale-x-100' : 'text-gray-600 hover:text-gray-900 after:scale-x-0 hover:after:scale-x-100'
)}

━━━━━━━━━━━━━━━━━━━━
FOOTER
━━━━━━━━━━━━━━━━━━━━

Read current footer. Improve:
- grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12
- Social icons: SVG only, 44x44 touch targets
- Newsletter input: h-12, proper focus state
- Copyright: border-t border-black/[0.06] pt-8 mt-12

Run: npm run build`,
  },
  {
    id: 'P7',
    title: 'Phase 7 — Performance & Lighthouse',
    icon: '⚡',
    color: 'from-yellow-800 to-yellow-950',
    accent: '#fbbf24',
    description:
      'CLS, LCP, FID — Lighthouse 95+ on Performance, Accessibility, SEO.',
    prompt: `You are a Senior Web Performance Engineer specializing in Core Web Vitals.

PROJECT: Om Gauri Pulta (omgpgems.com) — Next.js 14
TARGET: Lighthouse Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95

═══════════════════════════════════════════════
PHASE 7 — PERFORMANCE & LIGHTHOUSE OPTIMIZATION
═══════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━
1. LAYOUT SHIFT (CLS target: < 0.05)
━━━━━━━━━━━━━━━━━━━━

Every Image must have:
  - Explicit aspect ratio wrapper OR width/height OR fill with positioned parent
  - No img loading from Supabase without blurDataURL

Every font:
  - next/font with display: 'swap' and adjustFontFallback: true
  - Font variables applied to <html>

Every dynamic content:
  - Skeleton with SAME dimensions as loaded content
  - min-h-[Xpx] on containers that load data

━━━━━━━━━━━━━━━━━━━━
2. LCP (target: < 2.5s)
━━━━━━━━━━━━━━━━━━━━

Hero image:
  - priority={true}
  - fetchpriority="high" (added by Next.js with priority)
  - preload link in <head> (auto with next/image priority)

Above-fold content:
  - No lazy loading for first 4 product images
  - Remove suspense boundaries from above-fold content
  - Static generation (generateStaticParams) for product pages

━━━━━━━━━━━━━━━━━━━━
3. CODE SPLITTING
━━━━━━━━━━━━━━━━━━━━

Dynamic imports for heavy components:
  import dynamic from 'next/dynamic';

  const ReviewSection = dynamic(() => import('@/components/ReviewSection'), {
    loading: () => <ReviewSkeleton />,
    ssr: false, // only for client-only components
  });

  const WhatsAppWidget = dynamic(() => import('@/components/WhatsAppWidget'), {
    ssr: false,
  });

Apply dynamic imports to:
  - Any modal/dialog component
  - WhatsApp button/widget
  - Review/testimonial sections
  - Admin panel imports
  - Any third-party embeds (maps, etc.)

━━━━━━━━━━━━━━━━━━━━
4. SUSPENSE BOUNDARIES
━━━━━━━━━━━━━━━━━━━━

Wrap data-fetching server components:
  import { Suspense } from 'react';

  <Suspense fallback={<ProductGridSkeleton />}>
    <ProductGrid category={category} />
  </Suspense>

Add loading.tsx for each route segment:
  app/(store)/products/loading.tsx → <ProductGridSkeleton />
  app/(store)/products/[id]/loading.tsx → <ProductDetailSkeleton />
  app/(store)/cart/loading.tsx → <CartSkeleton />

━━━━━━━━━━━━━━━━━━━━
5. BUNDLE OPTIMIZATION
━━━━━━━━━━━━━━━━━━━━

Check package.json for:
  - Is date-fns imported entirely? → use tree-shakable: import { format } from 'date-fns'
  - Is lodash installed? → replace with native JS or 'lodash-es'
  - Is moment.js installed? → replace with date-fns

In next.config.js:
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', '@radix-ui/react-icons'],
  }

━━━━━━━━━━━━━━━━━━━━
6. PRELOADING & PREFETCHING
━━━━━━━━━━━━━━━━━━━━

In app/layout.tsx <head>:
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link rel="preconnect" href="YOUR_SUPABASE_URL" />
  <link rel="dns-prefetch" href="https://api.razorpay.com" />

━━━━━━━━━━━━━━━━━━━━
7. ACCESSIBILITY AUDIT
━━━━━━━━━━━━━━━━━━━━

Run: npx axe-core or use the Lighthouse accessibility tab.

Fix:
  - All icon buttons: aria-label required
  - All images: meaningful alt text (not "image" or "photo")
  - All form inputs: associated <label> elements
  - Color contrast: body text on white must be ≥ 4.5:1 ratio
  - Heading hierarchy: no skipping h1→h3
  - Landmark regions: <header>, <main>, <footer>, <nav>
  - Skip-to-content link:
    <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg">
      Skip to content
    </a>

━━━━━━━━━━━━━━━━━━━━
8. FINAL BUILD VERIFICATION
━━━━━━━━━━━━━━━━━━━━

Run these IN ORDER and fix all errors before moving on:

1. npx tsc --noEmit 2>&1
2. npx next lint 2>&1
3. npm run build 2>&1
4. Check .next/analyze/ for bundle sizes (if @next/bundle-analyzer installed)

PASSING CRITERIA:
  ✓ Build succeeds with 0 errors
  ✓ No TypeScript errors
  ✓ No ESLint errors
  ✓ Bundle size: First Load JS < 200KB per route
  ✓ No "Image is missing required 'alt' prop" warnings
  ✓ No hydration warnings in console`,
  },
  {
    id: 'P8',
    title: 'Phase 8 — Final QA Loop',
    icon: '✅',
    color: 'from-teal-800 to-teal-950',
    accent: '#2dd4bf',
    description: 'Self-correcting validation loop — runs until ALL checks pass.',
    prompt: `You are a Senior QA Engineer + Frontend Architect.

PROJECT: Om Gauri Pulta (omgpgems.com)
This is the FINAL VALIDATION PHASE. All previous phases must be complete.

═══════════════════════════════════════════════
PHASE 8 — SELF-CORRECTING QA LOOP
═══════════════════════════════════════════════

Run this loop until ALL checks pass. Maximum 3 iterations before flagging for human review.

━━━━━━━━━━━━━━━━━━━━
LOOP ITERATION START
━━━━━━━━━━━━━━━━━━━━

ITERATION #: [auto-increment each loop]

CHECKPOINT 1 — Build Health
  □ npx tsc --noEmit → 0 errors
  □ npx next lint → 0 errors, 0 warnings
  □ npm run build → ✓ successful
  □ No "SyntaxError" in build output
  □ No "Module not found" errors

  IF ANY FAIL → Fix immediately → Restart loop

CHECKPOINT 2 — Visual Quality (manual or with playwright)
  □ fonts loading (not system fallback rendering)
  □ No layout shift visible on page load
  □ Hero image sharp, not blurry
  □ Product images correct aspect ratio, no stretching
  □ Cards equal height in grid
  □ No horizontal scroll at any breakpoint
  □ Mobile menu opens/closes smoothly
  □ No overlapping elements at 320px width
  □ 4K display (3840px): text and images crisp, no pixelation

  IF ANY FAIL → Fix the specific component → Mark as fixed → Re-check

CHECKPOINT 3 — Responsive Breakpoints
  Test at each width (browser dev tools):
  □ 320px — no overflow, no broken layout
  □ 375px — clean mobile
  □ 480px — small mobile landscape
  □ 768px — tablet portrait
  □ 1024px — tablet landscape / small desktop
  □ 1280px — laptop
  □ 1440px — standard desktop
  □ 1920px — large monitor
  □ 2560px — 2K display
  □ 3840px — 4K display

  IF ANY FAIL → Fix breakpoint-specific CSS → Re-check

CHECKPOINT 4 — Cross-Browser Compatibility
  □ Chrome: no visual bugs
  □ Firefox: no visual bugs (check: backdrop-filter fallback)
  □ Safari: no bugs (check: -webkit- prefixes, 100dvh)
  □ Edge: no bugs
  □ Samsung Internet: no bugs

  FIREFOX FALLBACK: Add @supports for backdrop-blur:
    @supports not (backdrop-filter: blur(0)) {
      .backdrop-blur-md { background-color: rgb(255 255 255 / 0.98) !important; }
    }
  SAFARI: Replace h-screen with h-[100dvh], add -webkit-fill-available

CHECKPOINT 5 — Accessibility
  □ Lighthouse Accessibility ≥ 90
  □ All interactive elements keyboard reachable
  □ All images have alt text
  □ Color contrast ≥ 4.5:1 for body text
  □ Skip-to-content link present
  □ aria-labels on all icon buttons
  □ Form inputs labeled

CHECKPOINT 6 — Performance
  □ Lighthouse Performance ≥ 80 (production build, no throttle)
  □ LCP < 3.5s on mobile 4G
  □ CLS < 0.1
  □ No render-blocking resources
  □ First load JS < 250KB per route

━━━━━━━━━━━━━━━━━━━━
ITERATION RESULT
━━━━━━━━━━━━━━━━━━━━

IF ALL CHECKPOINTS PASS:
  🎉 QA COMPLETE — Website is production-ready.

  Output final summary:
  - Files modified: [count]
  - Pages improved: [list]
  - Key improvements: [bullet list]
  - Build status: ✓
  - TypeScript: ✓
  - Performance estimate: [scores]
  - Mobile: ✓
  - Tablet: ✓
  - Desktop: ✓
  - 4K: ✓
  - Retina: ✓

IF ANY CHECKPOINT FAILS:
  - List exact failures with file + line number
  - Fix each one
  - Increment iteration count
  - Restart from CHECKPOINT 1`,
  },
];

const COPY_FLASH_MS = 1800;

type QuickRefCard = {
  icon: string;
  title: string;
  items: string[];
};

const QUICK_REF_CARDS: QuickRefCard[] = [
  {
    icon: '🎯',
    title: 'Breakpoints Added',
    items: ['xs: 375px', '3xl: 1920px', '4k: 3840px'],
  },
  {
    icon: '🖼️',
    title: 'Image Formats',
    items: ['AVIF (first choice)', 'WebP (fallback)', 'All sizes: 320→3840px'],
  },
  {
    icon: '✍️',
    title: 'Font Stack',
    items: ['Playfair Display (headings)', 'Inter (body)', 'Local subset, zero CLS'],
  },
  {
    icon: '⚡',
    title: 'Perf Targets',
    items: ['LCP < 2.5s', 'CLS < 0.05', 'Lighthouse ≥ 90'],
  },
];

export default function OmGauriPromptDashboard() {
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [completedPhases, setCompletedPhases] = useState<Set<string>>(new Set());
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const copyPrompt = useCallback((phaseId: string, prompt: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied((prev) => ({ ...prev, [phaseId]: true }));
      setTimeout(
        () => setCopied((prev) => ({ ...prev, [phaseId]: false })),
        COPY_FLASH_MS,
      );
    });
  }, []);

  const toggleComplete = useCallback((phaseId: string) => {
    setCompletedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  }, []);

  const progress = Math.round((completedPhases.size / PHASES.length) * 100);

  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        background:
          'linear-gradient(135deg, #0a0a0f 0%, #111118 50%, #0d0d14 100%)',
        minHeight: '100vh',
        color: '#e2e8f0',
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '16px 24px',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #d4a843, #f0c040)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  💎
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 16,
                      color: '#f0c040',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Om Gauri Pulta
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#64748b',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    10x Premium UI Upgrade Loop
                  </div>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: 11,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Progress
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: progress === 100 ? '#34d399' : '#f0c040',
                  }}
                >
                  {progress}%
                </div>
              </div>
              <div
                style={{
                  width: 80,
                  height: 80,
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                <svg
                  viewBox="0 0 36 36"
                  style={{ width: 80, height: 80, transform: 'rotate(-90deg)' }}
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke={progress === 100 ? '#34d399' : '#f0c040'}
                    strokeWidth="2.5"
                    strokeDasharray={`${progress} ${100 - progress}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: progress === 100 ? '#34d399' : '#f0c040',
                  }}
                >
                  {completedPhases.size}/{PHASES.length}
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              marginTop: 12,
              height: 3,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 9999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background:
                  progress === 100
                    ? 'linear-gradient(90deg, #34d399, #10b981)'
                    : 'linear-gradient(90deg, #d4a843, #f0c040, #fbbf24)',
                borderRadius: 9999,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        {/* Intro */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(240,192,64,0.15)',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 24, flexShrink: 0 }}>🚀</div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#f0c040',
                  marginBottom: 6,
                }}
              >
                How to Use This Dashboard
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#94a3b8',
                  lineHeight: 1.7,
                }}
              >
                Run each phase{' '}
                <strong style={{ color: '#e2e8f0' }}>in order</strong> in your AI
                coding assistant (Claude, Cursor, Copilot).&nbsp; Copy the prompt →
                paste into your project context → let it run → mark complete → next
                phase.&nbsp; Each phase builds on the previous one. This is a{' '}
                <strong style={{ color: '#f0c040' }}>self-correcting loop</strong>{' '}
                — errors get fixed within each phase before moving on.
              </div>
            </div>
          </div>
        </div>

        {/* Phase cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PHASES.map((phase) => {
            const isComplete = completedPhases.has(phase.id);
            const isExpanded = expandedPhase === phase.id;
            const isCopied = copied[phase.id];

            return (
              <div
                key={phase.id}
                style={{
                  background: isComplete
                    ? 'rgba(52, 211, 153, 0.04)'
                    : 'rgba(255,255,255,0.03)',
                  border: isComplete
                    ? '1px solid rgba(52,211,153,0.2)'
                    : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  transition: 'all 0.25s ease',
                }}
              >
                {/* Phase header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '18px 20px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() =>
                    setExpandedPhase(isExpanded ? null : phase.id)
                  }
                >
                  {/* Phase number + icon */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      flexShrink: 0,
                      background: isComplete
                        ? 'rgba(52,211,153,0.15)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
                      border: isComplete
                        ? '1px solid rgba(52,211,153,0.3)'
                        : '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                    }}
                  >
                    {isComplete ? '✅' : phase.icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: isComplete ? '#34d399' : phase.accent,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {phase.id}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#e2e8f0',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {phase.title.split('—')[1]?.trim() ?? phase.title}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#64748b',
                        marginTop: 2,
                        lineHeight: 1.4,
                      }}
                    >
                      {phase.description}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    {/* Complete toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleComplete(phase.id);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: isComplete
                          ? 'rgba(52,211,153,0.4)'
                          : 'rgba(255,255,255,0.1)',
                        background: isComplete
                          ? 'rgba(52,211,153,0.1)'
                          : 'transparent',
                        color: isComplete ? '#34d399' : '#64748b',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isComplete ? '✓ Done' : 'Mark Done'}
                    </button>

                    {/* Expand arrow */}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        transition: 'transform 0.25s ease',
                        transform: isExpanded
                          ? 'rotate(180deg)'
                          : 'rotate(0deg)',
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M4 6l4 4 4-4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded prompt area */}
                {isExpanded && (
                  <div
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {/* Copy button bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 20px',
                        background: 'rgba(0,0,0,0.3)',
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#475569' }}>
                        📋 Ready-to-paste prompt — copy and run in your AI
                        assistant
                      </div>
                      <button
                        onClick={() => copyPrompt(phase.id, phase.prompt)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 18px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          background: isCopied
                            ? 'rgba(52,211,153,0.15)'
                            : 'linear-gradient(135deg, rgba(240,192,64,0.2), rgba(240,192,64,0.1))',
                          border: isCopied
                            ? '1px solid rgba(52,211,153,0.4)'
                            : '1px solid rgba(240,192,64,0.3)',
                          color: isCopied ? '#34d399' : '#f0c040',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isCopied ? (
                          <>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                            >
                              <path
                                d="M2.5 7l3 3 6-6"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                            >
                              <rect
                                x="1"
                                y="3"
                                width="9"
                                height="10"
                                rx="1.5"
                                stroke="currentColor"
                                strokeWidth="1.2"
                              />
                              <path
                                d="M4 3V2a1 1 0 011-1h6a1 1 0 011 1v8a1 1 0 01-1 1h-1"
                                stroke="currentColor"
                                strokeWidth="1.2"
                              />
                            </svg>
                            Copy Prompt
                          </>
                        )}
                      </button>
                    </div>

                    {/* Prompt text */}
                    <div
                      style={{
                        margin: '0 20px 20px',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 12,
                        padding: '16px 18px',
                        fontFamily:
                          "'Menlo', 'Monaco', 'Consolas', monospace",
                        fontSize: 12,
                        lineHeight: 1.8,
                        color: '#94a3b8',
                        maxHeight: 480,
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {phase.prompt}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Reference Footer */}
        <div
          style={{
            marginTop: 32,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12,
          }}
        >
          {QUICK_REF_CARDS.map((card) => (
            <div
              key={card.title}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '16px 18px',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>{card.icon}</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#e2e8f0',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {card.title}
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 3 }}
              >
                {card.items.map((item) => (
                  <div
                    key={item}
                    style={{
                      fontSize: 11,
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span style={{ color: '#f0c040', opacity: 0.6 }}>→</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* All done celebration */}
        {completedPhases.size === PHASES.length && (
          <div
            style={{
              marginTop: 24,
              background:
                'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(16,185,129,0.06))',
              border: '1px solid rgba(52,211,153,0.3)',
              borderRadius: 16,
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#34d399',
                marginBottom: 8,
              }}
            >
              All 8 Phases Complete!
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#64748b',
                maxWidth: 500,
                margin: '0 auto',
              }}
            >
              omgpgems.com is now 4K/Retina-ready, fully responsive from 320px
              to 3840px, and optimized for Lighthouse 90+ across all metrics.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
