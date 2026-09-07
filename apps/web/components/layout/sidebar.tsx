"use client";

import { MessageCircleIcon, GlobeIcon, FolderTreeIcon, TerminalSquareIcon } from "lucide-react";
import { useTabState } from "@/components/tabs/use-tab-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "chat", icon: MessageCircleIcon, label: "Chat" },
  { id: "preview", icon: GlobeIcon, label: "Preview" },
  { id: "file-explorer", icon: FolderTreeIcon, label: "Files" },
  { id: "logs", icon: TerminalSquareIcon, label: "Logs" },
] as const;

export function Sidebar({ className }: { className?: string }) {
  const [activeTabId, setTabId] = useTabState();
  return (
    <nav
      className={cn(
        "flex flex-col border-r border-primary/18 w-12 items-center py-2 gap-1 bg-secondary/30 shrink-0",
        className,
      )}
    >
      {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
        <Button
          key={id}
          variant="ghost"
          size="icon"
          className={cn("rounded-sm", activeTabId === id && "bg-accent text-accent-foreground")}
          onClick={() => setTabId(id)}
          title={label}
        >
          <Icon className="w-4 h-4" />
          <span className="sr-only">{label}</span>
        </Button>
      ))}
    </nav>
  );
}
