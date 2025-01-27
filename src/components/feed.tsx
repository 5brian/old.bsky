"use client";

import { useEffect, useState, useCallback, useLayoutEffect } from "react";
import { useAuth } from "./auth-provider";
import type { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import { PostCard } from "./post-card";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

const POSTS_PER_PAGE = 20;

type PageData = {
  posts: AppBskyFeedDefs.FeedViewPost[];
  cursor: string | undefined;
};

type ReplyRecord = {
  reply?: {
    parent?: {
      uri?: string;
    };
  };
};

export function Feed() {
  const { agent, isAuthenticated } = useAuth();
  const [pages, setPages] = useState<Map<number, PageData>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const currentPageData = pages.get(currentPage);

  const isReplyRecord = (record: unknown): record is AppBskyFeedPost.Record => {
    if (!record || typeof record !== "object") return false;
    const replyRecord = record as ReplyRecord;
    return (
      "reply" in record && typeof replyRecord.reply?.parent?.uri === "string"
    );
  };

  const getTopLevelPost = useCallback(
    async (
      post: AppBskyFeedDefs.FeedViewPost,
    ): Promise<AppBskyFeedDefs.FeedViewPost | null> => {
      if (!agent) return null;

      try {
        let currentPost = post;
        let record = currentPost.post.record as AppBskyFeedPost.Record;

        while (isReplyRecord(record) && record.reply?.parent?.uri) {
          const response = await agent.api.app.bsky.feed.getPosts({
            uris: [record.reply.parent.uri],
          });

          if (!response.success || response.data.posts.length === 0) {
            return null;
          }

          const parentPost = {
            post: response.data.posts[0],
            reason: post.reason,
          } as AppBskyFeedDefs.FeedViewPost;

          const parentRecord = parentPost.post.record as AppBskyFeedPost.Record;
          if (!isReplyRecord(parentRecord)) {
            return parentPost;
          }

          currentPost = parentPost;
          record = parentRecord;
        }

        return currentPost;
      } catch (error) {
        console.error("Failed to fetch top-level post:", error);
        return null;
      }
    },
    [agent],
  );

  const loadPage = useCallback(
    async (pageNumber: number) => {
      if (!agent || isLoading) return;

      if (pages.has(pageNumber)) {
        setCurrentPage(pageNumber);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const prevPageData = pages.get(pageNumber - 1);
        const response = await agent.getTimeline({
          limit: POSTS_PER_PAGE * 2,
          cursor: pageNumber === 1 ? undefined : prevPageData?.cursor,
        });

        if (response.success) {
          const processedPosts = await Promise.all(
            response.data.feed.map(async (post) => {
              const record = post.post.record as AppBskyFeedPost.Record;
              if (isReplyRecord(record)) {
                const topLevelPost = await getTopLevelPost(post);
                return topLevelPost;
              }
              return post;
            }),
          );

          const uniquePosts = processedPosts
            .filter(
              (post): post is AppBskyFeedDefs.FeedViewPost => post !== null,
            )
            .filter(
              (post, index, self) =>
                index === self.findIndex((p) => p.post.uri === post.post.uri),
            )
            .slice(0, POSTS_PER_PAGE);

          setPages((prevPages) => {
            const newPages = new Map(prevPages);
            newPages.set(pageNumber, {
              posts: uniquePosts,
              cursor: response.data.cursor,
            });
            return newPages;
          });
          setCurrentPage(pageNumber);
        }
      } catch (error) {
        console.error("Failed to load feed:", error);
        setError("Failed to load posts. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [agent, isLoading, pages, getTopLevelPost],
  );

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  useEffect(() => {
    if (agent && !pages.has(1)) {
      loadPage(1);
    }
  }, [agent, loadPage, pages]);

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
    <div className="space-y-4">
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
