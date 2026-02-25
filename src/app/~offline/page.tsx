"use client";

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #030014 0%, #0a0a2e 50%, #030014 100%)",
        color: "#e0e0ff",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "4rem",
          marginBottom: "1rem",
          filter: "grayscale(0.3)",
        }}
      >
        🌑
      </div>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          margin: "0 0 0.75rem",
          background: "linear-gradient(135deg, #7c8aff, #a78bfa)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        オフラインです
      </h1>
      <p
        style={{
          fontSize: "0.95rem",
          color: "rgba(200, 200, 255, 0.6)",
          maxWidth: "320px",
          lineHeight: 1.6,
          margin: "0 0 2rem",
        }}
      >
        インターネット接続が見つかりません。
        <br />
        接続を確認してもう一度お試しください。
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: "0.75rem 2rem",
          borderRadius: "999px",
          border: "1px solid rgba(124, 138, 255, 0.3)",
          background: "rgba(124, 138, 255, 0.1)",
          color: "#a78bfa",
          fontSize: "0.9rem",
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "rgba(124, 138, 255, 0.2)";
          e.currentTarget.style.borderColor = "rgba(124, 138, 255, 0.5)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "rgba(124, 138, 255, 0.1)";
          e.currentTarget.style.borderColor = "rgba(124, 138, 255, 0.3)";
        }}
      >
        再読み込み
      </button>
    </div>
  );
}
