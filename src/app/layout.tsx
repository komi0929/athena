import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/lib/auth-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "Athena — Living Curiosity Atlas",
  description: "情報整理を天体観測へ。Xブックマークを宇宙空間で探索する",
  icons: { icon: "/favicon.ico" },
  metadataBase: new URL('https://athena.hitokoto.tech'),
  openGraph: {
    title: 'Athena — Living Curiosity Atlas',
    description: '情報整理を天体観測へ。Xブックマークを宇宙空間で探索する',
    url: 'https://athena.hitokoto.tech',
    siteName: 'Athena',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Athena — Living Curiosity Atlas',
    description: '情報整理を天体観測へ。Xブックマークを宇宙空間で探索する',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
