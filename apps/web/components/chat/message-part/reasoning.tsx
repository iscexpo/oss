import type { ReasoningUIPart } from "ai";
import { MessageSpinner } from "../message-spinner";
import { useReasoningContext } from "../message";
import { Streamdown } from "streamdown";

export function Reasoning({ part, partIndex }: { part: ReasoningUIPart; partIndex: number }) {
  const context = useReasoningContext();
  const isExpanded = context?.expandedReasoningIndex === partIndex;

  if (part.state === "done" && !part.text) {
    return null;
  }

  const text = part.text || "_Thinking_";
  const isStreaming = part.state === "streaming";
  const firstLine = text.split("\n")[0].replace(/\*\*/g, "");
  const hasMoreContent = text.includes("\n") || text.length > 80;

  const handleClick = () => {
    if (hasMoreContent && context) {
      const newIndex = isExpanded ? null : partIndex;
      context.setExpandedReasoningIndex(newIndex);
    }
  };

  return (
    <div
      className="cursor-pointer rounded-xl border border-[#2b2b2b] bg-[#111111] transition-colors hover:bg-white/5"
      onClick={handleClick}
    >
      <div className="px-3 py-2">
        <div className="font-mono text-[13px] leading-6 text-zinc-400">
          {isExpanded || !hasMoreContent ? (
            <Streamdown>{text}</Streamdown>
          ) : (
            <div className="overflow-hidden">{firstLine}</div>
          )}
          {isStreaming && isExpanded && <MessageSpinner />}
        </div>
      </div>
    </div>
  );
}
