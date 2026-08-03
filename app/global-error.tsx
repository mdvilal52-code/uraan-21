'use client';

import { useEffect } from 'react';

// Catches errors thrown by the root layout itself (rare, but if it happens
// app/error.tsx can't help since it renders *inside* that layout). Must
// render its own <html>/<body> since the root layout is what crashed.
export default function GlobalError({
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
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#C4E7F5',
            padding: '1rem',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: '100%',
              textAlign: 'center',
              background: '#fff',
              border: '1px solid rgba(184,137,58,0.18)',
              padding: '2rem',
            }}
          >
            <h1 style={{ fontSize: '1.5rem', color: '#1a1410', marginBottom: '0.5rem' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#6b5d4c', marginBottom: '1.5rem' }}>
              We apologize for the inconvenience. Please try again, or reload the page if the
              problem continues.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                fontSize: '12px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: '#fff',
                background: 'linear-gradient(to right, #f7941e, #ec1c7d, #9b1fb5)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
