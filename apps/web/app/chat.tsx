"use client";

import type { ChatUIMessage } from "@/components/chat/types";
import { TEST_PROMPTS } from "@/ai/constants";
import {
  PaperclipIcon,
  BookOpenIcon,
  FileTextIcon,
  LightbulbIcon,
  MessageCircleIcon,
  NetworkIcon,
  SendIcon,
  Settings2Icon,
  SparklesIcon,
} from "lucide-react";
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
import { useCallback, useEffect, useRef, useState } from "react";
import { useSharedChatContext } from "@/lib/chat-context";
import { useSettings } from "@/components/settings/use-settings";
import { useSandboxStore } from "./state";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const PROMPT_FEATURES = [
  {
    category: "Core prompt engineering",
    items: [
      ["Structure prompting", "Task, scope, constraints, and output format."],
      ["System instructions", "Set roles, personas, and safety boundaries."],
      ["Few-shot examples", "Show input-output pairs for tone and format."],
      ["Clear delimiters", "Separate context from instructions clearly."],
    ],
  },
  {
    category: "Output optimization",
    items: [
      ["Structured JSON", "Enforce predictable JSON for app workflows."],
      ["Prompt variables", "Create reusable templates with {{variables}}."],
      ["Temperature tuning", "Lower for facts and code, higher for ideas."],
      ["Multimodal context", "Attach screenshots, mockups, or documents."],
    ],
  },
  {
    category: "Workflow features",
    items: [
      ["Model comparison", "Compare variants for speed and reasoning depth."],
      ["Google Search grounding", "Use current facts and web citations."],
      ["Code export", "Export prompts as Python, JavaScript, cURL, or Swift."],
    ],
  },
] as const;

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
  const [planMode, setPlanMode] = useState(false);
  const [autoPermission, setAutoPermission] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Suggested prompt features"
              title="Suggested prompt features"
            >
              <LightbulbIcon className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="max-h-[min(32rem,calc(100vh-7rem))] w-80 overflow-y-auto p-3 font-mono">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide">Suggested features</p>
            <div className="grid gap-3">
              {PROMPT_FEATURES.map(({ category, items }) => (
                <section key={category} aria-labelledby={category}>
                  <h3 id={category} className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {category}
                  </h3>
                  <div className="grid gap-1">
                    {items.map(([title, description]) => (
                      <button
                        key={title}
                        type="button"
                        className="rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => setInput(`${title}: ${input}`)}
                      >
                        <span className="block text-xs font-semibold">{title}</span>
                        <span className="block text-[11px] text-muted-foreground">{description}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Enhance prompt"
          title="Enhance prompt"
          disabled={!input.trim() || status !== "ready"}
          onClick={() => setInput(`Improve this prompt: ${input.trim()}`)}
        >
          <SparklesIcon className="w-4 h-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          aria-label="Attach a file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) setInput(`${input}${input ? "\n" : ""}[Attached file: ${file.name}]`);
          }}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label="Composer tools" title="Composer tools">
              <Settings2Icon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-2 font-mono">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide">Composer tools</p>
            <div className="grid gap-1">
              <Button type="button" variant="ghost" className="justify-start gap-2" onClick={() => setPlanMode((value) => !value)} aria-pressed={planMode}>
                <BookOpenIcon className="h-4 w-4" /> Plan mode <span className="ml-auto text-xs text-muted-foreground">{planMode ? "On" : "Off"}</span>
              </Button>
              <Button type="button" variant="ghost" className="justify-start gap-2" onClick={() => setAutoPermission((value) => !value)} aria-pressed={autoPermission}>
                <Settings2Icon className="h-4 w-4" /> Auto permission <span className="ml-auto text-xs text-muted-foreground">{autoPermission ? "On" : "Off"}</span>
              </Button>
              <Button type="button" variant="ghost" className="justify-start gap-2" onClick={() => setInput(`Skills: ${input}`)}>
                <BookOpenIcon className="h-4 w-4" /> Skills
              </Button>
              <Button type="button" variant="ghost" className="justify-start gap-2" onClick={() => setInput(`MCP tools: ${input}`)}>
                <NetworkIcon className="h-4 w-4" /> MCP
              </Button>
              <Button type="button" variant="ghost" className="justify-start gap-2" onClick={() => setInput(`Instructions: ${input}`)}>
                <FileTextIcon className="h-4 w-4" /> Instructions
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label="Attach file" title="Attach file" onClick={() => fileInputRef.current?.click()}>
          <PaperclipIcon className="h-4 w-4" />
        </Button>
        <Button type="submit" disabled={status !== "ready" || !input.trim()}>
          <SendIcon className="w-4 h-4" />
        </Button>
      </form>
    </Panel>
  );
}
