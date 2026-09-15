import type { TextUIPart } from "ai";
import { Streamdown } from "streamdown";

export function Text({ part }: { part: TextUIPart }) {
  return (
    <div className="rounded-xl border border-[#2b2b2b] bg-[#111111] px-3.5 py-3 text-[13px] leading-6 text-zinc-200 [&_a]:text-zinc-50 [&_code]:rounded [&_code]:bg-white/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-black [&_pre]:p-3">
      <Streamdown>{part.text}</Streamdown>
    </div>
  );
}
