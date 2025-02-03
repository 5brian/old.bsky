import type { AppBskyFeedDefs } from "@atproto/api";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/typescript";
import { usePostInteractions } from "@/hooks/use-post-interactions";

interface PostVotesProps {
  post: AppBskyFeedDefs.FeedViewPost;
  compact?: boolean;
}

export function PostVotes({ post, compact }: PostVotesProps) {
  const { isLiked, likeCount, handleLike } = usePostInteractions(post);

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
        className={cn("p-0", isLiked && "text-orange-500")}
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
