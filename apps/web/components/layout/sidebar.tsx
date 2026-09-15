"use client";

import {
  ArrowUpRight,
  ChevronsUpDown,
  ChevronDown,
  GitMerge,
  GitPullRequest,
  Globe,
  House,
  LayoutGrid,
  LayoutTemplate,
  MessagesSquare,
  PanelLeft,
  Search,
  Shapes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { id: "home", icon: House, label: "Home", active: true },
  { id: "projects", icon: LayoutGrid, label: "Projects", active: false },
  { id: "chats", icon: MessagesSquare, label: "Chats", active: false },
  { id: "design-systems", icon: Shapes, label: "Design Systems", active: false },
  { id: "templates", icon: LayoutTemplate, label: "Templates", active: false },
] as const;

export function Sidebar({ className }: { className?: string }) {
  const [query, setQuery] = useState("");

  return (
    <nav
      aria-label="Workspace"
      className={cn(
        "flex w-[252px] shrink-0 flex-col overflow-hidden border-r border-[#242424] bg-black text-[13px] text-zinc-300",
        className,
      )}
    >
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-[#242424] px-2">
        <button
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-white/5"
          type="button"
        >
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-amber-600 text-[9px] font-bold text-black">
            i
          </span>
          <span className="truncate text-[13px] font-medium text-zinc-100">isc-dev</span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
        </button>
        <Button
          aria-label="Collapse workspace sidebar"
          className="size-7 shrink-0 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
          size="icon"
          type="button"
          variant="ghost"
        >
          <PanelLeft className="size-3.5" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-2">
        <div className="flex overflow-hidden rounded-lg border border-[#2a2a2a]">
          <Button
            className="h-8 flex-1 justify-center rounded-none bg-[#171717] text-[13px] font-medium text-zinc-100 hover:bg-[#1d1d1d]"
            onClick={() => {
              try {
                window.localStorage.removeItem("prompt-input");
              } catch {
                // New chats should still load if storage is unavailable.
              }
              window.location.assign("/?tab=preview");
            }}
            type="button"
          >
            New Chat
          </Button>
          <Button
            aria-label="New chat options"
            className="h-8 w-8 shrink-0 rounded-none border-l border-[#2a2a2a] bg-[#171717] text-zinc-300 hover:bg-[#1d1d1d]"
            size="icon"
            type="button"
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="relative mt-2">
          <Search
            className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-zinc-600"
            aria-hidden="true"
          />
          <Input
            aria-label="Search workspace"
            className="h-8 border-transparent bg-transparent pr-2 pl-7 text-[13px] text-zinc-200 shadow-none placeholder:text-zinc-600 focus-visible:border-[#2a2a2a] focus-visible:ring-0"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            value={query}
          />
        </div>

        <div className="mt-1 space-y-0.5">
          {NAV_ITEMS.map(({ id, icon: Icon, label, active }) => (
            <button
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-[7px] text-[13px] transition-colors",
                active
                  ? "bg-[#1d1d1d] font-medium text-zinc-50"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
              )}
              key={id}
              type="button"
            >
              <Icon className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <h2 className="px-2 text-xs font-normal text-zinc-500">Drafts</h2>
          <p className="mt-1.5 rounded-lg border border-dashed border-[#2e2e2e] px-2 py-2.5 text-center text-xs text-zinc-500">
            No drafts yet
          </p>
        </div>

        <div className="mt-4">
          <h2 className="px-2 text-xs font-normal text-zinc-500">Projects</h2>
          <p className="mt-1.5 rounded-lg border border-dashed border-[#2e2e2e] px-2 py-2.5 text-center text-xs text-zinc-500">
            No projects yet
          </p>
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-[#242424] p-2">
        <div className="rounded-xl border border-[#2a2a2a] bg-[#101010] p-2.5">
          <Button
            className="relative h-7 w-full rounded-md bg-zinc-100 text-xs font-semibold text-black hover:bg-white"
            size="sm"
            type="button"
          >
            <Globe className="size-3.5" aria-hidden="true" />
            Publish
            <span className="absolute -top-1 -right-1 size-2 rounded-full bg-sky-500" />
          </Button>
          <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-zinc-300">
            <GitPullRequest className="size-3 text-emerald-400" aria-hidden="true" />
            PR
            <span className="text-zinc-600">→</span>
            <GitMerge className="size-3 text-fuchsia-400" aria-hidden="true" />
            Merged
            <span className="text-zinc-600">→</span>
            <Globe className="size-3 text-sky-400" aria-hidden="true" />
            Live
          </p>
          <p className="mt-2 text-[11px] font-medium text-zinc-200">New GitHub Publish Flow</p>
          <Button
            className="mt-1.5 h-7 w-full rounded-md border-[#2a2a2a] bg-transparent text-xs text-zinc-300 hover:bg-white/5"
            size="sm"
            type="button"
            variant="outline"
          >
            Read changelog
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex items-center gap-2 px-1 pb-0.5">
          <span className="flex size-5 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-semibold text-zinc-100">
            i
          </span>
          <span className="min-w-0 flex-1 truncate text-xs text-zinc-300">iscexpo</span>
          <span className="rounded-md border border-[#2a2a2a] px-1.5 py-0.5 font-mono text-[11px] text-zinc-300">
            $4
          </span>
        </div>
      </div>
    </nav>
  );
}
