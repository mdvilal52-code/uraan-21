'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyAddressButton({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API unavailable (older Safari, insecure context) — fall
      // back to a hidden textarea + execCommand so the button still works.
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      try { document.execCommand('copy'); } catch { /* give up silently */ }
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Address copied' : 'Copy store address'}
      className={className}
    >
      {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
      <span>{copied ? 'Copied!' : 'Copy Address'}</span>
    </button>
  );
}
