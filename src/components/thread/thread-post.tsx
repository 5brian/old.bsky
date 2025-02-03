import { Card } from "@/components/ui/card";
import type { AppBskyFeedDefs } from "@atproto/api";
import { PostVotes } from "@/components/feed/post-card/post-votes";
import { PostContent } from "@/components/feed/post-card/post-content";
import { PostMeta } from "@/components/feed/post-card/post-meta";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/typescript";
import { PostCommentBox } from "@/components/feed/post-card/post-comment-box";
import { usePostInteractions } from "@/hooks/use-post-interactions";
import { useCommentState } from "@/hooks/use-comment-state";
import { getPostUrl } from "@/lib/post";

interface ThreadMainPostProps {
  post: AppBskyFeedDefs.FeedViewPost;
}

export function ThreadMainPost({ post }: ThreadMainPostProps) {
  const { isReposted, repostCount, handleRepost } = usePostInteractions(post);
  const {
    isVisible: isCommentBoxVisible,
    count: commentCount,
    hasCommented,
    isPosted: commentPosted,
    toggleCommentBox,
    handleCommentPost,
    setIsVisible,
  } = useCommentState(post);

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <div className="flex">
        <PostVotes post={post} />
        <div className="flex-1 p-4">
          <PostContent post={post} />
          <PostMeta post={post} />
          <div className="flex space-x-4 text-zinc-400 text-sm mt-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-0 text-sm hover:text-zinc-300 hover:underline",
                (hasCommented || commentPosted) &&
                  "text-blue-500 hover:text-blue-400",
              )}
              onClick={toggleCommentBox}
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
              onClick={() => window.open(getPostUrl(post), "_blank")}
            >
              source
            </Button>
          </div>

          {isCommentBoxVisible && (
            <PostCommentBox
              post={post}
              hasCommented={hasCommented}
              commentPosted={commentPosted}
              onCommentPost={handleCommentPost}
              onCancel={() => setIsVisible(false)}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
