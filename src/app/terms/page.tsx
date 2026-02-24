import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: '利用規約 — Athena',
};

export default function TermsPage() {
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
          利用規約
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

          <h2 style={sectionStyle}>第1条（適用）</h2>
          <p>
            本利用規約（以下「本規約」）は、株式会社ヒトコト（以下「当社」）が提供するAthena（以下「本サービス」）の利用に関する条件を定めるものです。
            ユーザーは本サービスを利用することにより、本規約に同意したものとみなされます。
          </p>

          <h2 style={sectionStyle}>第2条（サービス内容）</h2>
          <p>
            本サービスは、X（旧Twitter）のブックマークを取得し、3D宇宙空間上に可視化するWebアプリケーションです。
            ユーザーのXアカウントのブックマーク情報にアクセスし、AIを用いたクラスタリング・類似度分析を行います。
          </p>

          <h2 style={sectionStyle}>第3条（アカウント）</h2>
          <p>
            本サービスはXアカウントによるOAuth認証を使用します。
            ユーザーは自身のアカウント情報の管理について責任を負うものとします。
          </p>

          <h2 style={sectionStyle}>第4条（データの取扱い）</h2>
          <p>
            本サービスはXの公開APIを通じてブックマーク情報を取得します。
            取得したデータはユーザーの可視化目的でのみ使用し、第三者への提供は行いません。
            データの保存にはSupabaseを使用し、適切なセキュリティ対策を講じています。
          </p>

          <h2 style={sectionStyle}>第5条（API利用と制限）</h2>
          <p>
            X APIの利用にはコストが発生するため、1回の同期で最大20件のブックマークを取得します。
            同期は24時間のクールダウン期間を設けています。
            APIの利用状況やXの仕様変更により、サービスが一時的に利用できなくなる場合があります。
          </p>

          <h2 style={sectionStyle}>第6条（禁止事項）</h2>
          <p>
            ユーザーは以下の行為を行ってはなりません：
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>本サービスの不正利用またはリバースエンジニアリング</li>
            <li>他のユーザーのデータへの不正アクセス</li>
            <li>システムに過度な負荷をかける行為</li>
            <li>法令に違反する行為</li>
          </ul>

          <h2 style={sectionStyle}>第7条（免責事項）</h2>
          <p>
            本サービスは「現状有姿」で提供され、特定の目的への適合性を保証するものではありません。
            X APIの仕様変更、障害、データの紛失等について、当社は責任を負いません。
          </p>

          <h2 style={sectionStyle}>第8条（規約の変更）</h2>
          <p>
            本規約は予告なく変更される場合があります。
            変更後の規約は、本ページに掲載した時点で効力を生じるものとします。
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
