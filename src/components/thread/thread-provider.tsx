"use client";

import { createContext, useContext, useState } from "react";
import type { AppBskyFeedDefs } from "@atproto/api";

interface ThreadContextType {
  activeThread: AppBskyFeedDefs.FeedViewPost | null;
  setActiveThread: (post: AppBskyFeedDefs.FeedViewPost | null) => void;
  isThreadVisible: boolean;
  setThreadVisible: (visible: boolean) => void;
}

const ThreadContext = createContext<ThreadContextType>({
  activeThread: null,
  setActiveThread: () => {},
  isThreadVisible: false,
  setThreadVisible: () => {},
});

export function ThreadProvider({ children }: { children: React.ReactNode }) {
  const [activeThread, setActiveThread] =
    useState<AppBskyFeedDefs.FeedViewPost | null>(null);
  const [isThreadVisible, setThreadVisible] = useState(false);

  return (
    <ThreadContext.Provider
      value={{
        activeThread,
        setActiveThread,
        isThreadVisible,
        setThreadVisible,
      }}
    >
      {children}
    </ThreadContext.Provider>
  );
}

export const useThread = () => useContext(ThreadContext);
