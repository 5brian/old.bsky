import { useState, useCallback, useRef } from "react";
import type { AppBskyFeedDefs } from "@atproto/api";
import { AtpAgent } from "@atproto/api";
import { sortRepliesByLikes } from "@/lib/post";

interface ThreadPost extends AppBskyFeedDefs.ThreadViewPost {
  $type: string;
  replies?: ThreadPost[];
  depth?: number;
}

interface ThreadViewRecord {
  $type: string;
  post: AppBskyFeedDefs.PostView;
  parent?: ThreadPost;
  replies?: ThreadPost[];
}

const POSTS_PER_PAGE = 20;

function isThreadViewPost(post: unknown): post is ThreadPost {
  if (!post || typeof post !== "object") return false;
  const record = post as ThreadViewRecord;
  return (
    record.$type === "app.bsky.feed.defs#threadViewPost" && "post" in record
  );
}

function convertToFeedViewPost(
  post: AppBskyFeedDefs.PostView,
): AppBskyFeedDefs.FeedViewPost {
  return {
    post,
    reason: undefined,
  };
}

export function useThread(agent: AtpAgent | null) {
  const [parentPosts, setParentPosts] = useState<
    AppBskyFeedDefs.FeedViewPost[]
  >([]);
  const [replyPosts, setReplyPosts] = useState<ThreadPost[]>([]);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [collapsedPosts, setCollapsedPosts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const isExpandingReplies = useRef(false);

  const updateRepliesInThread = useCallback(
    (
      posts: ThreadPost[],
      parentUri: string,
      newReplies?: ThreadPost[],
    ): ThreadPost[] => {
      return posts.map((post) => {
        if (post.post.uri === parentUri) {
          return {
            ...post,
            replies: newReplies ? sortRepliesByLikes(newReplies) : undefined,
          };
        }
        if (post.replies) {
          return {
            ...post,
            replies: updateRepliesInThread(post.replies, parentUri, newReplies),
          };
        }
        return post;
      });
    },
    [],
  );

  const assignDepth = useCallback(
    (posts: ThreadPost[], depth = 0): ThreadPost[] => {
      return posts.map((post) => ({
        ...post,
        depth,
        replies: post.replies
          ? assignDepth(post.replies, depth + 1)
          : undefined,
      }));
    },
    [],
  );

  const fetchThreadReplies = useCallback(
    async (uri: string) => {
      if (!agent) return null;
      
      try {
        const response = await agent.getPostThread({ uri });
        
        if (response.success && isThreadViewPost(response.data.thread)) {
          const replies = response.data.thread.replies;
          if (Array.isArray(replies) && replies.every(isThreadViewPost)) {
            return sortRepliesByLikes(replies);
          }
        }
        return null;
      } catch (error) {
        console.error(`Failed to fetch thread replies for ${uri}:`, error);
        return null;
      }
    },
    [agent],
  );

  const autoExpandReplies = useCallback(
    async (initialReplies: ThreadPost[]) => {
      if (!agent || isExpandingReplies.current || !isMounted.current) return;
      
      isExpandingReplies.current = true;
      
      try {
        const replyQueue = [...initialReplies];
        
        while (replyQueue.length > 0 && isMounted.current) {
          const reply = replyQueue.shift();
          
          if (!reply || !reply.replies?.length) continue;
          
          setExpandedPosts((prev) => new Set([...prev, reply.post.uri]));
          
          const newReplies = await fetchThreadReplies(reply.post.uri);
          
          if (newReplies && isMounted.current) {
            setReplyPosts((prevPosts) =>
              updateRepliesInThread(prevPosts, reply.post.uri, newReplies)
            );
            
            replyQueue.push(...newReplies);
            
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      } finally {
        isExpandingReplies.current = false;
      }
    },
    [agent, updateRepliesInThread, fetchThreadReplies],
  );

  const handleExpandReplies = useCallback(
    async (postUri: string) => {
      if (!agent) return;
      
      const newReplies = await fetchThreadReplies(postUri);
      
      if (newReplies && isMounted.current) {
        setExpandedPosts((prev) => new Set([...prev, postUri]));
        setReplyPosts((prevPosts) =>
          updateRepliesInThread(prevPosts, postUri, newReplies)
        );
      } else if (isMounted.current) {
        setError("Failed to load replies");
      }
    },
    [agent, updateRepliesInThread, fetchThreadReplies],
  );

  const toggleReplies = useCallback((postUri: string) => {
    setCollapsedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postUri)) {
        newSet.delete(postUri);
      } else {
        newSet.add(postUri);
      }
      return newSet;
    });
  }, []);

  const loadThread = useCallback(
    async (threadUri: string) => {
      if (!agent) return;

      setIsLoading(true);
      setError(null);
      try {
        const response = await agent.getPostThread({
          uri: threadUri,
        });

        if (response.success && isMounted.current) {
          const thread = response.data.thread;

          if (isThreadViewPost(thread)) {
            const parents: AppBskyFeedDefs.FeedViewPost[] = [];
            let currentParent = thread.parent;
            while (currentParent && isThreadViewPost(currentParent)) {
              parents.unshift(convertToFeedViewPost(currentParent.post));
              currentParent = currentParent.parent;
            }

            const replies = thread.replies || [];
            const processedReplies = assignDepth(sortRepliesByLikes(replies));

            setParentPosts(parents);
            setReplyPosts(processedReplies);
            setCollapsedPosts(new Set());
            setExpandedPosts(new Set());
            setCurrentPage(1);
            
            setIsLoading(false);
            
            autoExpandReplies(processedReplies);
          }
        }
      } catch (error) {
        console.error("Failed to load thread:", error);
        if (isMounted.current) {
          setError("Failed to load thread");
          setIsLoading(false);
        }
      }
    },
    [agent, assignDepth, autoExpandReplies],
  );

  const loadMoreReplies = useCallback(async () => {
    if (isLoading || !agent) return;
    
    const localLoading = true;
    
    try {
      const offset = currentPage * POSTS_PER_PAGE;
      
      const visibleReplies = replyPosts.slice(0, offset);
      const lastVisibleReply = visibleReplies[visibleReplies.length - 1];
      
      if (lastVisibleReply) {
        const moreReplies = await fetchThreadReplies(lastVisibleReply.post.uri);
        
        if (moreReplies && isMounted.current) {
          setReplyPosts(prev => {
            const newPosts = [...prev];
            
            const parentIndex = prev.findIndex(p => p.post.uri === lastVisibleReply.post.uri);
            
            if (parentIndex !== -1 && prev[parentIndex].replies) {
              newPosts[parentIndex] = {
                ...prev[parentIndex],
                replies: [...(prev[parentIndex].replies || []), ...moreReplies]
              };
            } else if (parentIndex !== -1) {
              newPosts[parentIndex] = {
                ...prev[parentIndex],
                replies: moreReplies
              };
            } else {
              newPosts.push(...moreReplies);
            }
            
            return newPosts;
          });
          
          setCurrentPage(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error("Failed to load more replies:", error);
      if (isMounted.current) {
        setError("Failed to load more replies");
      }
    } finally {
      if (isMounted.current && localLoading) {
        setIsLoading(false);
      }
    }
  }, [agent, currentPage, fetchThreadReplies, isLoading, replyPosts]);

  useCallback(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    parentPosts,
    replyPosts,
    expandedPosts,
    collapsedPosts,
    isLoading,
    error,
    currentPage,
    handleExpandReplies,
    toggleReplies,
    loadThread,
    loadMoreReplies,
    POSTS_PER_PAGE,
  };
}
