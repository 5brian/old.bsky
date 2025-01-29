import type { AppBskyFeedDefs } from "@atproto/api";
import { Button } from "../ui/button";
import { useState } from "react";
import { useAuth } from "../auth-provider";
import { cn } from "@/lib/utils";

interface PostActionsProps {
  post: AppBskyFeedDefs.FeedViewPost;
  commentCount: number;
  hasCommented: boolean;
  commentPosted: boolean;
  onCommentClick: () => void;
}

export function PostActions({
  post,
  commentCount,
  hasCommented,
  commentPosted,
  onCommentClick,
}: PostActionsProps) {
  const { agent } = useAuth();
  const viewer = post.post.viewer;
  const [isReposted, setIsReposted] = useState(viewer?.repost !== undefined);
  const [repostCount, setRepostCount] = useState(post.post.repostCount || 0);
  const [repostUri, setRepostUri] = useState<string | undefined>(
    viewer?.repost,
  );

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

  return (
    <div className="flex space-x-4 text-zinc-400 text-sm mt-2">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "p-0 text-sm hover:text-zinc-300 hover:underline",
          (hasCommented || commentPosted) &&
            "text-blue-500 hover:text-blue-400",
        )}
        onClick={onCommentClick}
      >
        {commentCount} {commentCount === 1 ? "comment" : "comments"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "p-0 text-sm hover:text-zinc-300 hover:underline",
          isReposted && "text-green-500",
        )}
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
  );
}
