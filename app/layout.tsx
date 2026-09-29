import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

// Body text uses FC Iconic (self-hosted, see globals.css); only the mono face is loaded here
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  // Only the student ID on My Ticket uses it, so don't make every page download it up front
  preload: false,
});

export const metadata: Metadata = {
  title: "SHIVIDNI PHEEDU 2026",
  description: "SHIVIDNI PHEEDU Halloween Event - Games, Schedule, and Registration",
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        {/* Start fetching the body and heading fonts before the CSS asks for them */}
        <link rel="preload" href="/fonts/fc-iconic-regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/monster-fiesta.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
