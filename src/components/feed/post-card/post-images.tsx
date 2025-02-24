import type { AppBskyFeedDefs, AppBskyEmbedImages } from "@atproto/api";
import Image from "next/image";

interface PostImagesProps {
  post: AppBskyFeedDefs.FeedViewPost;
}

export function PostImages({ post }: PostImagesProps) {
  if (!post.post.embed) return null;
  
  const embed = post.post.embed as { $type: string; images?: AppBskyEmbedImages.ViewImage[] };
  
  if (embed.$type !== "app.bsky.embed.images#view" || !embed.images?.length) {
    return null;
  }
  
  return (
    <div className="mt-2 overflow-hidden rounded-md">
      <div className={`grid gap-1 ${embed.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {embed.images.map((image, index) => (
          <div 
            key={`img-${index}`} 
            className="relative overflow-hidden rounded-md border border-zinc-700"
            style={{ aspectRatio: "16/9" }}
          >
            <Image
              src={image.fullsize}
              alt={image.alt || "Post image"}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
} 