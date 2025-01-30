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
import { useAuth } from "@/components/auth/auth-provider";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Menu, Code, CircleDot, LogOut, User } from "lucide-react";
import { useFeed } from "@/components/feed/feed-provider";

const FEED_TYPES = [
  { label: "following", value: "following" },
  { label: "discovery", value: "discovery" },
] as const;

export function Header() {
  const { isAuthenticated, login, logout, agent } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [handle, setHandle] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const { feedType, setFeedType } = useFeed();

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
    setLoginError(null);

    const appPasswordRegex =
      /^[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}$/;
    if (!appPasswordRegex.test(appPassword)) {
      setLoginError(
        "This appears to be a regular password, please use an app password instead.",
      );
      setIsLoading(false);
      return;
    }

    try {
      await login(identifier, appPassword);
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError(
        "Login failed. Please check your credentials and try again.",
      );
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
          <nav className="hidden md:flex space-x-4">
            {FEED_TYPES.map((item) => (
              <button
                key={item.value}
                className={`px-2 py-1 text-sm transition-colors ${
                  feedType === item.value
                    ? "text-blue-400 font-medium"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
                onClick={() => setFeedType(item.value)}
              >
                {item.label}
              </button>
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
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
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
                    <Code className="mr-2 h-4 w-4" />
                    Code
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(
                        "https://github.com/5brian/old.bsky/issues?q=sort%3Aupdated-desc+is%3Aissue+is%3Aopen",
                        "_blank",
                      )
                    }
                  >
                    <CircleDot className="mr-2 h-4 w-4" />
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
                    <p className="text-sm text-zinc-400 mt-2">
                      For your security, this app requires an app password. You
                      can create one at{" "}
                      <a
                        href="https://bsky.app/settings/app-passwords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        bsky.app/settings/app-passwords
                      </a>
                    </p>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="identifier">Username or Email</Label>
                      <Input
                        id="identifier"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. handle.bsky.social"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="appPassword">App Password</Label>
                      <Input
                        id="appPassword"
                        type="password"
                        value={appPassword}
                        onChange={(e) => setAppPassword(e.target.value)}
                        placeholder="xxxx-xxxx-xxxx-xxxx"
                      />
                    </div>
                    {loginError && (
                      <p className="text-sm text-red-500">{loginError}</p>
                    )}
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
                    <Code className="mr-2 h-4 w-4" />
                    Code
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(
                        "https://github.com/5brian/old.bsky/issues?q=sort%3Aupdated-desc+is%3Aissue+is%3Aopen",
                        "_blank",
                      )
                    }
                  >
                    <CircleDot className="mr-2 h-4 w-4" />
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
