import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/components/styles/globals.css";
import { Header } from "@/components/header/header";
import { AuthProvider } from "@/components/context/auth-provider";
import { Analytics } from "@vercel/analytics/react";
import { FeedProvider } from "@/components/context/feed-provider";
import { ThreadProvider } from "@/components/context/thread-provider";
import { PostInteractionsProvider } from "@/components/context/post-interactions-provider";

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
            <ThreadProvider>
              <PostInteractionsProvider>
                <Header />
                <div className="flex">{children}</div>
              </PostInteractionsProvider>
            </ThreadProvider>
          </FeedProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
