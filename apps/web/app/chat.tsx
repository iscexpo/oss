"use client";

import type { ChatUIMessage } from "@/components/chat/types";
import { MessageCircleIcon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Input } from "@/components/ui/input";
import { Message } from "@/components/chat/message";
import { ModelSelector } from "@/components/settings/model-selector";
import { Panel, PanelHeader } from "@/components/panels/panels";
import { Settings } from "@/components/settings/settings";
import { useChat } from "@ai-sdk/react";
import { useLocalStorageValue } from "@/lib/use-local-storage-value";
import { useCallback, useEffect } from "react";
import { useSharedChatContext } from "@/lib/chat-context";
import { useSettings } from "@/components/settings/use-settings";
import { useSandboxStore } from "./state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Rocket } from "lucide-react";

interface Props {
  className: string;
}

export function Chat({ className }: Props) {
  const [input, setInput] = useLocalStorageValue("prompt-input");
  const { chat } = useSharedChatContext();
  const { modelId, reasoningEffort } = useSettings();
  const { messages, sendMessage, status } = useChat<ChatUIMessage>({ chat });
  const { setChatStatus } = useSandboxStore();

  const validateAndSubmitMessage = useCallback(
    (text: string) => {
      if (text.trim()) {
        sendMessage({ text }, { body: { modelId, reasoningEffort } });
        setInput("");
      }
    },
    [sendMessage, modelId, setInput, reasoningEffort],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      validateAndSubmitMessage(input);
    },
    [validateAndSubmitMessage],
  );

  useEffect(() => {
    setChatStatus(status);
  }, [status, setChatStatus]);

  const isEmpty = messages.length === 0;

  return (
    <Panel className={className}>
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center overflow-auto p-6">
          <div className="w-full max-w-xl">
            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-8 text-center">
              What do you want to create?
            </h1>

            <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Model
                </label>
                <ModelSelector />
              </div>

              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Project
                </label>
                <Select>
                  <SelectTrigger className="bg-background border-border text-sm w-full">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="my-project">my-project</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <textarea
                    className="w-full min-h-[120px] rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground p-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                    placeholder="Describe what you want to build..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Powered by AI
                  </span>
                  <Button type="submit" disabled={!input.trim()} className="gap-2">
                    <Rocket className="w-4 h-4" />
                    Generate
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <>
          <PanelHeader>
            <div className="flex items-center font-mono font-semibold uppercase">
              <MessageCircleIcon className="mr-2 w-4" />
              Chat
            </div>
            <div className="ml-auto font-mono text-xs opacity-50">[{status}]</div>
          </PanelHeader>

          <Conversation className="relative w-full">
            <ConversationContent className="space-y-4">
              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <form
            className="flex items-center p-2 space-x-1 border-t border-primary/18 bg-background"
            onSubmit={async (event) => {
              event.preventDefault();
              validateAndSubmitMessage(input);
            }}
          >
            <Settings />
            <ModelSelector />
            <Input
              className="w-full font-mono text-sm rounded-sm border-0 bg-background"
              disabled={status === "streaming" || status === "submitted"}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              value={input}
            />
            <Button type="submit" disabled={status !== "ready" || !input.trim()}>
              <SendIcon className="w-4 h-4" />
            </Button>
          </form>
        </>
      )}
    </Panel>
  );
}
