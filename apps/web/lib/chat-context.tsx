"use client";

import { type ReactNode } from "react";
import { DefaultChatTransport } from "ai";
import type { ChatUIMessage } from "@/components/chat/types";
import { createContext, useContext, useMemo } from "react";

interface ChatContextValue {
  transport: DefaultChatTransport<ChatUIMessage>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const transport = useMemo(
    () => new DefaultChatTransport<ChatUIMessage>({ api: "/api/chat" }),
    [],
  );

  return <ChatContext.Provider value={{ transport }}>{children}</ChatContext.Provider>;
}

export function useSharedChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useSharedChatContext must be used within a ChatProvider");
  }
  return context;
}
