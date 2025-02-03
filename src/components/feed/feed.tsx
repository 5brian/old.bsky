"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useAuth } from "@/components/context/auth-provider";
import { useFeed } from "@/hooks/use-feed";
import { PostCard } from "@/components/feed/post-card/post-card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeed as useFeedContext } from "@/components/context/feed-provider";

export function Feed() {
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const { feedType } = useFeedContext();
  const { agent, isAuthenticated } = useAuth();

  const { pages, isLoading, currentPage, error, loadPage, resetFeed } = useFeed(
    agent,
    feedType,
  );

  useLayoutEffect(() => {
    if (feedContainerRef.current) {
      const scrollableParent =
        feedContainerRef.current.closest(".overflow-y-auto");
      if (scrollableParent) {
        scrollableParent.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [currentPage]);

  useEffect(() => {
    if (!agent) return;
    resetFeed();
    loadPage(1);
  }, [agent, feedType, loadPage, resetFeed]);

  const currentPageData = pages.get(currentPage);

  if (!isAuthenticated) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold mb-2">Welcome to old.bsky</h2>
        <p className="text-zinc-400">Please login to view your feed</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>{error}</p>
        <Button onClick={() => loadPage(currentPage)} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div ref={feedContainerRef} className="space-y-4">
      {isLoading && !currentPageData ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {currentPageData?.posts.map((post) => (
              <PostCard key={post.post.uri} post={post} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 py-4 text-sm text-zinc-400">
            <span>view more:</span>
            <Button
              onClick={() => loadPage(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              variant="link"
              className="h-auto p-0 text-zinc-400 hover:text-zinc-100"
            >
              ‹ prev
            </Button>
            <span>|</span>
            <Button
              onClick={() => loadPage(currentPage + 1)}
              disabled={!currentPageData?.cursor || isLoading}
              variant="link"
              className="h-auto p-0 text-zinc-400 hover:text-zinc-100"
            >
              next ›
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
