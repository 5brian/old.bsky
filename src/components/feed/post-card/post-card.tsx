import type { AppBskyFeedDefs } from "@atproto/api";
import { Card } from "@/components/ui/card";
import { PostVotes } from "@/components/feed/post-card/post-votes";
import { PostContent } from "@/components/feed/post-card/post-content";
import { PostMeta } from "@/components/feed/post-card/post-meta";
import { PostActions } from "@/components/feed/post-card/post-actions";
import { PostCommentBox } from "@/components/feed/post-card/post-comment-box";
import { useCommentState } from "@/hooks/use-comment-state";

interface PostCardProps {
  post: AppBskyFeedDefs.FeedViewPost;
}

export function PostCard({ post }: PostCardProps) {
  const {
    isVisible: isCommentBoxVisible,
    count: commentCount,
    hasCommented,
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
          <PostActions
            post={post}
            commentCount={commentCount}
            hasCommented={hasCommented}
            onCommentClick={toggleCommentBox}
          />

          {isCommentBoxVisible && (
            <PostCommentBox
              post={post}
              hasCommented={hasCommented}
              onCommentPost={handleCommentPost}
              onCancel={() => setIsVisible(false)}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
