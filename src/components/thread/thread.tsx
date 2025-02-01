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
}

interface ThreadViewRecord {
  $type: string;
  post: AppBskyFeedDefs.PostView;
  parent?: AppBskyFeedDefs.ThreadViewPost;
  replies?: AppBskyFeedDefs.ThreadViewPost[];
}

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

export function Thread() {
  const { activeThread, isThreadVisible, setThreadVisible, setActiveThread } =
    useThread();
  const { agent } = useAuth();
  const [parentPosts, setParentPosts] = useState<
    AppBskyFeedDefs.FeedViewPost[]
  >([]);
  const [replyPosts, setReplyPosts] = useState<AppBskyFeedDefs.FeedViewPost[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadThread = async () => {
      if (!agent || !activeThread) return;

      setIsLoading(true);
      try {
        const response = await agent.getPostThread({
          uri: activeThread.post.uri,
        });

        if (response.success) {
          const parents: AppBskyFeedDefs.FeedViewPost[] = [];
          const replies: AppBskyFeedDefs.FeedViewPost[] = [];
          const thread = response.data.thread;

          if (isThreadViewPost(thread)) {
            // Get parent posts
            let currentParent = thread.parent;
            while (currentParent && isThreadViewPost(currentParent)) {
              parents.unshift(convertToFeedViewPost(currentParent.post));
              currentParent = currentParent.parent;
            }

            // Get reply posts
            const threadReplies = thread.replies || [];
            for (const reply of threadReplies) {
              if (isThreadViewPost(reply)) {
                replies.push(convertToFeedViewPost(reply.post));
              }
            }
          }

          setParentPosts(parents);
          setReplyPosts(replies);
        }
      } catch (error) {
        console.error("Failed to load thread:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (activeThread) {
      loadThread();
    }
  }, [agent, activeThread]);

  if (!isThreadVisible || !activeThread) return null;

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 p-4">
        <h2 className="text-lg font-semibold">Thread</h2>
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
            {replyPosts.map((post) => (
              <ThreadReplyPost key={post.post.uri} post={post} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
