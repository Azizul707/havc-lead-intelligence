import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'HVAC Lead Intelligence',
    template: '%s | HVAC Lead Intelligence',
  },
  description: 'Production-grade lead operations platform for HVAC companies. Manage the complete lead lifecycle from AI qualification to job completion.',
  openGraph: {
    title: 'HVAC Lead Intelligence',
    description: 'Production-grade lead operations platform for HVAC companies.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HVAC Lead Intelligence',
    description: 'Production-grade lead operations platform for HVAC companies.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
