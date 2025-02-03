import { useState, useCallback, useRef } from "react";
import type { AppBskyFeedDefs, AtpAgent, AppBskyFeedPost } from "@atproto/api";
import { isReplyRecord } from "@/lib/post";

export type FeedType = "following" | "discovery";

interface PageData {
  posts: AppBskyFeedDefs.FeedViewPost[];
  cursor: string | undefined;
}

interface TimelineResponse {
  success: boolean;
  data: {
    cursor?: string;
    feed: AppBskyFeedDefs.FeedViewPost[];
  };
}

const POSTS_PER_PAGE = 20;

export function useFeed(agent: AtpAgent | null, feedType: FeedType) {
  const [pages, setPages] = useState<Map<number, PageData>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const seenUrisRef = useRef<Set<string>>(new Set());

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
        const accumulatedPosts: AppBskyFeedDefs.FeedViewPost[] = [];
        let currentCursor: string | undefined = prevCursor;

        while (accumulatedPosts.length < POSTS_PER_PAGE) {
          const response: TimelineResponse = await (feedType === "following"
            ? agent.getTimeline({
                limit: POSTS_PER_PAGE * 2,
                cursor: currentCursor,
              })
            : agent.app.bsky.feed.getFeed({
                feed: "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot",
                limit: POSTS_PER_PAGE * 2,
                cursor: currentCursor,
              }));

          if (!response.success) {
            throw new Error("Failed to load feed");
          }

          if (!response.data.cursor) {
            break;
          }

          const processedPosts = await Promise.all(
            response.data.feed.map(
              async (item: AppBskyFeedDefs.FeedViewPost) => {
                const rec = item.post.record as AppBskyFeedPost.Record;
                if (isReplyRecord(rec)) {
                  return await getTopLevelPost(item);
                }
                return item;
              },
            ),
          );

          const uniquePosts = processedPosts
            .filter((res): res is AppBskyFeedDefs.FeedViewPost => res !== null)
            .filter((p) => {
              if (seenUrisRef.current.has(p.post.uri)) {
                return false;
              }
              seenUrisRef.current.add(p.post.uri);
              return true;
            });

          accumulatedPosts.push(...uniquePosts);
          currentCursor = response.data.cursor;
        }

        const finalPosts = accumulatedPosts.slice(0, POSTS_PER_PAGE);

        setPages((oldMap) => {
          const newMap = new Map(oldMap);
          newMap.set(pageNumber, {
            posts: finalPosts,
            cursor: currentCursor,
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

  const resetFeed = useCallback(() => {
    seenUrisRef.current.clear();
    setPages(new Map());
    setCurrentPage(1);
  }, []);

  return {
    pages,
    isLoading,
    currentPage,
    error,
    loadPage,
    resetFeed,
    POSTS_PER_PAGE,
  };
}
