import type { Metadata, Viewport } from "next";
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
  applicationName: "Athena",
  title: "Athena — Living Curiosity Atlas",
  description: "情報整理を天体観測へ。Xブックマークを宇宙空間で探索する",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Athena",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  metadataBase: new URL('https://athena.hitokoto.tech'),
  openGraph: {
    title: 'Athena — Living Curiosity Atlas',
    description: '情報整理を天体観測へ。Xブックマークを宇宙空間で探索する',
    url: 'https://athena.hitokoto.tech',
    siteName: 'Athena',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/ogp.png',
        width: 1200,
        height: 630,
        alt: 'Athena — Living Curiosity Atlas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Athena — Living Curiosity Atlas',
    description: '情報整理を天体観測へ。Xブックマークを宇宙空間で探索する',
    images: ['/ogp.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://athena.hitokoto.tech',
  },
};

export const viewport: Viewport = {
  themeColor: "#030014",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
