import type { ChatUIMessage } from "./types";
import { MessagePart } from "./message-part";
import { BotIcon, UserIcon } from "lucide-react";
import { memo, createContext, useContext, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props {
  message: ChatUIMessage;
}

interface ReasoningContextType {
  expandedReasoningIndex: number | null;
  setExpandedReasoningIndex: (index: number | null) => void;
}

const ReasoningContext = createContext<ReasoningContextType | null>(null);

export const useReasoningContext = () => {
  const context = useContext(ReasoningContext);
  return context;
};

export const Message = memo(function Message({ message }: Props) {
  const [expandedReasoningIndex, setExpandedReasoningIndex] = useState<number | null>(null);

  const reasoningParts = message.parts
    .map((part, index) => ({ part, index }))
    .filter(({ part }) => part.type === "reasoning");

  useEffect(() => {
    if (reasoningParts.length > 0) {
      const latestReasoningIndex = reasoningParts[reasoningParts.length - 1].index;
      setExpandedReasoningIndex(latestReasoningIndex);
    }
  }, [reasoningParts]);

  return (
    <ReasoningContext.Provider value={{ expandedReasoningIndex, setExpandedReasoningIndex }}>
      <div className={cn("flex w-full flex-col gap-1.5", message.role === "user" && "items-end")}>
        {/* Message Header */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
          {message.role === "user" ? (
            <>
              <UserIcon className="size-3" aria-hidden="true" />
              <span>You</span>
            </>
          ) : (
            <>
              <BotIcon className="size-3" aria-hidden="true" />
              <span>Assistant{message.metadata?.model ? ` · ${message.metadata.model}` : ""}</span>
            </>
          )}
        </div>

        {/* Message Content */}
        <div className={cn("w-full space-y-1.5", message.role === "user" && "max-w-[92%]")}>
          {message.parts.map((part, index) => (
            <MessagePart key={index} part={part} partIndex={index} />
          ))}
        </div>
      </div>
    </ReasoningContext.Provider>
  );
});
