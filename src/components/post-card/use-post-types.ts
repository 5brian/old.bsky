import type { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";

interface PostType {
  type: string;
  url?: string;
}

export function usePostTypes(post: AppBskyFeedDefs.FeedViewPost) {
  const record = post.post.record as AppBskyFeedPost.Record;
  const types: PostType[] = [];

  const hasEmbedType = (type: string) => {
    return (
      record.embed && "$type" in record.embed && record.embed.$type === type
    );
  };

  // Handle quote posts
  if (hasEmbedType("app.bsky.embed.record")) {
    const embed = record.embed as {
      record: { uri: string };
      $type: string;
    };
    const parts = embed.record.uri.split("/");
    const rkey = parts.pop();

    const quoteEmbed = post.post.embed as {
      record?: {
        author?: {
          handle: string;
        };
      };
    };

    if (quoteEmbed?.record?.author?.handle) {
      const quoteAuthor = quoteEmbed.record.author.handle;
      types.push({
        type: "quote",
        url: `https://bsky.app/profile/${quoteAuthor}/post/${rkey}`,
      });
    }
  }

  // Handle images
  if (hasEmbedType("app.bsky.embed.images")) {
    types.push({
      type: "image",
      url: getPostUrl(post),
    });
  }

  // Handle videos
  if (hasEmbedType("app.bsky.embed.video")) {
    types.push({
      type: "video",
      url: getPostUrl(post),
    });
  }

  // Handle links
  const linkFacet = record.facets?.find((facet) =>
    facet.features.some((f) => f.$type === "app.bsky.richtext.facet#link"),
  );
  if (linkFacet) {
    const link = linkFacet.features.find(
      (f) => f.$type === "app.bsky.richtext.facet#link",
    ) as { uri: string } | undefined;
    if (link) {
      types.push({
        type: "link",
        url: link.uri,
      });
    }
  }

  // Handle embeds
  if (hasEmbedType("app.bsky.embed.external")) {
    const external = (record.embed as { external?: { uri: string } }).external;
    if (external?.uri) {
      if (external.uri.match(/youtube\.com|youtu\.be/i)) {
        types.push({
          type: "youtube",
          url: external.uri,
        });
      } else if (external.uri.match(/spotify\.com/i)) {
        types.push({
          type: "spotify",
          url: external.uri,
        });
      } else {
        types.push({
          type: "embed",
          url: external.uri,
        });
      }
    }
  }

  return types;
}

function getPostUrl(post: AppBskyFeedDefs.FeedViewPost) {
  const handle = post.post.author.handle;
  const rkey = post.post.uri.split("/").pop();
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}
