import Link from 'next/link';

export default function NotFound() {
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
          color: 'rgba(100, 160, 255, 0.3)',
          margin: 0,
          letterSpacing: '0.3em',
        }}
      >
        404
      </p>
      <p
        style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.3)',
          letterSpacing: '0.15em',
          margin: 0,
        }}
      >
        この星域は存在しません
      </p>
      <Link
        href="/"
        style={{
          marginTop: '24px',
          padding: '10px 28px',
          color: 'rgba(100, 160, 255, 0.6)',
          border: '1px solid rgba(100, 160, 255, 0.15)',
          borderRadius: '100px',
          textDecoration: 'none',
          fontSize: '12px',
          letterSpacing: '0.15em',
          transition: 'all 0.3s',
        }}
      >
        ホームへ戻る
      </Link>
    </div>
  );
}
