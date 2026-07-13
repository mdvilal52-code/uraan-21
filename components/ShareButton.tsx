'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

type Props = {
  title: string;
  text?: string;
  className?: string;
  iconSize?: number;
};

export default function ShareButton({ title, text, className = '', iconSize = 16 }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (copied) return;

    const url = typeof window !== 'undefined' ? window.location.href : '';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={copied ? 'Link copied to clipboard' : 'Share this product'}
      className={`group/share relative inline-flex items-center gap-1.5 transition-transform duration-200 hover:scale-110 active:scale-90 ${className}`}
    >
      {copied ? (
        <Check size={iconSize} className="text-[#3d6b5a] animate-fade-up" />
      ) : (
        <Share2 size={iconSize} className="transition-transform duration-200 group-hover/share:rotate-12" />
      )}
      <span className="text-[10px] tracking-[1.5px] uppercase font-semibold whitespace-nowrap">
        {copied ? 'Link Copied' : 'Share'}
      </span>
    </button>
  );
}
