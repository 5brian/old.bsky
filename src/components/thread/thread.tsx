"use client";

import { useAuth } from "@/components/context/auth-provider";
import { useThread as useThreadContext } from "@/components/context/thread-provider";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { ThreadMainPost } from "./thread-post";
import { ThreadReplyPost } from "./thread-reply";
import { useThread } from "@/hooks/use-thread";
import { useEffect } from "react";

export function Thread() {
  const { activeThread, isThreadVisible, setThreadVisible, setActiveThread } =
    useThreadContext();
  const { agent } = useAuth();

  const {
    parentPosts,
    replyPosts,
    expandedPosts,
    collapsedPosts,
    isLoading,
    error,
    currentPage,
    POSTS_PER_PAGE,
    handleExpandReplies,
    toggleReplies,
    loadThread,
    loadMoreReplies,
  } = useThread(agent);

  useEffect(() => {
    if (activeThread && agent) {
      loadThread(activeThread.post.uri);
    }
  }, [activeThread, agent, loadThread]);

  const renderReplies = (replies?: typeof replyPosts) => {
    if (!replies || replies.length === 0) return null;

    const paginatedReplies = replies.slice(0, currentPage * POSTS_PER_PAGE);

    return (
      <div className="space-y-2 ml-4 border-l border-zinc-700 pl-4">
        {paginatedReplies.map((reply) => (
          <div key={reply.post.uri}>
            <ThreadReplyPost
              post={{
                post: reply.post,
                reason: undefined,
              }}
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
            onClick={loadMoreReplies}
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
          {error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <>
              {parentPosts.map((post) => (
                <ThreadReplyPost key={post.post.uri} post={post} />
              ))}
              <ThreadMainPost post={activeThread} />
              {isLoading && parentPosts.length === 0 ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                renderReplies(replyPosts)
              )}
              {isLoading && parentPosts.length > 0 && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                  <span className="ml-2 text-zinc-500">Loading more replies...</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
