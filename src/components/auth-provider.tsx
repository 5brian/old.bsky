"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  type AtpSessionData,
  type AtpSessionEvent,
  type AppBskyFeedPost,
  RichText,
} from "@atproto/api";
import { AtpAgent } from "@atproto/api";

interface AuthContextType {
  agent: AtpAgent | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createPost: (text: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  agent: null,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  createPost: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [agent, setAgent] = useState<AtpAgent | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const createAgent = () => {
    return new AtpAgent({
      service: "https://bsky.social",
      persistSession: (evt: AtpSessionEvent, sess?: AtpSessionData) => {
        if (evt === "create" || evt === "update") {
          if (sess) {
            localStorage.setItem("atp-session", JSON.stringify(sess));
          }
        } else if (evt === "expired" || evt === "create-failed") {
          localStorage.removeItem("atp-session");
        }
      },
    });
  };

  useEffect(() => {
    const savedSession = localStorage.getItem("atp-session");
    if (savedSession) {
      const session = JSON.parse(savedSession) as AtpSessionData;
      const newAgent = createAgent();

      newAgent
        .resumeSession(session)
        .then(() => {
          setAgent(newAgent);
          setIsAuthenticated(true);
        })
        .catch((error) => {
          console.error("Failed to resume session:", error);
          localStorage.removeItem("atp-session");
        });
    }
  }, [createAgent]);

  const login = async (identifier: string, password: string) => {
    const newAgent = createAgent();

    try {
      await newAgent.login({ identifier, password });
      setAgent(newAgent);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    if (agent) {
      try {
        await agent.api.com.atproto.server.deleteSession();
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }
    localStorage.removeItem("atp-session");
    setAgent(null);
    setIsAuthenticated(false);
  };

  const createPost = async (text: string) => {
    if (!agent) throw new Error("Not authenticated");

    const richText = new RichText({ text });
    await richText.detectFacets(agent);

    const postRecord: AppBskyFeedPost.Record = {
      text: richText.text,
      facets: richText.facets,
      createdAt: new Date().toISOString(),
    };

    await agent.api.app.bsky.feed.post.create(
      { did: agent.session?.did },
      postRecord,
    );
  };

  return (
    <AuthContext.Provider
      value={{ agent, isAuthenticated, login, logout, createPost }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
