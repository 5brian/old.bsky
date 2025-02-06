import { useCallback, useEffect } from "react";
import { useAuth } from "@/components/context/auth-provider";
import { usePostInteractions as usePostInteractionsContext } from "@/components/context/post-interactions-provider";
import type { AppBskyFeedDefs } from "@atproto/api";

export function usePostInteractions(post: AppBskyFeedDefs.FeedViewPost) {
  const { agent } = useAuth();
  const { getInteraction, updateInteraction } = usePostInteractionsContext();

  const interaction = getInteraction(post.post.uri);

  useEffect(() => {
    if (!interaction.isInitialized) {
      const viewer = post.post.viewer;
      updateInteraction(post.post.uri, {
        isLiked: !!viewer?.like,
        likeCount: post.post.likeCount || 0,
        likeUri: viewer?.like,
        isReposted: !!viewer?.repost,
        repostCount: post.post.repostCount || 0,
        repostUri: viewer?.repost,
        commentCount: post.post.replyCount || 0,
        hasCommented: false,
        isInitialized: true,
      });
    }
  }, [
    interaction.isInitialized,
    post.post.viewer,
    post.post.likeCount,
    post.post.repostCount,
    post.post.replyCount,
    post.post.uri,
    updateInteraction,
  ]);

  const handleLike = useCallback(async () => {
    if (!agent) return;
    try {
      if (!interaction.isLiked) {
        const response = await agent.like(post.post.uri, post.post.cid);
        updateInteraction(post.post.uri, {
          isLiked: true,
          likeCount: interaction.likeCount + 1,
          likeUri: response.uri,
          isInitialized: true,
        });
      } else if (interaction.likeUri) {
        await agent.deleteLike(interaction.likeUri);
        updateInteraction(post.post.uri, {
          isLiked: false,
          likeCount: interaction.likeCount - 1,
          likeUri: undefined,
          isInitialized: true,
        });
      }
    } catch (error) {
      console.error("Failed to like/unlike:", error);
    }
  }, [agent, interaction, post.post.cid, post.post.uri, updateInteraction]);

  const handleRepost = useCallback(async () => {
    if (!agent) return;
    try {
      if (!interaction.isReposted) {
        const response = await agent.repost(post.post.uri, post.post.cid);
        updateInteraction(post.post.uri, {
          isReposted: true,
          repostCount: interaction.repostCount + 1,
          repostUri: response.uri,
          isInitialized: true,
        });
      } else if (interaction.repostUri) {
        await agent.deleteRepost(interaction.repostUri);
        updateInteraction(post.post.uri, {
          isReposted: false,
          repostCount: interaction.repostCount - 1,
          repostUri: undefined,
          isInitialized: true,
        });
      }
    } catch (error) {
      console.error("Failed to repost/unrepost:", error);
    }
  }, [agent, interaction, post.post.cid, post.post.uri, updateInteraction]);

  return {
    isLiked: interaction.isLiked,
    likeCount: interaction.likeCount,
    handleLike,
    isReposted: interaction.isReposted,
    repostCount: interaction.repostCount,
    handleRepost,
    commentCount: interaction.commentCount,
    hasCommented: interaction.hasCommented,
  };
}
