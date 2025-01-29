import type { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import { Button } from "../ui/button";
import React from "react";

export function useRichText(post: AppBskyFeedDefs.FeedViewPost) {
  const record = post.post.record as AppBskyFeedPost.Record;
  const text = record.text;
  const facets = record.facets || [];

  if (!facets.length) {
    return text;
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const byteToStringIndex = (byteIndex: number): number => {
    const bytes = encoder.encode(text);
    const slice = decoder.decode(bytes.slice(0, byteIndex));
    return slice.length;
  };

  const sortedFacets = [...facets].sort(
    (a, b) => a.index.byteStart - b.index.byteStart,
  );

  let lastIndex = 0;
  const elements: React.ReactNode[] = [];

  sortedFacets.forEach((facet, idx) => {
    const startIndex = byteToStringIndex(facet.index.byteStart);
    const endIndex = byteToStringIndex(facet.index.byteEnd);

    if (startIndex > lastIndex) {
      elements.push(text.slice(lastIndex, startIndex));
    }

    if (
      facet.features.some((f) => f.$type === "app.bsky.richtext.facet#mention")
    ) {
      const mention = facet.features.find(
        (f) => f.$type === "app.bsky.richtext.facet#mention",
      ) as { did: string } | undefined;

      if (mention) {
        elements.push(
          <Button
            key={`mention-${idx}`}
            variant="link"
            className="h-auto p-0 text-base text-blue-400 hover:text-blue-300 font-normal"
            onClick={() =>
              window.open(`https://bsky.app/profile/${mention.did}`, "_blank")
            }
          >
            {text.slice(startIndex, endIndex)}
          </Button>,
        );
      }
    } else if (
      facet.features.some((f) => f.$type === "app.bsky.richtext.facet#link")
    ) {
      const link = facet.features.find(
        (f) => f.$type === "app.bsky.richtext.facet#link",
      ) as { uri: string } | undefined;

      if (link) {
        elements.push(
          <Button
            key={`link-${idx}`}
            variant="link"
            className="h-auto p-0 text-base text-blue-400 hover:text-blue-300 font-normal"
            onClick={() => window.open(link.uri, "_blank")}
          >
            {text.slice(startIndex, endIndex)}
          </Button>,
        );
      }
    } else {
      elements.push(text.slice(startIndex, endIndex));
    }

    lastIndex = endIndex;
  });

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}
