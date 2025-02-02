"use client";

import { useThread } from "./thread-provider";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useEffect, useState } from "react";
import type { AppBskyFeedDefs } from "@atproto/api";
import { Loader2 } from "lucide-react";
import { ThreadMainPost } from "./thread-main-post";
import { ThreadReplyPost } from "./thread-reply-post";

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

function sortByLikes(posts: ThreadPost[]) {
  return [...posts].sort((a, b) => {
    const likesA = a.post.likeCount || 0;
    const likesB = b.post.likeCount || 0;
    return likesB - likesA;
  });
}

export function Thread() {
  const { activeThread, isThreadVisible, setThreadVisible, setActiveThread } =
    useThread();
  const { agent } = useAuth();
  const [parentPosts, setParentPosts] = useState<
    AppBskyFeedDefs.FeedViewPost[]
  >([]);
  const [replyPosts, setReplyPosts] = useState<ThreadPost[]>([]);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [collapsedPosts, setCollapsedPosts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const updateRepliesInThread = (
    posts: ThreadPost[],
    parentUri: string,
    newReplies?: ThreadPost[],
  ): ThreadPost[] => {
    return posts.map((post) => {
      if (post.post.uri === parentUri) {
        return {
          ...post,
          replies: newReplies ? sortByLikes(newReplies) : undefined,
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
  };

  const autoExpandReplies = async (replies: ThreadPost[], currentDepth = 0) => {
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
                  sortByLikes(newReplies),
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
  };

  const handleExpandReplies = async (postUri: string) => {
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
    }
  };

  const toggleReplies = (postUri: string) => {
    setCollapsedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postUri)) {
        newSet.delete(postUri);
      } else {
        newSet.add(postUri);
      }
      return newSet;
    });
  };

  const assignDepth = (posts: ThreadPost[], depth = 0): ThreadPost[] => {
    return posts.map((post) => ({
      ...post,
      depth,
      replies: post.replies ? assignDepth(post.replies, depth + 1) : undefined,
    }));
  };

  useEffect(() => {
    const loadThread = async () => {
      if (!agent || !activeThread) return;

      setIsLoading(true);
      try {
        const response = await agent.getPostThread({
          uri: activeThread.post.uri,
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
            const processedReplies = assignDepth(sortByLikes(replies));

            setParentPosts(parents);
            setReplyPosts(processedReplies);
            setCollapsedPosts(new Set());

            // Auto-expand replies up to two levels deep
            await autoExpandReplies(processedReplies);
          }
        }
      } catch (error) {
        console.error("Failed to load thread:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (activeThread) {
      loadThread();
      setExpandedPosts(new Set());
      setCurrentPage(1);
    }
  }, [agent, activeThread]);

  const renderReplies = (replies?: ThreadPost[]) => {
    if (!replies) return null;

    const paginatedReplies = replies.slice(0, currentPage * POSTS_PER_PAGE);

    return (
      <div className="space-y-2 ml-4 border-l border-zinc-700 pl-4">
        {paginatedReplies.map((reply) => (
          <div key={reply.post.uri}>
            <ThreadReplyPost
              post={convertToFeedViewPost(reply.post)}
              depth={reply.depth}
              hasMoreReplies={!!reply.replies?.length}
              isExpanded={!collapsedPosts.has(reply.post.uri)}
              onExpand={() => {
                if (collapsedPosts.has(reply.post.uri)) {
                  toggleReplies(reply.post.uri);
                } else if (!expandedPosts.has(reply.post.uri)) {
                  handleExpandReplies(reply.post.uri);
                } else {
                  toggleReplies(reply.post.uri);
                }
              }}
            />
            {!collapsedPosts.has(reply.post.uri) &&
              renderReplies(reply.replies)}
          </div>
        ))}
        {replies.length > paginatedReplies.length && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            className="ml-2 text-zinc-400"
          >
            load more replies
          </Button>
        )}
      </div>
    );
  };

  if (!isThreadVisible || !activeThread) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 p-4">
        <h2 className="text-lg font-semibold">
          {activeThread?.post.author.displayName}&apos;s post
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setThreadVisible(false);
            setActiveThread(null);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {parentPosts.map((post) => (
                <ThreadReplyPost key={post.post.uri} post={post} />
              ))}
              <ThreadMainPost post={activeThread} />
              {renderReplies(replyPosts)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
