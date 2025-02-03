import { useState, useCallback } from "react";
import { useAuth } from "@/components/context/auth-provider";
import type { AppBskyFeedDefs } from "@atproto/api";

export function usePostInteractions(post: AppBskyFeedDefs.FeedViewPost) {
  const { agent } = useAuth();
  const viewer = post.post.viewer;

  const [isLiked, setIsLiked] = useState(!!viewer?.like);
  const [likeCount, setLikeCount] = useState(post.post.likeCount || 0);
  const [likeUri, setLikeUri] = useState<string | undefined>(viewer?.like);

  const [isReposted, setIsReposted] = useState(!!viewer?.repost);
  const [repostCount, setRepostCount] = useState(post.post.repostCount || 0);
  const [repostUri, setRepostUri] = useState<string | undefined>(
    viewer?.repost,
  );

  const handleLike = useCallback(async () => {
    if (!agent) return;
    try {
      if (!isLiked) {
        const response = await agent.like(post.post.uri, post.post.cid);
        setLikeUri(response.uri);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      } else if (likeUri) {
        await agent.deleteLike(likeUri);
        setLikeUri(undefined);
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Failed to like/unlike:", error);
    }
  }, [agent, isLiked, likeUri, post.post.cid, post.post.uri]);

  const handleRepost = useCallback(async () => {
    if (!agent) return;
    try {
      if (!isReposted) {
        const response = await agent.repost(post.post.uri, post.post.cid);
        setRepostUri(response.uri);
        setIsReposted(true);
        setRepostCount((prev) => prev + 1);
      } else if (repostUri) {
        await agent.deleteRepost(repostUri);
        setRepostUri(undefined);
        setIsReposted(false);
        setRepostCount((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Failed to repost/unrepost:", error);
    }
  }, [agent, isReposted, repostUri, post.post.cid, post.post.uri]);

  return {
    isLiked,
    likeCount,
    handleLike,
    isReposted,
    repostCount,
    handleRepost,
  };
}
