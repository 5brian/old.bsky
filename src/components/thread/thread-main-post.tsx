"use client";

import { Card } from "@/components/ui/card";
import type { AppBskyFeedDefs } from "@atproto/api";
import { PostVotes } from "@/components/post-card/post-votes";
import { PostContent } from "@/components/post-card/post-content";
import { PostMeta } from "@/components/post-card/post-meta";

interface ThreadMainPostProps {
  post: AppBskyFeedDefs.FeedViewPost;
}

export function ThreadMainPost({ post }: ThreadMainPostProps) {
  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <div className="flex">
        <PostVotes post={post} />
        <div className="flex-1 p-4">
          <PostContent post={post} />
          <PostMeta post={post} />
        </div>
      </div>
    </Card>
  );
}
