"use client";

import type { ChatUIMessage } from "@/components/chat/types";
import { TEST_PROMPTS } from "@/ai/constants";
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

interface Props {
  className: string;
  modelId?: string;
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

  useEffect(() => {
    setChatStatus(status);
  }, [status, setChatStatus]);

  return (
    <Panel className={className}>
      <PanelHeader>
        <div className="flex items-center font-mono font-semibold uppercase">
          <MessageCircleIcon className="mr-2 w-4" />
          Chat
        </div>
        <div className="ml-auto font-mono text-xs opacity-50">[{status}]</div>
      </PanelHeader>

      {/* Messages Area */}
      {messages.length === 0 ? (
        <div className="flex-1 min-h-0">
          <div className="flex flex-col items-center justify-center h-full gap-2 px-4 font-mono text-sm text-muted-foreground">
            <p className="font-semibold text-center">Click and try one of these prompts:</p>
            <ul className="flex flex-col w-full max-w-xl gap-1 text-center">
              {TEST_PROMPTS.map((prompt, idx) => (
                <li
                  key={idx}
                  role="button"
                  tabIndex={0}
                  className="w-full px-4 py-2 border border-dashed rounded-sm shadow-sm cursor-pointer border-border bg-background/50 transition-colors hover:bg-secondary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => validateAndSubmitMessage(prompt)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      validateAndSubmitMessage(prompt);
                    }
                  }}
                >
                  {prompt}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <Conversation className="relative w-full">
          <ConversationContent className="space-y-4">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      )}

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
    </Panel>
  );
}
