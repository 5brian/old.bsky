"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface PostInteraction {
  isLiked: boolean;
  likeCount: number;
  likeUri?: string;
  isReposted: boolean;
  repostCount: number;
  repostUri?: string;
  commentCount: number;
  hasCommented: boolean;
  isInitialized: boolean;
}

interface PostInteractionsContextType {
  interactions: Map<string, PostInteraction>;
  updateInteraction: (
    postUri: string,
    updates: Partial<PostInteraction>,
  ) => void;
  getInteraction: (postUri: string) => PostInteraction;
}

const PostInteractionsContext = createContext<PostInteractionsContextType>({
  interactions: new Map(),
  updateInteraction: () => {},
  getInteraction: () => ({
    isLiked: false,
    likeCount: 0,
    isReposted: false,
    repostCount: 0,
    commentCount: 0,
    hasCommented: false,
    isInitialized: false,
  }),
});

export function PostInteractionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [interactions, setInteractions] = useState<
    Map<string, PostInteraction>
  >(new Map());

  const updateInteraction = useCallback(
    (postUri: string, updates: Partial<PostInteraction>) => {
      setInteractions((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(postUri) || {
          isLiked: false,
          likeCount: 0,
          isReposted: false,
          repostCount: 0,
          commentCount: 0,
          hasCommented: false,
          isInitialized: false,
        };
        newMap.set(postUri, { ...current, ...updates });
        return newMap;
      });
    },
    [],
  );

  const getInteraction = useCallback(
    (postUri: string) => {
      return (
        interactions.get(postUri) || {
          isLiked: false,
          likeCount: 0,
          isReposted: false,
          repostCount: 0,
          commentCount: 0,
          hasCommented: false,
          isInitialized: false,
        }
      );
    },
    [interactions],
  );

  return (
    <PostInteractionsContext.Provider
      value={{ interactions, updateInteraction, getInteraction }}
    >
      {children}
    </PostInteractionsContext.Provider>
  );
}

export const usePostInteractions = () => useContext(PostInteractionsContext);
