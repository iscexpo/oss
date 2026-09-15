import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  children: ReactNode;
}

export function Panel({ className, children }: Props) {
  return (
    <div className={cn("relative flex h-full w-full min-h-0 flex-col bg-black", className)}>
      {children}
    </div>
  );
}

export function PanelHeader({ className, children }: Props) {
  return (
    <div
      className={cn(
        "flex h-10 shrink-0 items-center border-b border-[#242424] bg-black px-3 text-xs font-medium text-zinc-400",
        className,
      )}
    >
      {children}
    </div>
  );
}
