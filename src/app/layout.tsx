import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { AuthProvider } from "@/components/auth-provider";
import { Analytics } from "@vercel/analytics/react";
import { FeedProvider } from "@/components/feed-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "old.bsky",
  description: "old.reddit themed bluesky client",
  icons: {
    icon: "/icons/star.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} min-h-screen bg-zinc-900 text-zinc-100`}
      >
        <AuthProvider>
          <FeedProvider>
            <Header />
            {children}
          </FeedProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
