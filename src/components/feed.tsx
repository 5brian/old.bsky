"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import type { AppBskyFeedDefs } from "@atproto/api";
import { PostCard } from "./post-card";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

export function Feed() {
  const { agent, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();

  useEffect(() => {
    if (agent) {
      loadFeed();
    }
  }, [agent]);

  const loadFeed = async () => {
    if (!agent) return;

    try {
      const response = await agent.getTimeline({ limit: 20, cursor });
      if (response.success) {
        setPosts((prev) =>
          cursor ? [...prev, ...response.data.feed] : response.data.feed,
        );
        setCursor(response.data.cursor);
      }
    } catch (error) {
      console.error("Failed to load feed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold mb-2">Welcome to old.bsky</h2>
        <p className="text-zinc-400">Please login to view your feed</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.post.cid} post={post} />
      ))}
      <div className="flex justify-center p-4">
        <Button onClick={() => loadFeed()} disabled={!cursor}>
          Load More
        </Button>
      </div>
    </div>
  );
}
