import type { AppBskyFeedDefs } from "@atproto/api";
import { Button } from "../ui/button";
import { formatDistanceToNowStrict } from "date-fns";

interface PostMetaProps {
  post: AppBskyFeedDefs.FeedViewPost;
}

export function PostMeta({ post }: PostMetaProps) {
  const getProfileUrl = (handle: string) =>
    `https://bsky.app/profile/${handle}`;

  const getEmbeddedAuthor = () => {
    if (!post.post.embed) return null;

    const embed = post.post.embed as {
      $type: string;
      record?: {
        author?: {
          handle: string;
        };
      };
    };

    if (
      embed.$type === "app.bsky.embed.record#view" &&
      embed.record?.author?.handle &&
      embed.record.author.handle !== post.post.author.handle
    ) {
      return embed.record.author.handle;
    }

    return null;
  };

  const embeddedAuthor = getEmbeddedAuthor();

  return (
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
      {embeddedAuthor && (
        <>
          {" and "}
          <Button
            variant="link"
            className="h-auto p-0 text-zinc-300 hover:text-zinc-100"
            onClick={() => window.open(getProfileUrl(embeddedAuthor), "_blank")}
          >
            {embeddedAuthor}
          </Button>
        </>
      )}
    </div>
  );
}
