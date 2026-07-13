'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useStorageBlocked } from '@/lib/usePersistentStorage';

// Shown once when the browser genuinely rejects saved cart/wishlist writes
// (Safari Private Browsing, some in-app WhatsApp/Instagram browsers) — the
// one case where we can't silently recover, so the customer at least knows
// why their cart won't survive closing the tab.
export default function StorageWarningBanner() {
  const blocked = useStorageBlocked();
  const [dismissed, setDismissed] = useState(false);

  if (!blocked || dismissed) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-md bg-[#1a1410] text-[#f5efe3] px-4 py-3 flex items-start gap-3 shadow-lg">
      <AlertTriangle size={16} className="text-[#b8893a] flex-shrink-0 mt-0.5" />
      <p className="text-xs leading-relaxed flex-1">
        Your browser is blocking saved data, so your cart and wishlist won&apos;t survive
        closing this tab. Try opening the site in your regular browser instead of an
        in-app browser (e.g. from WhatsApp or Instagram).
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="text-[#9a8c75] hover:text-[#f5efe3] flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}
