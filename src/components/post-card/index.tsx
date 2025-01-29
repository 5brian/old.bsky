import type { AppBskyFeedDefs } from "@atproto/api";
import { Card } from "../ui/card";
import { PostVotes } from "./post-votes";
import { PostContent } from "./post-content";
import { PostMeta } from "./post-meta";
import { PostActions } from "./post-actions";
import { PostCommentBox } from "./post-comment-box";
import { useState } from "react";

interface PostCardProps {
  post: AppBskyFeedDefs.FeedViewPost;
}

export function PostCard({ post }: PostCardProps) {
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentCount, setCommentCount] = useState(post.post.replyCount || 0);
  const [hasCommented, setHasCommented] = useState(false);
  const [commentPosted, setCommentPosted] = useState(false);

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
            commentPosted={commentPosted}
            onCommentClick={() => {
              setShowCommentBox(!showCommentBox);
              if (!showCommentBox) {
                setCommentPosted(false);
              }
            }}
          />

          {showCommentBox && (
            <PostCommentBox
              post={post}
              hasCommented={hasCommented}
              commentPosted={commentPosted}
              onCommentPost={() => {
                setCommentCount((prev) => prev + 1);
                setHasCommented(true);
                setCommentPosted(true);
                setShowCommentBox(false);
              }}
              onCancel={() => setShowCommentBox(false)}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
