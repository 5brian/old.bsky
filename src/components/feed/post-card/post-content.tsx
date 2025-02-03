import type { AppBskyFeedDefs } from "@atproto/api";
import { Button } from "@/components/ui/button";
import { usePostTypes } from "@/components/feed/post-card/use-post-types";
import { useRichText } from "@/hooks/use-rich-text";

interface PostContentProps {
  post: AppBskyFeedDefs.FeedViewPost;
}

export function PostContent({ post }: PostContentProps) {
  const postTypes = usePostTypes(post);
  const richTextElements = useRichText(post);

  return (
    <div className="text-base mb-3">
      {richTextElements}{" "}
      {postTypes.map((typeInfo, index) => (
        <Button
          key={`type-${index}`}
          variant="ghost"
          className="inline-flex items-center rounded-full bg-zinc-700/50 px-2 py-0.5 text-xs font-medium text-zinc-300 hover:bg-zinc-600/50 ml-1 h-auto"
          onClick={() => typeInfo.url && window.open(typeInfo.url, "_blank")}
        >
          {typeInfo.type}
        </Button>
      ))}
    </div>
  );
}
