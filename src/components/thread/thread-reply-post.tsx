"use client";

import { Card } from "@/components/ui/card";
import type { AppBskyFeedDefs } from "@atproto/api";
import { PostVotes } from "@/components/post-card/post-votes";
import { PostContent } from "@/components/post-card/post-content";
import { PostMeta } from "@/components/post-card/post-meta";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PostCommentBox } from "@/components/post-card/post-comment-box";

interface ThreadReplyPostProps {
  post: AppBskyFeedDefs.FeedViewPost;
  depth?: number;
  hasMoreReplies?: boolean;
  isExpanded?: boolean;
  onExpand?: () => void;
}

export function ThreadReplyPost({
  post,
  depth = 0,
  hasMoreReplies,
  isExpanded,
  onExpand,
}: ThreadReplyPostProps) {
  const { agent } = useAuth();
  const [isReposted, setIsReposted] = useState(
    post.post.viewer?.repost !== undefined,
  );
  const [repostCount, setRepostCount] = useState(post.post.repostCount || 0);
  const [repostUri, setRepostUri] = useState<string | undefined>(
    post.post.viewer?.repost,
  );
  const [commentState, setCommentState] = useState({
    isVisible: false,
    count: post.post.replyCount || 0,
    hasCommented: false,
    isPosted: false,
  });

  const handleRepost = async () => {
    if (!agent) return;
    try {
      if (!isReposted) {
        const response = await agent.repost(post.post.uri, post.post.cid);
        setRepostUri(response.uri);
        setIsReposted(true);
        setRepostCount((prev) => prev + 1);
      } else if (repostUri) {
        await agent.deleteRepost(repostUri);
        setRepostUri(undefined);
        setIsReposted(false);
        setRepostCount((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Failed to repost/unrepost:", error);
    }
  };

  const getPostUrl = () => {
    const handle = post.post.author.handle;
    const rkey = post.post.uri.split("/").pop();
    return `https://bsky.app/profile/${handle}/post/${rkey}`;
  };

  const toggleCommentBox = () => {
    setCommentState((prev) => ({
      ...prev,
      isVisible: !prev.isVisible,
      isPosted: prev.isVisible ? false : prev.isPosted, // Reset posted state when opening
    }));
  };

  const handleCommentPost = () => {
    setCommentState((prev) => ({
      ...prev,
      count: prev.count + 1,
      hasCommented: true,
      isPosted: true,
      isVisible: false,
    }));
  };

  return (
    <Card
      className={cn("bg-zinc-800 border-zinc-700 text-sm", {
        "ml-4": depth > 0,
      })}
    >
      <div className="flex">
        <PostVotes post={post} compact />
        <div className="flex-1 p-2">
          <PostContent post={post} />
          <PostMeta post={post} />
          <div className="flex space-x-4 text-zinc-400 text-xs mt-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-0 text-xs hover:text-zinc-300 hover:underline",
                (commentState.hasCommented || commentState.isPosted) &&
                  "text-blue-500 hover:text-blue-400",
              )}
              onClick={toggleCommentBox}
            >
              {commentState.count}{" "}
              {commentState.count === 1 ? "comment" : "comments"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-0 text-xs hover:text-zinc-300 hover:underline",
                isReposted && "text-green-500",
              )}
              onClick={handleRepost}
            >
              {repostCount} {repostCount === 1 ? "repost" : "reposts"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 text-xs hover:text-zinc-300 hover:underline"
              onClick={() => window.open(getPostUrl(), "_blank")}
            >
              source
            </Button>
            {hasMoreReplies && !isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                className="p-0 text-xs hover:text-zinc-300 hover:underline"
                onClick={onExpand}
              >
                [+]
              </Button>
            )}
          </div>

          {commentState.isVisible && (
            <PostCommentBox
              post={post}
              hasCommented={commentState.hasCommented}
              commentPosted={commentState.isPosted}
              onCommentPost={handleCommentPost}
              onCancel={() =>
                setCommentState((prev) => ({
                  ...prev,
                  isVisible: false,
                }))
              }
            />
          )}
        </div>
      </div>
    </Card>
  );
}
