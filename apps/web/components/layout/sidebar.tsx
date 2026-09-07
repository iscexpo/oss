"use client";

import {
  LayoutDashboardIcon,
  FolderIcon,
  MessageCircleIcon,
  PlusIcon,
  SearchIcon,
  LayoutGridIcon,
  BookOpenIcon,
  RocketIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { id: "home", icon: LayoutDashboardIcon, label: "Home" },
  { id: "projects", icon: FolderIcon, label: "Projects" },
  { id: "chats", icon: MessageCircleIcon, label: "Chats" },
  { id: "design-systems", icon: LayoutGridIcon, label: "Design Systems" },
  { id: "templates", icon: BookOpenIcon, label: "Templates" },
] as const;

export function Sidebar({ className }: { className?: string }) {
  const [query, setQuery] = useState("");

  return (
    <nav
      className={cn(
        "flex flex-col w-64 bg-[#0a0a0a] border-r border-white/10 text-white shrink-0",
        className,
      )}
    >
      {/* Brand / Project Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black text-sm">
          v0
        </div>
        <span className="font-bold text-sm tracking-tight">OSS Vibe</span>
      </div>

      {/* New Chat */}
      <div className="px-3 py-3">
        <Button
          variant="default"
          size="sm"
          className="w-full h-9 bg-white text-black hover:bg-white/90 font-medium text-sm gap-1.5"
        >
          <PlusIcon className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/40" />
          <Input
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 bg-white/10 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/30 focus-visible:border-white/30 text-sm"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="px-2 space-y-0.5 flex-1">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={cn(
              "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors",
              "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Drafts & Projects sections */}
      <div className="px-3 py-2 border-t border-white/10 space-y-3">
        <div>
          <h3 className="px-2 text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
            Drafts
          </h3>
          <div className="space-y-0.5 px-1">
            {[
              { name: "Untitled chat", time: "2h ago" },
              { name: "Shopping app", time: "5h ago" },
            ].map((draft) => (
              <button
                key={draft.name}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                <MessageCircleIcon className="w-3 h-3 shrink-0" />
                <span className="truncate flex-1 text-left">{draft.name}</span>
                <span className="text-[11px] text-white/30">{draft.time}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="px-2 text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
            Projects
          </h3>
          <div className="space-y-0.5 px-1">
            {[
              { name: "E-commerce site", time: "1d ago" },
              { name: "Dashboard", time: "3d ago" },
            ].map((project) => (
              <button
                key={project.name}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                <FolderIcon className="w-3 h-3 shrink-0" />
                <span className="truncate flex-1 text-left">{project.name}</span>
                <span className="text-[11px] text-white/30">{project.time}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Publish card/footer */}
      <div className="px-3 py-3 border-t border-white/10">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors">
          <RocketIcon className="w-4 h-4" />
          Publish
        </button>
      </div>
    </nav>
  );
}
