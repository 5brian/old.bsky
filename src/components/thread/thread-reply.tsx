import { Card } from "@/components/ui/card";
import type { AppBskyFeedDefs } from "@atproto/api";
import { PostVotes } from "@/components/feed/post-card/post-votes";
import { PostContent } from "@/components/feed/post-card/post-content";
import { Button } from "@/components/ui/button";
import { formatDistanceToNowStrict } from "date-fns";
import { cn } from "@/lib/typescript";
import { PostCommentBox } from "@/components/feed/post-card/post-comment-box";
import { usePostInteractions } from "@/hooks/use-post-interactions";
import { useCommentState } from "@/hooks/use-comment-state";
import { getPostUrl, getProfileUrl } from "@/lib/post";

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
                window.open(getProfileUrl(post.post.author.handle), "_blank")
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
