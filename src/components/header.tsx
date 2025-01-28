"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  // DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "./auth-provider";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Menu } from "lucide-react";

export function Header() {
  const { isAuthenticated, login, logout, agent } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [handle, setHandle] = useState("");

  useEffect(() => {
    const fetchHandle = async () => {
      if (agent?.session?.did) {
        try {
          const profile = await agent.getProfile({
            actor: agent.session.did,
          });
          if (profile.success) {
            setHandle(profile.data.handle);
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        }
      }
    };

    if (isAuthenticated) {
      fetchHandle();
    } else {
      setHandle("");
    }
  }, [agent, isAuthenticated]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login(identifier, password);
    } catch (error) {
      console.error("Login failed:", error);
    }
    setIsLoading(false);
  };

  const openProfile = () => {
    if (handle) {
      window.open(`https://bsky.app/profile/${handle}`, "_blank");
    }
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-900 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-2xl font-bold">old.bsky</span>
          <nav className="hidden md:flex space-x-1">
            {["hot", "new", "top", "following"].map((item) => (
              <Button
                key={item}
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-zinc-100"
              >
                {item}
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search posts..."
            className="hidden md:block w-64 bg-zinc-800 border-zinc-700"
          />

          {isAuthenticated ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">{handle || "Loading..."}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={openProfile}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(
                        "https://github.com/5brian/old.bsky",
                        "_blank",
                      )
                    }
                  >
                    Source Code
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(
                        "https://github.com/5brian/old.bsky/issues?q=sort%3Aupdated-desc+is%3Aissue+is%3Aopen",
                        "_blank",
                      )
                    }
                  >
                    Issues
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Login</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Login to Bluesky</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="identifier">Handle or Email</Label>
                      <Input
                        id="identifier"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={handleLogin} disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(
                        "https://github.com/5brian/old.bsky",
                        "_blank",
                      )
                    }
                  >
                    Source Code
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(
                        "https://github.com/5brian/old.bsky/issues?q=sort%3Aupdated-desc+is%3Aissue+is%3Aopen",
                        "_blank",
                      )
                    }
                  >
                    Issues
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
