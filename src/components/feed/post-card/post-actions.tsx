import type { AppBskyFeedDefs } from "@atproto/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/typescript";
import { useThread } from "@/components/context/thread-provider";
import { usePostInteractions } from "@/hooks/use-post-interactions";
import { getPostUrl } from "@/lib/post";

interface PostActionsProps {
  post: AppBskyFeedDefs.FeedViewPost;
  commentCount: number;
  hasCommented: boolean;
  onCommentClick: () => void;
}

export function PostActions({
  post,
  commentCount,
  hasCommented,
  onCommentClick,
}: PostActionsProps) {
  const { setActiveThread, setThreadVisible } = useThread();
  const { isReposted, repostCount, handleRepost } = usePostInteractions(post);

  const handleThreadClick = () => {
    setActiveThread(post);
    setThreadVisible(true);
  };

  return (
    <div className="flex space-x-4 text-zinc-400 text-sm mt-2">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "p-0 text-sm hover:text-zinc-300 hover:underline",
          hasCommented && "text-blue-500 hover:text-blue-400",
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
        onClick={handleThreadClick}
      >
        thread
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="p-0 text-sm hover:text-zinc-300 hover:underline"
        onClick={() => window.open(getPostUrl(post), "_blank")}
      >
        source
      </Button>
    </div>
  );
}
