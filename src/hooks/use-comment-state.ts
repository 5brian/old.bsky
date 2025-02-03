import { useState, useCallback } from "react";
import type { AppBskyFeedDefs } from "@atproto/api";

export function useCommentState(post: AppBskyFeedDefs.FeedViewPost) {
  const [isVisible, setIsVisible] = useState(false);
  const [count, setCount] = useState(post.post.replyCount || 0);
  const [hasCommented, setHasCommented] = useState(false);
  const [isPosted, setIsPosted] = useState(false);

  const toggleCommentBox = useCallback(() => {
    setIsVisible((prev) => {
      setIsPosted(!prev ? false : prev);
      return !prev;
    });
  }, []);

  const handleCommentPost = useCallback(() => {
    setCount((prev) => prev + 1);
    setHasCommented(true);
    setIsPosted(true);
    setIsVisible(false);
  }, []);

  return {
    isVisible,
    count,
    hasCommented,
    isPosted,
    toggleCommentBox,
    handleCommentPost,
    setIsVisible,
  };
}
