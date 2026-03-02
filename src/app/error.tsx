'use client';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#020408',
        color: 'rgba(255, 255, 255, 0.5)',
        fontFamily: "var(--font-space), 'Inter', system-ui, sans-serif",
        textAlign: 'center',
        gap: '16px',
      }}
    >
      <p
        style={{
          fontSize: '64px',
          fontWeight: 200,
          color: 'rgba(255, 100, 100, 0.3)',
          margin: 0,
          letterSpacing: '0.3em',
        }}
      >
        500
      </p>
      <p
        style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.3)',
          letterSpacing: '0.15em',
          margin: 0,
        }}
      >
        星系に障害が発生しています
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: '24px',
          padding: '10px 28px',
          color: 'rgba(100, 160, 255, 0.6)',
          border: '1px solid rgba(100, 160, 255, 0.15)',
          borderRadius: '100px',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: '12px',
          letterSpacing: '0.15em',
        }}
      >
        再試行する
      </button>
    </div>
  );
}
