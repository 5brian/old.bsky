import type { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";

export function isReplyRecord(
  record: unknown,
): record is AppBskyFeedPost.Record {
  if (!record || typeof record !== "object") return false;
  const maybeReply = record as { reply?: { parent?: { uri?: string } } };
  return (
    "reply" in maybeReply && typeof maybeReply.reply?.parent?.uri === "string"
  );
}

export function getPostUrl(post: AppBskyFeedDefs.FeedViewPost): string {
  const handle = post.post.author.handle;
  const rkey = post.post.uri.split("/").pop();
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}

export function getProfileUrl(handle: string): string {
  return `https://bsky.app/profile/${handle}`;
}

export function sortRepliesByLikes<T extends { post: { likeCount?: number } }>(
  replies: T[],
): T[] {
  return [...replies].sort(
    (a, b) => (b.post.likeCount || 0) - (a.post.likeCount || 0),
  );
}
