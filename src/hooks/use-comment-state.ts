import { useState, useCallback } from "react";
import type { AppBskyFeedDefs } from "@atproto/api";
import { usePostInteractions } from "@/components/context/post-interactions-provider";

export function useCommentState(post: AppBskyFeedDefs.FeedViewPost) {
  const [isVisible, setIsVisible] = useState(false);
  const { getInteraction, updateInteraction } = usePostInteractions();
  const interaction = getInteraction(post.post.uri);

  const toggleCommentBox = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  const handleCommentPost = useCallback(() => {
    updateInteraction(post.post.uri, {
      commentCount: interaction.commentCount + 1,
      hasCommented: true,
      isInitialized: true,
    });
    setIsVisible(false);
  }, [interaction.commentCount, post.post.uri, updateInteraction]);

  return {
    isVisible,
    count: interaction.commentCount,
    hasCommented: interaction.hasCommented,
    toggleCommentBox,
    handleCommentPost,
    setIsVisible,
  };
}
