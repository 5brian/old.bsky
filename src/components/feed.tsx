"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import type { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import { useAuth } from "./auth-provider";
import { useFeed } from "./feed-provider";
import { PostCard } from "./post-card";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";

const POSTS_PER_PAGE = 20;

type PageData = {
  posts: AppBskyFeedDefs.FeedViewPost[];
  cursor: string | undefined;
};

function isReplyRecord(record: unknown): record is AppBskyFeedPost.Record {
  if (!record || typeof record !== "object") return false;
  const maybeReply = record as { reply?: { parent?: { uri?: string } } };
  return (
    "reply" in maybeReply && typeof maybeReply.reply?.parent?.uri === "string"
  );
}

export function Feed() {
  const { feedType } = useFeed();
  const { agent, isAuthenticated } = useAuth();

  const [pages, setPages] = useState<Map<number, PageData>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

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

          const parentPost: AppBskyFeedDefs.FeedViewPost = {
            post: response.data.posts[0],
            reason: post.reason,
          };
          const parentRecord = parentPost.post.record as AppBskyFeedPost.Record;

          if (!isReplyRecord(parentRecord)) {
            return parentPost;
          }

          currentPost = parentPost;
          record = parentRecord;
        }

        return currentPost;
      } catch (err) {
        console.error("Failed to fetch top-level post:", err);
        return null;
      }
    },
    [agent],
  );

  const loadPage = useCallback(
    async (pageNumber: number) => {
      if (!agent) return;

      setIsLoading(true);
      setError(null);

      let pageAlreadyExists = false;
      let prevCursor: string | undefined = undefined;

      setPages((oldMap) => {
        if (oldMap.has(pageNumber)) {
          pageAlreadyExists = true;
        }
        if (oldMap.has(pageNumber - 1)) {
          prevCursor = oldMap.get(pageNumber - 1)?.cursor;
        }
        return oldMap;
      });

      if (pageAlreadyExists) {
        setCurrentPage(pageNumber);
        setIsLoading(false);
        return;
      }

      try {
        let response;
        if (feedType === "following") {
          response = await agent.getTimeline({
            limit: POSTS_PER_PAGE * 2,
            cursor: pageNumber === 1 ? undefined : prevCursor,
          });
        } else {
          response = await agent.app.bsky.feed.getFeed({
            feed: "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot",
            limit: POSTS_PER_PAGE * 2,
            cursor: pageNumber === 1 ? undefined : prevCursor,
          });
        }

        if (!response.success) {
          throw new Error("Failed to load feed");
        }

        const processedPosts = await Promise.all(
          response.data.feed.map(async (item: AppBskyFeedDefs.FeedViewPost) => {
            const rec = item.post.record as AppBskyFeedPost.Record;
            if (isReplyRecord(rec)) {
              return await getTopLevelPost(item);
            }
            return item;
          }),
        );

        const uniquePosts = processedPosts
          .filter(
            (res): res is AppBskyFeedDefs.FeedViewPost =>
              res !== null && res !== undefined,
          )
          .filter(
            (p, idx, self) =>
              idx === self.findIndex((q) => q.post.uri === p.post.uri),
          )
          .slice(0, POSTS_PER_PAGE);

        setPages((oldMap) => {
          const newMap = new Map(oldMap);
          newMap.set(pageNumber, {
            posts: uniquePosts,
            cursor: response.data.cursor,
          });
          return newMap;
        });
        setCurrentPage(pageNumber);
      } catch (err) {
        console.error(err);
        setError("Failed to load posts. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [agent, feedType, getTopLevelPost],
  );

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  useEffect(() => {
    if (!agent) return;
    (async () => {
      setPages(new Map());
      setCurrentPage(1);
      await loadPage(1);
    })();
  }, [agent, feedType, loadPage]);

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
