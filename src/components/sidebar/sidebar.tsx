"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useAuth } from "@/components/context/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Sidebar() {
  const { agent, isAuthenticated } = useAuth();
  const [isPosting, setIsPosting] = useState(false);
  const [postText, setPostText] = useState("");

  const handlePost = async () => {
    if (!agent || !postText.trim()) return;

    setIsPosting(true);
    try {
      await agent.post({
        text: postText,
      });
      setPostText("");
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-800 border-zinc-700 p-4">
        <Input
          placeholder="Search posts..."
          className="mb-4 bg-zinc-700 border-zinc-600"
        />
        <div className="space-y-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full" disabled={!isAuthenticated}>
                Create New Post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Textarea
                  placeholder="What's on your mind?"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button
                  onClick={handlePost}
                  disabled={isPosting || !postText.trim()}
                  className="w-full"
                >
                  {isPosting ? "Posting..." : "Post"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {!isAuthenticated && (
        <Card className="bg-zinc-800 border-zinc-700 p-4">
          <h3 className="font-semibold mb-2">Welcome to old.bsky</h3>
          <p className="text-sm text-zinc-400 mb-4">
            Login to view your Bluesky feed and interact with posts.
          </p>
        </Card>
      )}
    </div>
  );
}
