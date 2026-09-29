import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

// Body text uses FC Iconic (self-hosted, see globals.css); only the mono face is loaded here
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en">
      <body
        className={`${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
