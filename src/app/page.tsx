"use client";

import { Feed } from "@/components/feed/feed";
import { Sidebar } from "@/components/sidebar/sidebar";
import { Thread } from "@/components/thread/thread";
import { useThread } from "@/components/context/thread-provider";

export default function Home() {
  const { isThreadVisible } = useThread();

  return (
    <>
      <div
        className={`flex-1 transition-all duration-200 ${
          isThreadVisible ? "w-1/2" : "w-full"
        } h-[calc(100vh-64px)] overflow-hidden`}
      >
        <main className="container mx-auto h-full overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-4">
            <div
              className={`${isThreadVisible ? "md:col-span-4" : "md:col-span-3"}`}
            >
              <Feed />
            </div>
            {!isThreadVisible && (
              <div className="md:col-span-1">
                <Sidebar />
              </div>
            )}
          </div>
        </main>
      </div>

      {isThreadVisible && (
        <div className="w-1/2 border-l border-zinc-800 h-[calc(100vh-64px)] overflow-hidden">
          <Thread />
        </div>
      )}
    </>
  );
}
