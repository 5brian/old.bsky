"use client";

import { Feed } from "@/components/feed/feed";
import { Sidebar } from "@/components/sidebar";
import { useThread } from "@/components/thread/thread-provider";
import { cn } from "@/lib/utils";

export default function Home() {
  const { isThreadVisible } = useThread();

  return (
    <main
      className={cn(
        "container mx-auto grid grid-cols-1 gap-4 p-4 md:grid-cols-4",
        isThreadVisible && "mr-[400px]",
      )}
    >
      <div className="md:col-span-3">
        <Feed />
      </div>
      <div className="md:col-span-1">
        <Sidebar />
      </div>
    </main>
  );
}
