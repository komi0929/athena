import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'プライバシーポリシー — Athena',
};

export default function PrivacyPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#020408',
        color: 'rgba(255, 255, 255, 0.7)',
        padding: '80px 24px',
        fontFamily: "var(--font-space), 'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <Link
          href="/"
          style={{
            color: 'rgba(100, 160, 255, 0.6)',
            fontSize: '12px',
            textDecoration: 'none',
            letterSpacing: '0.2em',
          }}
        >
          ← ATHENA
        </Link>

        <h1
          style={{
            fontSize: '28px',
            fontWeight: 300,
            color: 'rgba(255, 255, 255, 0.6)',
            letterSpacing: '0.15em',
            marginTop: '32px',
          }}
        >
          プライバシーポリシー
        </h1>

        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '8px' }}>
          最終更新日: 2026年2月25日
        </p>

        <div
          style={{
            marginTop: '40px',
            lineHeight: 2,
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <h2 style={sectionStyle}>運営者情報</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
            <tbody>
              <tr><td style={tdLabel}>運営会社</td><td style={tdValue}>株式会社ヒトコト</td></tr>
              <tr><td style={tdLabel}>代表者</td><td style={tdValue}>小南 優作</td></tr>
              <tr><td style={tdLabel}>サービス名</td><td style={tdValue}>Athena — Living Curiosity Atlas</td></tr>
              <tr><td style={tdLabel}>お問い合わせ</td><td style={tdValue}>X（@komikomide）</td></tr>
            </tbody>
          </table>

          <h2 style={sectionStyle}>1. 収集する情報</h2>
          <p>
            株式会社ヒトコト（以下「当社」）が提供する本サービス（Athena）は、以下の情報を収集します：
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li><strong>Xアカウント情報</strong>: ユーザー名、表示名、プロフィール画像（X OAuth認証を通じて取得）</li>
            <li><strong>ブックマークデータ</strong>: ユーザーの同意のもと、X APIを通じて取得したブックマーク情報</li>
            <li><strong>メールアドレス</strong>: Xアカウントに登録されたメールアドレス（認証目的）</li>
          </ul>

          <h2 style={sectionStyle}>2. 情報の利用目的</h2>
          <p>
            収集した情報は以下の目的で使用します：
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>ユーザー認証とアカウント管理</li>
            <li>ブックマークの3D可視化の生成</li>
            <li>AIによるクラスタリング・類似度分析</li>
            <li>サービスの改善と品質向上</li>
          </ul>

          <h2 style={sectionStyle}>3. データの保管</h2>
          <p>
            ユーザーデータはSupabase（クラウドデータベース）に保管されます。
            データベースにはRow Level Security（RLS）を適用し、各ユーザーは自身のデータにのみアクセスできます。
          </p>

          <h2 style={sectionStyle}>4. 第三者への提供</h2>
          <p>
            当サービスは、ユーザーの個人情報を第三者に販売、交換、または提供しません。
            ただし、以下の場合を除きます：
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>法令に基づく開示請求があった場合</li>
            <li>ユーザーの同意がある場合</li>
            <li>サービス提供に必要なインフラ提供者（Supabase, Google Cloud）への技術的なデータ処理</li>
          </ul>

          <h2 style={sectionStyle}>5. 外部サービスとの連携</h2>
          <p>
            本サービスは以下の外部サービスと連携します：
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li><strong>X (Twitter) API</strong>: ブックマーク取得のため利用</li>
            <li><strong>Google Gemini API</strong>: テキスト埋め込みとクラスタリングのため利用</li>
            <li><strong>Supabase</strong>: データベース・認証基盤として利用</li>
          </ul>

          <h2 style={sectionStyle}>6. Cookie・ローカルストレージ</h2>
          <p>
            認証セッションの維持にCookieを使用します。
            同期のクールダウン状態の保存にローカルストレージを使用します。
            トラッキング目的のCookieは使用しません。
          </p>

          <h2 style={sectionStyle}>7. データの削除</h2>
          <p>
            ユーザーはいつでもアカウントの削除を要求できます。
            アカウント削除時、関連するすべてのデータは完全に削除されます。
            削除のリクエストは、ログイン後の設定画面から行えます。
          </p>

          <h2 style={sectionStyle}>8. ポリシーの変更</h2>
          <p>
            本ポリシーは必要に応じて更新される場合があります。
            重要な変更がある場合は、サービス内で通知します。
          </p>

          <h2 style={sectionStyle}>9. お問い合わせ</h2>
          <p>
            プライバシーに関するご質問やご懸念については、X（@komikomide）または当社までご連絡ください。
          </p>
        </div>
      </div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 400,
  color: 'rgba(255, 255, 255, 0.6)',
  marginTop: '32px',
  marginBottom: '12px',
  letterSpacing: '0.05em',
};

const tdLabel: React.CSSProperties = {
  padding: '8px 12px',
  color: 'rgba(255, 255, 255, 0.35)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  whiteSpace: 'nowrap',
  width: '120px',
};

const tdValue: React.CSSProperties = {
  padding: '8px 12px',
  color: 'rgba(255, 255, 255, 0.6)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
};
