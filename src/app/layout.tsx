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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://dealscout.com",
  ),
  title: {
    default: "DealScout | AI Car Deal Alerts",
    template: "%s | DealScout",
  },
  description:
    "Track local vehicle listings, score used car deals with AI, and get email alerts before the best cars disappear.",
  keywords: [
    "car deal alerts",
    "used car deals",
    "Facebook Marketplace cars",
    "Craigslist car alerts",
    "AI car valuation",
    "vehicle deal tracker",
  ],
  openGraph: {
    title: "DealScout | AI Car Deal Alerts",
    description:
      "Monitor Facebook Marketplace and Craigslist for underpriced cars with AI scoring and email alerts.",
    url: "/",
    siteName: "DealScout",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DealScout | AI Car Deal Alerts",
    description:
      "Find underpriced local vehicle listings faster with marketplace monitoring, AI scoring, and email alerts.",
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
