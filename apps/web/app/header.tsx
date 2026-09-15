"use client";

import { ToggleWelcome } from "@/components/modals/welcome";
import { cn } from "@/lib/utils";
import { useTabState, type SurfaceTab } from "@/components/tabs/use-tab-state";
import { Button } from "@/components/ui/button";
import { ChevronDown, Ellipsis, GitBranch, Lock, Plus, Star } from "lucide-react";

const SURFACE_TABS: { id: SurfaceTab; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "settings", label: "Settings" },
  { id: "logs", label: "Logs" },
  { id: "code", label: "Code" },
  { id: "terminal", label: "Terminal" },
];

interface Props {
  className?: string;
}

export function Header({ className }: Props) {
  const [activeTab, setTab] = useTabState();

  return (
    <header
      className={cn(
        "flex h-12 w-full shrink-0 items-center gap-2 border-b border-[#242424] bg-black px-2 text-xs text-zinc-300",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] font-medium text-zinc-100">
          <Star className="size-3.5 text-zinc-500" aria-hidden="true" />
          <span className="truncate">V0 clone</span>
          <Lock className="size-3 text-zinc-600" aria-hidden="true" />
          <ChevronDown className="size-3.5 text-zinc-500" aria-hidden="true" />
        </span>
        <span className="hidden items-center gap-1.5 rounded-md border border-[#2a2a2a] bg-[#111111] px-2 py-1 font-mono text-[11px] text-zinc-400 lg:flex">
          <GitBranch className="size-3 text-zinc-500" aria-hidden="true" />
          <span className="max-w-44 truncate">main</span>
        </span>
      </div>

      <nav aria-label="Work surface" className="mx-auto hidden min-w-0 items-center md:flex">
        <div className="flex min-w-0 items-center overflow-x-auto rounded-lg border border-[#2a2a2a] bg-[#111111] p-0.5">
          {SURFACE_TABS.map(({ id, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  void setTab(id);
                }}
                type="button"
                className={cn(
                  "shrink-0 rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-[#1d1d1d] text-zinc-50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200",
                )}
              >
                {label}
              </button>
            );
          })}
          <button
            aria-label="Add surface"
            className="ml-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
            type="button"
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0">
        <Button
          aria-label="More workspace actions"
          className="size-7 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Ellipsis className="size-4" aria-hidden="true" />
        </Button>
        <Button
          className="h-7 rounded-md border-[#2a2a2a] bg-transparent px-2.5 text-xs font-medium text-zinc-200 hover:bg-white/5"
          size="sm"
          type="button"
          variant="outline"
        >
          Invite
        </Button>
        <ToggleWelcome />
        <Button
          className="h-7 rounded-md bg-zinc-100 px-3 text-xs font-semibold text-black hover:bg-white"
          size="sm"
          type="button"
        >
          Publish
        </Button>
      </div>
    </header>
  );
}
