"use client";

import type { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import { RichText } from "@atproto/api";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useAuth } from "./auth-provider";
import { useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { cn } from "@/lib/utils";

const BSKY_WEB_URL = "https://bsky.app";

interface PostCardProps {
  post: AppBskyFeedDefs.FeedViewPost;
}

type EmbedViewRecord = {
  $type: string;
  record: {
    author: {
      handle: string;
    };
  };
};

export function PostCard({ post }: PostCardProps) {
  const { agent } = useAuth();
  const viewer = post.post.viewer as AppBskyFeedDefs.ViewerState | undefined;
  const [isLiked, setIsLiked] = useState(viewer?.like !== undefined);
  const [isReposted, setIsReposted] = useState(viewer?.repost !== undefined);
  const [likeCount, setLikeCount] = useState(post.post.likeCount || 0);
  const [repostCount, setRepostCount] = useState(post.post.repostCount || 0);
  const [likeUri, setLikeUri] = useState<string | undefined>(viewer?.like);
  const [repostUri, setRepostUri] = useState<string | undefined>(
    viewer?.repost,
  );
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentPosted, setCommentPosted] = useState(false);
  const [commentCount, setCommentCount] = useState(post.post.replyCount || 0);
  const [hasCommented, setHasCommented] = useState(false);

  const handleLike = async () => {
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
  };

  const handleRepost = async () => {
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
  };

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
      setCommentCount((prev) => prev + 1);
      setCommentPosted(true);
      setHasCommented(true);
      setShowCommentBox(false);
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setIsCommenting(false);
    }
  };

  const getPostUrl = () => {
    const handle = post.post.author.handle;
    const rkey = post.post.uri.split("/").pop();
    return `${BSKY_WEB_URL}/profile/${handle}/post/${rkey}`;
  };

  const getProfileUrl = (handle: string) => {
    return `${BSKY_WEB_URL}/profile/${handle}`;
  };

  const renderPostText = () => {
    const postRecord = post.post.record as AppBskyFeedPost.Record;
    const text = postRecord.text;
    const facets = postRecord.facets || [];

    if (!facets.length) {
      return (
        <>
          {text}{" "}
          {getPostTypes().map((typeInfo, index) => (
            <Button
              key={index}
              variant="ghost"
              className="inline-flex items-center rounded-full bg-zinc-700/50 px-2 py-0.5 text-xs font-medium text-zinc-300 hover:bg-zinc-600/50 ml-1 h-auto"
              onClick={() =>
                typeInfo.url && window.open(typeInfo.url, "_blank")
              }
            >
              {typeInfo.type}
            </Button>
          ))}
        </>
      );
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
        facet.features.some(
          (f) => f.$type === "app.bsky.richtext.facet#mention",
        )
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
                window.open(`${BSKY_WEB_URL}/profile/${mention.did}`, "_blank")
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

    elements.push(" ");
    getPostTypes().forEach((typeInfo, index) => {
      elements.push(
        <Button
          key={`type-${index}`}
          variant="ghost"
          className="inline-flex items-center rounded-full bg-zinc-700/50 px-2 py-0.5 text-xs font-medium text-zinc-300 hover:bg-zinc-600/50 ml-1 h-auto"
          onClick={() => typeInfo.url && window.open(typeInfo.url, "_blank")}
        >
          {typeInfo.type}
        </Button>,
      );
    });

    return elements;
  };

  const getPostTypes = () => {
    const record = post.post.record as AppBskyFeedPost.Record;
    const types: Array<{ type: string; url?: string }> = [];

    const hasEmbedType = (type: string) => {
      return (
        record.embed && "$type" in record.embed && record.embed.$type === type
      );
    };

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
          url: `${BSKY_WEB_URL}/profile/${quoteAuthor}/post/${rkey}`,
        });
      }
    }

    if (hasEmbedType("app.bsky.embed.images")) {
      types.push({
        type: "image",
        url: getPostUrl(),
      });
    }

    if (hasEmbedType("app.bsky.embed.video")) {
      types.push({
        type: "video",
        url: getPostUrl(),
      });
    }

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

    if (hasEmbedType("app.bsky.embed.external")) {
      const external = (record.embed as { external?: { uri: string } })
        .external;
      if (external?.uri) {
        if (!types.some((t) => t.type === "video")) {
          if (external.uri.match(/youtube\.com|youtu\.be|vimeo\.com/i)) {
            types.push({
              type: "video embed",
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
    }

    return types;
  };

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <div className="flex">
        <div className="flex flex-col items-center p-2 text-zinc-400">
          <Button
            variant="ghost"
            size="sm"
            className={`p-0 ${isLiked ? "text-orange-500" : ""}`}
            onClick={handleLike}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium">{likeCount}</span>
          <Button variant="ghost" size="sm" className="p-0">
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 p-4">
          <div className="text-base mb-3">{renderPostText()}</div>

          <div className="text-sm text-zinc-400">
            submitted{" "}
            {formatDistanceToNowStrict(new Date(post.post.indexedAt), {
              addSuffix: true,
            })}{" "}
            by{" "}
            <Button
              variant="link"
              className="h-auto p-0 text-zinc-300 hover:text-zinc-100"
              onClick={() =>
                window.open(getProfileUrl(post.post.author.handle), "_blank")
              }
            >
              {post.post.author.handle}
            </Button>
            {post.post.embed &&
              "$type" in post.post.embed &&
              post.post.embed.$type === "app.bsky.embed.record#view" &&
              (post.post.embed as EmbedViewRecord).record?.author?.handle &&
              post.post.author.handle !==
                (post.post.embed as EmbedViewRecord).record.author.handle && (
                <>
                  {" and "}
                  <Button
                    variant="link"
                    className="h-auto p-0 text-zinc-300 hover:text-zinc-100"
                    onClick={() =>
                      window.open(
                        getProfileUrl(
                          (post.post.embed as EmbedViewRecord).record.author
                            .handle,
                        ),
                        "_blank",
                      )
                    }
                  >
                    {(post.post.embed as EmbedViewRecord).record.author.handle}
                  </Button>
                </>
              )}
          </div>

          <div className="flex space-x-4 text-zinc-400 text-sm mt-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-0 text-sm hover:text-zinc-300 hover:underline",
                (hasCommented || commentPosted) &&
                  "text-blue-500 hover:text-blue-400",
              )}
              onClick={() => {
                setShowCommentBox(!showCommentBox);
                if (!showCommentBox) {
                  setCommentPosted(false);
                }
              }}
            >
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`p-0 text-sm hover:text-zinc-300 hover:underline ${
                isReposted ? "text-green-500" : ""
              }`}
              onClick={handleRepost}
            >
              {repostCount} {repostCount === 1 ? "repost" : "reposts"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 text-sm hover:text-zinc-300 hover:underline"
              onClick={() => window.open(getPostUrl(), "_blank")}
            >
              source
            </Button>
          </div>

          {showCommentBox && (
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
                    setShowCommentBox(false);
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
                    hasCommented && "bg-blue-500 hover:bg-blue-600",
                    commentPosted && "bg-blue-500 hover:bg-blue-600",
                  )}
                >
                  {isCommenting ? "Posting..." : "Comment"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
