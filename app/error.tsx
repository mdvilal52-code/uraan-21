'use client';

import { useEffect } from 'react';

// Site-wide safety net. Without this, any uncaught render/effect error
// (e.g. a browser rejecting localStorage in Private Browsing or an in-app
// WhatsApp/Instagram webview — see lib/auth.ts and lib/usePersistentStorage.ts)
// bubbles past our pages straight to the framework's bare generic crash
// screen. This gives the customer a branded, recoverable page instead.
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#C4E7F5] px-4">
      <div className="max-w-md w-full text-center bg-white border border-[rgba(184,137,58,0.18)] p-8">
        <h1 className="serif text-2xl text-[#1a1410] mb-2">Something went wrong</h1>
        <p className="text-sm text-[#6b5d4c] mb-6">
          We apologize for the inconvenience. Please try again, or reload the page if the
          problem continues.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-3 rounded-xl text-[12px] tracking-[3px] uppercase font-bold text-white bg-gradient-to-r from-[#f7941e] via-[#ec1c7d] to-[#9b1fb5] hover:brightness-105"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-6 py-3 rounded-xl text-[12px] tracking-[3px] uppercase font-bold text-[#1a1410] border border-[rgba(184,137,58,0.3)] hover:bg-[#f8f2e6]"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
