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
    default: 'AI Lead Scoring CRM',
    template: '%s | AI Lead Scoring CRM',
  },
  description: 'Automatically Score, Prioritize & Convert Every Customer Inquiry. An AI-powered CRM for HVAC and local service businesses.',
  openGraph: {
    title: 'AI Lead Scoring CRM',
    description: 'Automatically score, prioritize, and manage every customer inquiry from one intelligent workspace. Built for HVAC and service businesses that need faster responses, better follow-ups, and complete visibility across the sales pipeline.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Lead Scoring CRM',
    description: 'Automatically score, prioritize, and manage every customer inquiry from one intelligent workspace. Built for HVAC and service businesses that need faster responses, better follow-ups, and complete visibility across the sales pipeline.',
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
