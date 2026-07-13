'use client';

import {
  CreditCard,
  Smartphone,
  Wallet,
  Landmark,
  Lock,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import { whatsappLink } from '@/lib/whatsapp';

/* ─────────────────────────────────────────────────────────────
   Brand logos — inline SVGs (Simple Icons is monochrome-only,
   so real brand color needs hand-drawn paths).
   Each logo is sized to fill its chip via viewBox + height.
   ───────────────────────────────────────────────────────────── */

function VisaLogo() {
  return (
    <svg viewBox="0 0 160 52" className="h-6 md:h-7 w-auto" aria-label="Visa">
      <text
        x="80"
        y="42"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Helvetica', sans-serif"
        fontWeight={900}
        fontStyle="italic"
        fontSize="46"
        fill="#1A1F71"
        letterSpacing="1"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg viewBox="0 0 90 56" className="h-8 md:h-9 w-auto" aria-label="Mastercard">
      <circle cx="34" cy="28" r="22" fill="#EB001B" />
      <circle cx="56" cy="28" r="22" fill="#F79E1B" />
      <path
        d="M45 12 a22 22 0 0 1 0 32 a22 22 0 0 1 0 -32 Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function RupayLogo() {
  return (
    <svg viewBox="0 0 170 52" className="h-6 md:h-7 w-auto" aria-label="RuPay">
      <text
        x="6"
        y="40"
        fontFamily="'Arial Black', 'Helvetica', sans-serif"
        fontWeight={900}
        fontStyle="italic"
        fontSize="38"
        fill="#00457C"
        letterSpacing="0"
      >
        RuPay
      </text>
      {/* Single prominent orange chevron arrow (as in reference) */}
      <path d="M128 8 L162 26 L128 44 L142 26 Z" fill="#F58220" />
    </svg>
  );
}

function AmexLogo() {
  return (
    <svg viewBox="0 0 130 52" className="h-6 md:h-7 w-auto" aria-label="Amex">
      <text
        x="65"
        y="40"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Helvetica', sans-serif"
        fontWeight={900}
        fontSize="40"
        fill="#006FCF"
        letterSpacing="1"
      >
        AMEX
      </text>
    </svg>
  );
}

function UpiLogo() {
  return (
    <svg viewBox="0 0 170 60" className="h-8 md:h-9 w-auto" aria-label="UPI">
      <text
        x="6"
        y="34"
        fontFamily="'Arial Black', 'Helvetica', sans-serif"
        fontWeight={900}
        fontStyle="italic"
        fontSize="34"
        fill="#0E3D6C"
        letterSpacing="1"
      >
        UPI
      </text>
      <path d="M92 6 L124 30 L92 54 L102 30 Z" fill="#097939" />
      <path d="M110 6 L142 30 L110 54 L120 30 Z" fill="#EE7B00" />
      <text
        x="6"
        y="52"
        fontFamily="Arial, sans-serif"
        fontSize="6"
        fill="#414042"
        letterSpacing="0.5"
      >
        UNIFIED PAYMENTS INTERFACE
      </text>
    </svg>
  );
}

function GPayLogo() {
  // Google G — 4-color ring quarters + horizontal blue bar, matching brand mark.
  return (
    <svg viewBox="0 0 140 48" className="h-6 md:h-7 w-auto" aria-label="Google Pay">
      <g transform="translate(4,4)">
        {/* Red — top-right quarter */}
        <path
          d="M20 4 A16 16 0 0 1 34.1 12 L 28.9 15 A10 10 0 0 0 20 10 Z"
          fill="#EA4335"
        />
        {/* Yellow — top-left quarter */}
        <path
          d="M4 20 A16 16 0 0 1 20 4 L 20 10 A10 10 0 0 0 10 20 Z"
          fill="#FBBC04"
        />
        {/* Green — bottom-left quarter */}
        <path
          d="M20 36 A16 16 0 0 1 4 20 L 10 20 A10 10 0 0 0 20 30 Z"
          fill="#34A853"
        />
        {/* Blue — right side + horizontal bar */}
        <path
          d="M34.1 12 A16 16 0 0 1 34.7 26 L 22 26 L 22 21 L 36 21 L 36 20 A16 16 0 0 0 34.1 12 Z"
          fill="#4285F4"
        />
        <path
          d="M34.7 26 A16 16 0 0 1 20 36 L 20 30 A10 10 0 0 0 28.9 25 Z"
          fill="#4285F4"
        />
      </g>
      <text
        x="46"
        y="30"
        fontFamily="Arial, sans-serif"
        fontSize="22"
        fontWeight={500}
        fill="#5F6368"
      >
        Pay
      </text>
    </svg>
  );
}

function PhonePeLogo() {
  return (
    <svg viewBox="0 0 150 44" className="h-5 md:h-6 w-auto" aria-label="PhonePe">
      <circle cx="14" cy="22" r="12" fill="#5F259F" />
      <text
        x="14"
        y="27"
        textAnchor="middle"
        fontFamily="'Arial Black', sans-serif"
        fontSize="14"
        fontWeight={700}
        fill="#FFFFFF"
      >
        ₹
      </text>
      <text
        x="30"
        y="30"
        fontFamily="Arial, sans-serif"
        fontSize="20"
        fontWeight={700}
        fill="#5F259F"
      >
        PhonePe
      </text>
    </svg>
  );
}

function PaytmLogo() {
  return (
    <svg viewBox="0 0 120 40" className="h-6 md:h-7 w-auto" aria-label="Paytm">
      <text
        x="60"
        y="30"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="28"
        fontWeight={800}
      >
        <tspan fill="#002E6E">Pay</tspan>
        <tspan fill="#00BAF2">tm</tspan>
      </text>
    </svg>
  );
}

function BhimLogo() {
  return (
    <svg viewBox="0 0 170 60" className="h-7 md:h-8 w-auto" aria-label="BHIM">
      <text
        x="6"
        y="34"
        fontFamily="'Arial Black', sans-serif"
        fontWeight={900}
        fontStyle="italic"
        fontSize="30"
        fill="#414042"
        letterSpacing="1"
      >
        BHIM
      </text>
      <path d="M100 8 L134 30 L100 52 L110 30 Z" fill="#F58220" />
      <path d="M118 8 L152 30 L118 52 L128 30 Z" fill="#009A49" />
      <text
        x="6"
        y="52"
        fontFamily="Arial, sans-serif"
        fontSize="6"
        fill="#414042"
        letterSpacing="0.4"
      >
        BHARAT INTERFACE FOR MONEY
      </text>
    </svg>
  );
}

function AmazonPayLogo() {
  return (
    <svg viewBox="0 0 170 56" className="h-7 md:h-8 w-auto" aria-label="Amazon Pay">
      <text
        x="6"
        y="30"
        fontFamily="Arial, sans-serif"
        fontSize="26"
        fontWeight={500}
        fill="#111111"
      >
        amazon
      </text>
      {/* Amazon smile — spans only "amazon" as in the reference */}
      <path
        d="M10 40 Q46 54 88 40"
        stroke="#FF9900"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M82 37 L90 40 L84 46"
        stroke="#FF9900"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="98"
        y="30"
        fontFamily="Arial, sans-serif"
        fontSize="26"
        fontWeight={500}
        fill="#111111"
      >
        pay
      </text>
    </svg>
  );
}

function MobikwikLogo() {
  return (
    <svg viewBox="0 0 170 52" className="h-6 md:h-7 w-auto" aria-label="MobiKwik">
      <path
        d="M6 44 L6 12 L18 12 L26 30 L34 12 L46 12 L46 44 L38 44 L38 24 L30 40 L22 40 L14 24 L14 44 Z"
        fill="#003D7A"
      />
      <circle cx="26" cy="8" r="3.5" fill="#E62228" />
      <text
        x="52"
        y="38"
        fontFamily="Arial, sans-serif"
        fontSize="22"
        fontWeight={700}
        fontStyle="italic"
        fill="#003D7A"
      >
        obiKwik
      </text>
    </svg>
  );
}

function RazorpayLogo() {
  return (
    <svg viewBox="0 0 170 52" className="h-6 md:h-7 w-auto" aria-label="Razorpay">
      <path d="M8 44 L26 4 L20 26 L34 26 L14 44 Z" fill="#0D3AA5" />
      <path d="M20 26 L26 4 L28 15 Z" fill="#3468C0" />
      <text
        x="42"
        y="34"
        fontFamily="Arial, sans-serif"
        fontSize="22"
        fontWeight={600}
        fill="#0D3AA5"
      >
        Razorpay
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Payment method card — 2×2 grid
   ───────────────────────────────────────────────────────────── */
type MethodCardProps = {
  Icon: typeof CreditCard;
  title: string;
  desc: string;
  circleGradient: string;
  circleShadow: string;
  titleColor: string;
};

function MethodCard({
  Icon,
  title,
  desc,
  circleGradient,
  circleShadow,
  titleColor,
}: MethodCardProps) {
  return (
    <article
      className="relative flex flex-col items-center text-center pt-6 pb-5 px-4 md:pt-8 md:pb-6 md:px-5 rounded-2xl"
      style={{
        background: '#FBF8F1',
        border: '1px solid rgba(201,162,39,0.28)',
        boxShadow: '0 10px 24px rgba(122,90,31,0.09), 0 1px 0 rgba(255,255,255,0.9) inset',
      }}
    >
      <div
        className="w-[64px] h-[64px] md:w-[72px] md:h-[72px] rounded-full flex items-center justify-center mb-3"
        style={{
          background: circleGradient,
          boxShadow: `0 10px 22px ${circleShadow}, inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -2px 3px rgba(0,0,0,0.18)`,
        }}
        aria-hidden="true"
      >
        <Icon className="text-white" size={30} strokeWidth={2} />
      </div>
      <h3
        className="font-serif uppercase font-medium mb-2"
        style={{
          fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
          color: titleColor,
          fontSize: 'clamp(15px, 3.4vw, 20px)',
          letterSpacing: '2px',
          lineHeight: 1.15,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: '#555555',
          fontSize: 'clamp(12px, 2.8vw, 14px)',
          lineHeight: 1.45,
          fontFamily: "'Jost', system-ui, sans-serif",
        }}
      >
        {desc}
      </p>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main section
   ───────────────────────────────────────────────────────────── */
type PaymentOptionsProps = {
  /** Set to false when the page already renders its own floating WhatsApp
   * button (e.g. inside a global FloatingActions component). Defaults to
   * true so the component is truly drop-in-ready by itself. */
  showWhatsApp?: boolean;
};

export default function PaymentOptions({ showWhatsApp = true }: PaymentOptionsProps = {}) {
  const brandRows: React.ReactNode[][] = [
    [<VisaLogo key="v" />, <MastercardLogo key="mc" />, <RupayLogo key="ru" />, <AmexLogo key="ax" />],
    [<UpiLogo key="upi" />, <GPayLogo key="gp" />, <PhonePeLogo key="pp" />, <PaytmLogo key="pt" />],
    [<BhimLogo key="bh" />, <AmazonPayLogo key="ap" />, <MobikwikLogo key="mk" />],
    [<RazorpayLogo key="rz" />],
  ];

  return (
    <section className="w-full px-4 py-8 md:py-14 flex justify-center">
      <div className="w-full max-w-[430px] md:max-w-[900px]">
        {/* ── Header banner ──────────────────────────────────── */}
        <div
          className="relative overflow-hidden text-center rounded-3xl"
          style={{
            aspectRatio: '430 / 220',
            background:
              'radial-gradient(ellipse at 88% 18%, rgba(232,212,139,0.55) 0%, rgba(201,162,39,0.18) 30%, transparent 60%),' +
              'radial-gradient(ellipse at 12% 90%, rgba(201,162,39,0.14) 0%, transparent 55%),' +
              'linear-gradient(160deg, #1a1a1a 0%, #000000 100%)',
            boxShadow:
              '0 22px 50px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(201,162,39,0.28)',
          }}
        >
          {/* Gold light streak (top-right corner) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 430 220"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="poCornerGlow" cx="0.85" cy="0.15" r="0.5">
                <stop offset="0%" stopColor="#F4DE9B" stopOpacity="0.6" />
                <stop offset="60%" stopColor="#C9A227" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="poStreak" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F4DE9B" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="430" height="220" fill="url(#poCornerGlow)" />
            <path
              d="M280 10 Q 360 20 430 60 L 430 4 L 300 4 Z"
              fill="url(#poStreak)"
              opacity="0.55"
            />
            <path
              d="M320 6 Q 380 22 428 52"
              stroke="#F4DE9B"
              strokeWidth="0.8"
              fill="none"
              opacity="0.55"
            />
            {/* Sparkle particles */}
            {[
              { cx: 348, cy: 22, r: 1.4 },
              { cx: 372, cy: 38, r: 1 },
              { cx: 395, cy: 52, r: 1.2 },
              { cx: 320, cy: 32, r: 0.9 },
              { cx: 405, cy: 18, r: 1.1 },
            ].map((p, i) => (
              <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="#F4DE9B" opacity="0.9" />
            ))}
            {/* Subtle left bottom lines */}
            <g opacity="0.28" stroke="#C9A227" strokeWidth="0.6" fill="none">
              <path d="M4 178 Q 60 168 120 176" />
              <path d="M4 190 Q 70 180 130 190" />
              <path d="M4 202 Q 80 194 140 204" />
            </g>
          </svg>

          {/* Centered content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
            <p
              className="italic"
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                color: '#E8D48B',
                fontSize: 'clamp(13px, 3.4vw, 17px)',
                letterSpacing: 'clamp(1.5px, 0.7vw, 3px)',
                marginBottom: 'clamp(6px, 2vw, 10px)',
              }}
            >
              Safe &middot; Secure &middot; Seamless
            </p>
            <h2
              className="uppercase font-medium"
              style={{
                fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
                background: 'linear-gradient(180deg, #F4DE9B 0%, #D4AF37 50%, #C9A227 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: 'clamp(26px, 7.5vw, 42px)',
                letterSpacing: 'clamp(3px, 1.2vw, 8px)',
                lineHeight: 1.05,
                textShadow: '0 2px 22px rgba(201,162,39,0.35)',
              }}
            >
              PAYMENT OPTIONS
            </h2>

            {/* Ornamental divider with shield-lock badge */}
            <div className="flex items-center justify-center gap-2 md:gap-3 mt-3 md:mt-5 w-full max-w-[320px]">
              <svg viewBox="0 0 120 12" className="flex-1 h-3" aria-hidden="true">
                <line x1="4" y1="6" x2="88" y2="6" stroke="#C9A227" strokeWidth="1" />
                <path
                  d="M88 6 L96 2 L104 6 L96 10 Z"
                  fill="none"
                  stroke="#C9A227"
                  strokeWidth="1"
                />
                <path d="M104 6 L118 6" stroke="#C9A227" strokeWidth="1" />
              </svg>
              {/* Shield-lock badge */}
              <svg viewBox="0 0 44 48" className="w-9 h-10 md:w-11 md:h-12 shrink-0" aria-hidden="true">
                <defs>
                  <linearGradient id="poShield" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F4DE9B" />
                    <stop offset="50%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#7A5A1F" />
                  </linearGradient>
                </defs>
                <path
                  d="M22 2 L40 8 V22 C40 34 32 42 22 46 C12 42 4 34 4 22 V8 Z"
                  fill="url(#poShield)"
                  stroke="#7A5A1F"
                  strokeWidth="0.7"
                />
                <path
                  d="M22 4 L38 9.5 V22 C38 32.5 31 40 22 43.5 C13 40 6 32.5 6 22 V9.5 Z"
                  fill="none"
                  stroke="#FBE9A6"
                  strokeWidth="0.5"
                  opacity="0.7"
                />
                {/* Lock */}
                <path
                  d="M18 22 v-3 a4 4 0 0 1 8 0 v3"
                  fill="none"
                  stroke="#0d0d0d"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <rect x="15" y="22" width="14" height="10" rx="1.6" fill="#0d0d0d" />
                <circle cx="22" cy="26.5" r="1.2" fill="#F4DE9B" />
                <rect x="21.5" y="26.5" width="1" height="2.6" fill="#F4DE9B" />
              </svg>
              <svg viewBox="0 0 120 12" className="flex-1 h-3" aria-hidden="true">
                <line x1="2" y1="6" x2="16" y2="6" stroke="#C9A227" strokeWidth="1" />
                <path
                  d="M32 6 L24 2 L16 6 L24 10 Z"
                  fill="none"
                  stroke="#C9A227"
                  strokeWidth="1"
                />
                <line x1="32" y1="6" x2="116" y2="6" stroke="#C9A227" strokeWidth="1" />
              </svg>
            </div>
          </div>

          {/* Wavy bottom edge */}
          <svg
            className="absolute inset-x-0 bottom-0 w-full h-7 md:h-10 pointer-events-none"
            viewBox="0 0 430 50"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="poWave" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#7A5A1F" />
                <stop offset="45%" stopColor="#F4DE9B" />
                <stop offset="100%" stopColor="#9C7B2E" />
              </linearGradient>
            </defs>
            <path
              d="M0 32 C 90 8, 180 46, 260 24 C 340 4, 400 40, 430 22 L 430 50 L 0 50 Z"
              fill="#FFFFFF"
            />
            <path
              d="M0 30 C 90 6, 180 44, 260 22 C 340 2, 400 38, 430 20"
              fill="none"
              stroke="url(#poWave)"
              strokeWidth="1.2"
              opacity="0.9"
            />
          </svg>
        </div>

        {/* ── 2×2 method cards ──────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mt-5 md:mt-8">
          <MethodCard
            Icon={CreditCard}
            title="Cards"
            desc="Visa, Mastercard, RuPay, Amex"
            circleGradient="linear-gradient(140deg, #1E6FD9 0%, #1450A3 100%)"
            circleShadow="rgba(20,80,163,0.35)"
            titleColor="#1450A3"
          />
          <MethodCard
            Icon={Smartphone}
            title="UPI"
            desc="GPay, PhonePe, Paytm, BHIM"
            circleGradient="linear-gradient(140deg, #128C4B 0%, #0B5C34 100%)"
            circleShadow="rgba(11,92,52,0.35)"
            titleColor="#0B5C34"
          />
          <MethodCard
            Icon={Wallet}
            title="Wallets"
            desc="Paytm, Amazon Pay, Mobikwik"
            circleGradient="linear-gradient(140deg, #7B3FBF 0%, #5A2A8F 100%)"
            circleShadow="rgba(90,42,143,0.35)"
            titleColor="#5A2A8F"
          />
          <MethodCard
            Icon={Landmark}
            title="Net Banking & EMI"
            desc="All major banks + No-cost EMI"
            circleGradient="linear-gradient(140deg, #C9902A 0%, #9E6B1A 100%)"
            circleShadow="rgba(158,107,26,0.4)"
            titleColor="#9E6B1A"
          />
        </div>

        {/* ── WE ACCEPT + logo grid ─────────────────────────── */}
        <div
          className="mt-5 md:mt-8 px-4 py-6 md:px-6 md:py-8 rounded-3xl"
          style={{
            background: '#FAF6EE',
            border: '1px solid rgba(201,162,39,0.28)',
            boxShadow: '0 12px 30px rgba(122,90,31,0.08)',
          }}
        >
          {/* Title with gold arrows */}
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-5 md:mb-7">
            <svg viewBox="0 0 60 10" className="w-10 md:w-14 h-2.5" aria-hidden="true">
              <line x1="0" y1="5" x2="46" y2="5" stroke="#C9A227" strokeWidth="1" />
              <path
                d="M46 5 L54 1 L60 5 L54 9 Z"
                fill="none"
                stroke="#C9A227"
                strokeWidth="1"
              />
            </svg>
            <h3
              className="uppercase font-medium whitespace-nowrap"
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                color: '#9C7B2E',
                fontSize: 'clamp(15px, 4vw, 20px)',
                letterSpacing: '3px',
              }}
            >
              WE ACCEPT
            </h3>
            <svg viewBox="0 0 60 10" className="w-10 md:w-14 h-2.5" aria-hidden="true">
              <path
                d="M14 5 L6 1 L0 5 L6 9 Z"
                fill="none"
                stroke="#C9A227"
                strokeWidth="1"
              />
              <line x1="14" y1="5" x2="60" y2="5" stroke="#C9A227" strokeWidth="1" />
            </svg>
          </div>

          {/* Logo chip grid — 4 rows */}
          <div className="flex flex-col gap-3 md:gap-4">
            {brandRows.map((row, ri) => (
              <div
                key={ri}
                className="grid gap-3 md:gap-4"
                style={{
                  gridTemplateColumns:
                    row.length === 1
                      ? '1fr'
                      : row.length === 3
                        ? 'repeat(3, minmax(0,1fr))'
                        : 'repeat(4, minmax(0,1fr))',
                  justifyItems: 'stretch',
                }}
              >
                {row.length === 1 ? (
                  <div className="flex justify-center">
                    <div
                      className="flex items-center justify-center px-6 py-4 md:py-5 rounded-xl w-[50%] min-w-[140px]"
                      style={{
                        background: '#FFFFFF',
                        boxShadow:
                          '0 4px 12px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(201,162,39,0.12)',
                      }}
                    >
                      {row[0]}
                    </div>
                  </div>
                ) : (
                  row.map((logo, li) => (
                    <div
                      key={li}
                      className="flex items-center justify-center px-2 py-4 md:py-5 rounded-xl"
                      style={{
                        background: '#FFFFFF',
                        minHeight: 62,
                        boxShadow:
                          '0 4px 12px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(201,162,39,0.12)',
                      }}
                    >
                      {logo}
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Trust bar (3 columns) ─────────────────────────── */}
        <div
          className="mt-4 md:mt-6 overflow-hidden rounded-2xl"
          style={{
            background:
              'radial-gradient(ellipse at top right, rgba(201,162,39,0.14), transparent 55%),' +
              'linear-gradient(160deg, #1a1a1a 0%, #000000 100%)',
            boxShadow:
              '0 14px 30px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(201,162,39,0.4)',
          }}
        >
          <div className="grid grid-cols-3">
            {[
              { Icon: Lock, l1: '256-BIT SSL', l2: 'ENCRYPTED' },
              { Icon: ShieldCheck, l1: 'PCI DSS', l2: 'COMPLIANT' },
              { Icon: ShieldCheck, l1: '100% SECURE', l2: 'CHECKOUT' },
            ].map(({ Icon, l1, l2 }, i) => (
              <div
                key={i}
                className={
                  'flex items-center justify-center gap-2 md:gap-3 py-4 px-2 md:py-5 md:px-4 text-left ' +
                  (i > 0 ? 'border-l' : '')
                }
                style={{ borderColor: 'rgba(201,162,39,0.35)' }}
              >
                <span
                  className="shrink-0 rounded-full flex items-center justify-center"
                  style={{
                    width: 30,
                    height: 30,
                    background:
                      'radial-gradient(circle at 32% 28%, rgba(244,222,155,0.25) 0%, rgba(201,162,39,0.12) 100%)',
                    border: '1px solid rgba(201,162,39,0.55)',
                  }}
                  aria-hidden="true"
                >
                  <Icon size={15} style={{ color: '#D4AF37' }} strokeWidth={2.2} />
                </span>
                <div className="leading-tight">
                  <div
                    style={{
                      fontFamily: "'Jost', system-ui, sans-serif",
                      color: '#FFFFFF',
                      fontSize: 'clamp(9px, 2.3vw, 11px)',
                      letterSpacing: '1px',
                      fontWeight: 600,
                    }}
                  >
                    {l1}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Jost', system-ui, sans-serif",
                      color: '#D4AF37',
                      fontSize: 'clamp(8px, 2vw, 10px)',
                      letterSpacing: '1px',
                      marginTop: 2,
                    }}
                  >
                    {l2}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Reassurance pill ──────────────────────────────── */}
        <div
          className="mt-4 flex items-center justify-center gap-2 py-3 px-4 md:px-6 text-center"
          style={{
            background: '#FBF8F1',
            border: '1px solid rgba(201,162,39,0.28)',
            borderRadius: 999,
            boxShadow: '0 6px 16px rgba(156,123,46,0.06)',
          }}
        >
          <Lock size={15} style={{ color: '#9E6B1A' }} strokeWidth={2.2} />
          <span
            style={{
              fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              color: '#9E6B1A',
              fontSize: 'clamp(13px, 3vw, 16px)',
              letterSpacing: '0.5px',
            }}
          >
            Your transactions are safe with us.
          </span>
        </div>
      </div>

      {/* ── Floating WhatsApp button ─────────────────────── */}
      {showWhatsApp && (
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed right-4 bottom-4 z-[140] w-12 h-12 md:w-14 md:h-14 rounded-full grid place-items-center"
          style={{
            background: 'linear-gradient(140deg, #25D366 0%, #128C4B 100%)',
            boxShadow: '0 8px 22px rgba(18,140,75,0.45)',
          }}
        >
          <MessageCircle size={22} className="text-white" strokeWidth={2.2} />
        </a>
      )}
    </section>
  );
}
