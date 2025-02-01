"use client";

import { Card } from "@/components/ui/card";
import type { AppBskyFeedDefs } from "@atproto/api";
import { PostVotes } from "@/components/post-card/post-votes";
import { PostContent } from "@/components/post-card/post-content";
import { PostMeta } from "@/components/post-card/post-meta";

interface ThreadReplyPostProps {
  post: AppBskyFeedDefs.FeedViewPost;
}

export function ThreadReplyPost({ post }: ThreadReplyPostProps) {
  return (
    <Card className="bg-zinc-800 border-zinc-700 text-sm">
      <div className="flex">
        <PostVotes post={post} compact />
        <div className="flex-1 p-2">
          <PostContent post={post} />
          <PostMeta post={post} />
        </div>
      </div>
    </Card>
  );
}
