import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ToolHeader(props: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}
