import type { TextUIPart } from "ai";
import { Streamdown } from "streamdown";

export function Text({ part }: { part: TextUIPart }) {
  return (
    <div className="text-sm px-4 py-3 border border-border/80 bg-card/70 text-foreground rounded-lg font-mono leading-relaxed shadow-sm [&_h1]:mb-4 [&_h1]:border-l-2 [&_h1]:border-cyan-400 [&_h1]:pl-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:border-b-2 [&_h2]:border-border [&_h2]:pb-2 [&_h2]:text-xl [&_h2]:font-bold [&_p]:my-2 [&_ul]:my-2 [&_ul]:space-y-1 [&_li]:pl-1 [&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-cyan-300 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-background [&_pre]:p-4 [&_pre]:text-[13px] [&_pre_code]:bg-transparent [&_pre_code]:p-0">
      <Streamdown>{part.text}</Streamdown>
    </div>
  );
}
