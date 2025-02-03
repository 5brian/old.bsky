"use client";

import { Card } from "@/components/ui/card";
import type { AppBskyFeedDefs } from "@atproto/api";
import { PostVotes } from "@/components/feed/post-card/post-votes";
import { PostContent } from "@/components/feed/post-card/post-content";
import { Button } from "@/components/ui/button";
import { formatDistanceToNowStrict } from "date-fns";
import { useAuth } from "@/components/context/auth-provider";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PostCommentBox } from "@/components/feed/post-card/post-comment-box";

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
      isPosted: prev.isVisible ? false : prev.isPosted,
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
          <div className="text-xs text-zinc-400 mb-2">
            {hasMoreReplies && (
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-xs hover:text-zinc-300"
                onClick={onExpand}
              >
                [{isExpanded ? "-" : "+"}]
              </Button>
            )}{" "}
            <Button
              variant="ghost"
              className="p-0 h-auto text-xs text-zinc-100 hover:text-zinc-300 hover:underline"
              onClick={() =>
                window.open(
                  `https://bsky.app/profile/${post.post.author.handle}`,
                  "_blank",
                )
              }
            >
              {post.post.author.handle}
            </Button>{" "}
            {post.post.likeCount} points{" "}
            {formatDistanceToNowStrict(new Date(post.post.indexedAt), {
              addSuffix: true,
            })}
          </div>

          <PostContent post={post} />
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
