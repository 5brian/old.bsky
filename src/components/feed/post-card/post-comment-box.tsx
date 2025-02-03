import type { AppBskyFeedDefs } from "@atproto/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useAuth } from "@/components/context/auth-provider";
import { cn } from "@/lib/utils";
import { RichText } from "@atproto/api";

interface PostCommentBoxProps {
  post: AppBskyFeedDefs.FeedViewPost;
  hasCommented: boolean;
  commentPosted: boolean;
  onCommentPost: () => void;
  onCancel: () => void;
}

export function PostCommentBox({
  post,
  hasCommented,
  commentPosted,
  onCommentPost,
  onCancel,
}: PostCommentBoxProps) {
  const { agent } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  const handleComment = async () => {
    if (!agent || !commentText.trim()) return;

    setIsCommenting(true);
    try {
      const richText = new RichText({ text: commentText });
      await richText.detectFacets(agent);

      await agent.post({
        text: richText.text,
        reply: {
          root: {
            uri: post.post.uri,
            cid: post.post.cid,
          },
          parent: {
            uri: post.post.uri,
            cid: post.post.cid,
          },
        },
        facets: richText.facets,
      });

      setCommentText("");
      onCommentPost();
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div className="mt-4 space-y-2">
      <Textarea
        placeholder="Write a comment..."
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        className={cn(
          "min-h-[80px] bg-zinc-700 border-zinc-600",
          (hasCommented || commentPosted) && "border-blue-500",
        )}
      />
      <div className="flex justify-end space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onCancel();
            setCommentText("");
          }}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleComment}
          disabled={isCommenting || !commentText.trim()}
          className={cn(
            "bg-primary",
            (hasCommented || commentPosted) && "bg-blue-500 hover:bg-blue-600",
          )}
        >
          {isCommenting ? "Posting..." : "Comment"}
        </Button>
      </div>
    </div>
  );
}
