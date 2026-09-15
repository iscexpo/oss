"use client";

import type { ReactNode } from "react";
import { useTabState, type SurfaceTab } from "./use-tab-state";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  tabId: SurfaceTab;
}

export function TabItem({ children, tabId }: Props) {
  const [activeTabId, setTabId] = useTabState();
  return (
    <li className="shrink-0">
      <button
        aria-current={activeTabId === tabId ? "page" : undefined}
        className={cn("cursor-pointer pb-1", {
          "border-b border-zinc-100 text-zinc-100": activeTabId === tabId,
        })}
        onClick={() => {
          void setTabId(tabId);
        }}
        type="button"
      >
        {children}
      </button>
    </li>
  );
}
