"use client";

import type { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Repeat2,
  Heart,
} from "lucide-react";
import { useAuth } from "./auth-provider";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: AppBskyFeedDefs.FeedViewPost;
}

export function PostCard({ post }: PostCardProps) {
  const { agent } = useAuth();
  const viewer = post.viewer as AppBskyFeedDefs.ViewerState | undefined;
  const [isLiked, setIsLiked] = useState(viewer?.like !== undefined);
  const [isReposted, setIsReposted] = useState(viewer?.repost !== undefined);
  const [likeCount, setLikeCount] = useState(post.post.likeCount || 0);
  const [repostCount, setRepostCount] = useState(post.post.repostCount || 0);

  const handleLike = async () => {
    if (!agent) return;
    try {
      if (!isLiked) {
        await agent.like(post.post.uri, post.post.cid);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      } else {
        await agent.deleteLike(post.post.uri);
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Failed to like/unlike:", error);
    }
  };

  const handleRepost = async () => {
    if (!agent) return;
    try {
      if (!isReposted) {
        await agent.repost(post.post.uri, post.post.cid);
        setIsReposted(true);
        setRepostCount((prev) => prev + 1);
      } else {
        await agent.deleteRepost(post.post.uri);
        setIsReposted(false);
        setRepostCount((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Failed to repost/unrepost:", error);
    }
  };

  const postRecord = post.post.record as AppBskyFeedPost.Record;

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <div className="flex">
        <div className="flex flex-col items-center p-2 text-zinc-400">
          <Button variant="ghost" size="sm" className="p-0">
            <ArrowUp className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium">{likeCount}</span>
          <Button variant="ghost" size="sm" className="p-0">
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium">
              {post.post.author.displayName || post.post.author.handle}
            </span>
            <span className="text-zinc-400 text-sm">
              {formatDistanceToNow(new Date(post.post.indexedAt))} ago
            </span>
          </div>

          <div className="text-sm mb-3">{postRecord.text}</div>

          <div className="flex space-x-4 text-zinc-400">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
              onClick={handleLike}
            >
              <Heart
                className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
              />
              <span>{likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
              onClick={handleRepost}
            >
              <Repeat2
                className={`h-4 w-4 ${isReposted ? "text-green-500" : ""}`}
              />
              <span>{repostCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{post.post.replyCount || 0}</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
