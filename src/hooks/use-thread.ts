import { useState, useCallback } from "react";
import type { AppBskyFeedDefs } from "@atproto/api";
import { AtpAgent } from "@atproto/api";
import { sortRepliesByLikes } from "@/lib/post";

interface ThreadPost extends AppBskyFeedDefs.ThreadViewPost {
  $type: string;
  replies?: ThreadPost[];
  depth?: number;
}

interface ThreadViewRecord {
  $type: string;
  post: AppBskyFeedDefs.PostView;
  parent?: ThreadPost;
  replies?: ThreadPost[];
}

const MAX_VISIBLE_DEPTH = 2;
const POSTS_PER_PAGE = 20;

function isThreadViewPost(post: unknown): post is ThreadPost {
  if (!post || typeof post !== "object") return false;
  const record = post as ThreadViewRecord;
  return (
    record.$type === "app.bsky.feed.defs#threadViewPost" && "post" in record
  );
}

function convertToFeedViewPost(
  post: AppBskyFeedDefs.PostView,
): AppBskyFeedDefs.FeedViewPost {
  return {
    post,
    reason: undefined,
  };
}

export function useThread(agent: AtpAgent | null) {
  const [parentPosts, setParentPosts] = useState<
    AppBskyFeedDefs.FeedViewPost[]
  >([]);
  const [replyPosts, setReplyPosts] = useState<ThreadPost[]>([]);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [collapsedPosts, setCollapsedPosts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const updateRepliesInThread = useCallback(
    (
      posts: ThreadPost[],
      parentUri: string,
      newReplies?: ThreadPost[],
    ): ThreadPost[] => {
      return posts.map((post) => {
        if (post.post.uri === parentUri) {
          return {
            ...post,
            replies: newReplies ? sortRepliesByLikes(newReplies) : undefined,
          };
        }
        if (post.replies) {
          return {
            ...post,
            replies: updateRepliesInThread(post.replies, parentUri, newReplies),
          };
        }
        return post;
      });
    },
    [],
  );

  const assignDepth = useCallback(
    (posts: ThreadPost[], depth = 0): ThreadPost[] => {
      return posts.map((post) => ({
        ...post,
        depth,
        replies: post.replies
          ? assignDepth(post.replies, depth + 1)
          : undefined,
      }));
    },
    [],
  );

  const autoExpandReplies = useCallback(
    async (replies: ThreadPost[], currentDepth = 0) => {
      if (!agent || currentDepth >= 2) return;

      for (const reply of replies) {
        if (reply.replies?.length) {
          setExpandedPosts((prev) => new Set([...prev, reply.post.uri]));

          try {
            const response = await agent.getPostThread({
              uri: reply.post.uri,
              depth: MAX_VISIBLE_DEPTH,
            });

            if (response.success && isThreadViewPost(response.data.thread)) {
              const newReplies = response.data.thread.replies;
              if (
                Array.isArray(newReplies) &&
                newReplies.every(isThreadViewPost)
              ) {
                setReplyPosts((prevPosts) =>
                  updateRepliesInThread(
                    prevPosts,
                    reply.post.uri,
                    sortRepliesByLikes(newReplies),
                  ),
                );

                await autoExpandReplies(newReplies, currentDepth + 1);
              }
            }
          } catch (error) {
            console.error("Failed to auto-expand replies:", error);
          }
        }
      }
    },
    [agent, updateRepliesInThread],
  );

  const handleExpandReplies = useCallback(
    async (postUri: string) => {
      if (!agent) return;

      try {
        const response = await agent.getPostThread({
          uri: postUri,
          depth: MAX_VISIBLE_DEPTH,
        });

        if (response.success && isThreadViewPost(response.data.thread)) {
          setExpandedPosts((prev) => new Set([...prev, postUri]));

          const replies = response.data.thread.replies;
          if (Array.isArray(replies) && replies.every(isThreadViewPost)) {
            setReplyPosts((prevPosts) =>
              updateRepliesInThread(prevPosts, postUri, replies),
            );
          }
        }
      } catch (error) {
        console.error("Failed to load more replies:", error);
        setError("Failed to load replies");
      }
    },
    [agent, updateRepliesInThread],
  );

  const toggleReplies = useCallback((postUri: string) => {
    setCollapsedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postUri)) {
        newSet.delete(postUri);
      } else {
        newSet.add(postUri);
      }
      return newSet;
    });
  }, []);

  const loadThread = useCallback(
    async (threadUri: string) => {
      if (!agent) return;

      setIsLoading(true);
      setError(null);
      try {
        const response = await agent.getPostThread({
          uri: threadUri,
          depth: MAX_VISIBLE_DEPTH,
        });

        if (response.success) {
          const parents: AppBskyFeedDefs.FeedViewPost[] = [];
          const thread = response.data.thread;

          if (isThreadViewPost(thread)) {
            // Get parent posts
            let currentParent = thread.parent;
            while (currentParent && isThreadViewPost(currentParent)) {
              parents.unshift(convertToFeedViewPost(currentParent.post));
              currentParent = currentParent.parent;
            }

            // Process replies with depth
            const replies = thread.replies || [];
            const processedReplies = assignDepth(sortRepliesByLikes(replies));

            setParentPosts(parents);
            setReplyPosts(processedReplies);
            setCollapsedPosts(new Set());
            setCurrentPage(1);

            // Auto-expand replies up to two levels deep
            await autoExpandReplies(processedReplies);
          }
        }
      } catch (error) {
        console.error("Failed to load thread:", error);
        setError("Failed to load thread");
      } finally {
        setIsLoading(false);
      }
    },
    [agent, assignDepth, autoExpandReplies],
  );

  const loadMoreReplies = useCallback(() => {
    setCurrentPage((prev) => prev + 1);
  }, []);

  return {
    parentPosts,
    replyPosts,
    expandedPosts,
    collapsedPosts,
    isLoading,
    error,
    currentPage,
    updateRepliesInThread,
    handleExpandReplies,
    toggleReplies,
    loadThread,
    loadMoreReplies,
    POSTS_PER_PAGE,
  };
}
