"use client";

import type { ChatUIMessage } from "@/components/chat/types";
import { ArrowUp, MessageCircle, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Input } from "@/components/ui/input";
import { Message } from "@/components/chat/message";
import { ModelSelector } from "@/components/settings/model-selector";
import { Panel } from "@/components/panels/panels";
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
import { cn } from "@/lib/utils";

interface Props {
  className: string;
}

export function Chat({ className }: Props) {
  const [input, setInput] = useLocalStorageValue("prompt-input");
  const [project, setProject] = useLocalStorageValue("prompt-project");
  const { transport } = useSharedChatContext();
  const { modelId, reasoningEffort } = useSettings();
  const { messages, sendMessage, status } = useChat<ChatUIMessage>({ transport });
  const { setChatStatus } = useSandboxStore();
  const isBusy = status === "streaming" || status === "submitted";
  const canSubmit = input.trim().length > 0 && !isBusy;

  const validateAndSubmitMessage = useCallback(
    (text: string) => {
      if (text.trim() && !isBusy) {
        sendMessage({ text }, { body: { modelId, reasoningEffort } });
        setInput("");
      }
    },
    [sendMessage, modelId, setInput, reasoningEffort, isBusy],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      validateAndSubmitMessage(input);
    },
    [input, validateAndSubmitMessage],
  );

  useEffect(() => {
    setChatStatus(status);
  }, [status, setChatStatus]);

  const isEmpty = messages.length === 0;

  return (
    <Panel className={cn("bg-black text-zinc-200", className)}>
      {isEmpty ? (
        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-5 py-8">
          <div className="mx-auto w-full max-w-xl">
            <h1 className="mb-7 text-center text-[32px] font-semibold tracking-[-0.02em] text-zinc-50">
              What do you want to create?
            </h1>

            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-[#2b2b2b] bg-[#111111] shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
            >
              <label className="sr-only" htmlFor="new-prompt">
                Describe what you want to build
              </label>
              <textarea
                id="new-prompt"
                className="min-h-[104px] w-full resize-none bg-transparent px-4 pt-4 text-[15px] leading-6 text-zinc-100 outline-none placeholder:text-zinc-600"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    validateAndSubmitMessage(input);
                  }
                }}
                placeholder="Describe what you want to build..."
                value={input}
              />
              <div className="flex items-center gap-1 px-2 pb-2">
                <Button
                  aria-label="Add attachment"
                  className="size-8 shrink-0 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Plus className="size-4" aria-hidden="true" />
                </Button>
                <div className="min-w-0 [&_[data-slot=select-trigger]]:h-8 [&_[data-slot=select-trigger]]:border-transparent [&_[data-slot=select-trigger]]:bg-transparent [&_[data-slot=select-trigger]]:px-1.5 [&_[data-slot=select-trigger]]:text-[13px] [&_[data-slot=select-trigger]]:text-zinc-300 [&_[data-slot=select-trigger]]:shadow-none hover:[&_[data-slot=select-trigger]]:bg-white/5">
                  <ModelSelector className="border-transparent" />
                </div>
                <div className="ml-auto flex min-w-0 items-center gap-1">
                  <label className="sr-only" htmlFor="new-prompt-project">
                    Project
                  </label>
                  <Select
                    onValueChange={setProject}
                    value={project === "" ? "my-project" : project}
                  >
                    <SelectTrigger
                      id="new-prompt-project"
                      className="h-8 max-w-28 border-transparent bg-transparent px-1.5 text-[13px] text-zinc-400 shadow-none hover:bg-white/5 hover:text-zinc-200"
                    >
                      <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="my-project">my-project</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    aria-label="Create with prompt"
                    className="size-8 shrink-0 rounded-md bg-zinc-100 text-black hover:bg-white disabled:bg-[#2a2a2a] disabled:text-zinc-600"
                    disabled={!canSubmit}
                    size="icon"
                    type="submit"
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col bg-black">
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[#242424] px-3 text-xs">
            <MessageCircle className="size-3.5 text-zinc-500" aria-hidden="true" />
            <span className="font-medium tracking-wide text-zinc-300 uppercase">Chat</span>
            <span className="ml-auto rounded border border-[#2a2a2a] bg-[#111111] px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 uppercase">
              {status}
            </span>
          </div>

          <Conversation className="relative min-h-0 w-full flex-1 bg-black">
            <ConversationContent className="mx-auto w-full max-w-[760px] space-y-4 px-4 py-4">
              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <form
            className="shrink-0 border-t border-[#242424] bg-black p-2.5"
            onSubmit={handleSubmit}
          >
            <div className="rounded-xl border border-[#2b2b2b] bg-[#111111] px-2 pt-2 pb-2">
              <Input
                aria-label="Ask a follow-up"
                className="h-9 border-0 bg-transparent px-2 text-sm text-zinc-100 shadow-none placeholder:text-zinc-600 focus-visible:ring-0"
                disabled={isBusy}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask a follow-up..."
                value={input}
              />
              <div className="mt-1 flex items-center gap-1">
                <Settings />
                <div className="min-w-0 [&_[data-slot=select-trigger]]:h-7 [&_[data-slot=select-trigger]]:border-transparent [&_[data-slot=select-trigger]]:bg-transparent [&_[data-slot=select-trigger]]:px-1.5 [&_[data-slot=select-trigger]]:text-xs [&_[data-slot=select-trigger]]:text-zinc-400 [&_[data-slot=select-trigger]]:shadow-none hover:[&_[data-slot=select-trigger]]:bg-white/5">
                  <ModelSelector className="border-transparent" />
                </div>
                <Button
                  aria-label="Send follow-up"
                  className="ml-auto size-7 shrink-0 rounded-md bg-zinc-100 text-black hover:bg-white disabled:bg-[#2a2a2a] disabled:text-zinc-600"
                  disabled={status !== "ready" || !input.trim()}
                  size="icon"
                  type="submit"
                >
                  <Send className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </Panel>
  );
}
