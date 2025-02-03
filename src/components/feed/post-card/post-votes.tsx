import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { AppBskyFeedDefs } from "@atproto/api";
import { useAuth } from "@/components/context/auth-provider";
import { cn } from "@/lib/utils";

interface PostVotesProps {
  post: AppBskyFeedDefs.FeedViewPost;
  compact?: boolean;
}

export function PostVotes({ post, compact }: PostVotesProps) {
  const { agent } = useAuth();
  const viewer = post.post.viewer;
  const [isLiked, setIsLiked] = useState(viewer?.like !== undefined);
  const [likeCount, setLikeCount] = useState(post.post.likeCount || 0);
  const [likeUri, setLikeUri] = useState<string | undefined>(viewer?.like);

  const handleLike = async () => {
    if (!agent) return;
    try {
      if (!isLiked) {
        const response = await agent.like(post.post.uri, post.post.cid);
        setLikeUri(response.uri);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      } else if (likeUri) {
        await agent.deleteLike(likeUri);
        setLikeUri(undefined);
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Failed to like/unlike:", error);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center p-2 text-zinc-400",
        compact && "-space-y-3",
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        className={`p-0 ${isLiked ? "text-orange-500" : ""}`}
        onClick={handleLike}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      {!compact && <span className="text-xs font-medium">{likeCount}</span>}
      <Button variant="ghost" size="sm" className="p-0">
        <ArrowDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
