"use client";

import type { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useAuth } from "./auth-provider";
import { useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";

const BSKY_WEB_URL = "https://bsky.app";

interface PostCardProps {
  post: AppBskyFeedDefs.FeedViewPost;
}

export function PostCard({ post }: PostCardProps) {
  const { agent } = useAuth();
  const viewer = post.post.viewer as AppBskyFeedDefs.ViewerState | undefined;
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

  const getPostUrl = () => {
    const handle = post.post.author.handle;
    const rkey = post.post.uri.split("/").pop();
    return `${BSKY_WEB_URL}/profile/${handle}/post/${rkey}`;
  };

  const getProfileUrl = (handle: string) => {
    return `${BSKY_WEB_URL}/profile/${handle}`;
  };

  const renderPostText = () => {
    const postRecord = post.post.record as AppBskyFeedPost.Record;
    const text = postRecord.text;
    const facets = postRecord.facets || [];

    if (!facets.length) return text;

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const byteToStringIndex = (byteIndex: number): number => {
      const bytes = encoder.encode(text);
      const slice = decoder.decode(bytes.slice(0, byteIndex));
      return slice.length;
    };

    const sortedFacets = [...facets].sort(
      (a, b) => a.index.byteStart - b.index.byteStart,
    );

    let lastIndex = 0;
    const elements: React.ReactNode[] = [];

    sortedFacets.forEach((facet, idx) => {
      const startIndex = byteToStringIndex(facet.index.byteStart);
      const endIndex = byteToStringIndex(facet.index.byteEnd);

      if (startIndex > lastIndex) {
        elements.push(text.slice(lastIndex, startIndex));
      }

      if (
        facet.features.some(
          (f) => f.$type === "app.bsky.richtext.facet#mention",
        )
      ) {
        const mention = facet.features.find(
          (f) => f.$type === "app.bsky.richtext.facet#mention",
        );
        if (mention) {
          elements.push(
            <Button
              key={`mention-${idx}`}
              variant="link"
              className="h-auto p-0 text-base text-blue-400 hover:text-blue-300 font-normal"
              onClick={() =>
                window.open(`${BSKY_WEB_URL}/profile/${mention.did}`, "_blank")
              }
            >
              {text.slice(startIndex, endIndex)}
            </Button>,
          );
        }
      } else {
        elements.push(text.slice(startIndex, endIndex));
      }

      lastIndex = endIndex;
    });

    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }

    return elements;
  };

  const commentCount = post.post.replyCount || 0;

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <div className="flex">
        <div className="flex flex-col items-center p-2 text-zinc-400">
          <Button
            variant="ghost"
            size="sm"
            className={`p-0 ${isLiked ? "text-orange-500" : ""}`}
            onClick={handleLike}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium">{likeCount}</span>
          <Button variant="ghost" size="sm" className="p-0">
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 p-4">
          <div className="text-base mb-3">{renderPostText()}</div>

          <div className="text-sm text-zinc-400">
            submitted{" "}
            {formatDistanceToNowStrict(new Date(post.post.indexedAt), {
              addSuffix: true,
            })}{" "}
            by{" "}
            <Button
              variant="link"
              className="h-auto p-0 text-zinc-300 hover:text-zinc-100"
              onClick={() =>
                window.open(getProfileUrl(post.post.author.handle), "_blank")
              }
            >
              {post.post.author.handle}
            </Button>
          </div>

          <div className="flex space-x-4 text-zinc-400 text-sm mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 text-sm hover:text-zinc-300 hover:underline"
            >
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`p-0 text-sm hover:text-zinc-300 hover:underline ${
                isReposted ? "text-green-500" : ""
              }`}
              onClick={handleRepost}
            >
              {repostCount} {repostCount === 1 ? "repost" : "reposts"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 text-sm hover:text-zinc-300 hover:underline"
              onClick={() => window.open(getPostUrl(), "_blank")}
            >
              source
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
