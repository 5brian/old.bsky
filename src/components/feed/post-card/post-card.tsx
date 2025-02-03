import type { AppBskyFeedDefs } from "@atproto/api";
import { Card } from "@/components/ui/card";
import { PostVotes } from "@/components/feed/post-card/post-votes";
import { PostContent } from "@/components/feed/post-card/post-content";
import { PostMeta } from "@/components/feed/post-card/post-meta";
import { PostActions } from "@/components/feed/post-card/post-actions";
import { PostCommentBox } from "@/components/feed/post-card/post-comment-box";
import { useState } from "react";

interface PostCardProps {
  post: AppBskyFeedDefs.FeedViewPost;
}

interface CommentState {
  isVisible: boolean;
  count: number;
  hasCommented: boolean;
  isPosted: boolean;
}

export function PostCard({ post }: PostCardProps) {
  const [commentState, setCommentState] = useState<CommentState>({
    isVisible: false,
    count: post.post.replyCount || 0,
    hasCommented: false,
    isPosted: false,
  });

  const toggleCommentBox = () => {
    setCommentState((prev) => ({
      ...prev,
      isVisible: !prev.isVisible,
      isPosted: prev.isVisible ? false : prev.isPosted, // Reset posted state when opening
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
    <Card className="bg-zinc-800 border-zinc-700">
      <div className="flex">
        <PostVotes post={post} />

        <div className="flex-1 p-4">
          <PostContent post={post} />
          <PostMeta post={post} />
          <PostActions
            post={post}
            commentCount={commentState.count}
            hasCommented={commentState.hasCommented}
            commentPosted={commentState.isPosted}
            onCommentClick={toggleCommentBox}
          />

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
