import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ToolMessage(props: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#2b2b2b] bg-[#111111] px-3.5 py-3 font-mono text-[13px] leading-6 text-zinc-300",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}
