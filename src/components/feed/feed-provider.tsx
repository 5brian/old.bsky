"use client";

import { createContext, useContext, useState } from "react";

type FeedType = "following" | "discovery";

interface FeedContextType {
  feedType: FeedType;
  setFeedType: (type: FeedType) => void;
}

const FeedContext = createContext<FeedContextType>({
  feedType: "following",
  setFeedType: () => {},
});

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const [feedType, setFeedType] = useState<FeedType>("following");

  return (
    <FeedContext.Provider value={{ feedType, setFeedType }}>
      {children}
    </FeedContext.Provider>
  );
}

export const useFeed = () => useContext(FeedContext);
