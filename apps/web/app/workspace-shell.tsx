"use client";

import { Chat } from "./chat";
import { FileExplorer } from "./file-explorer";
import { Header } from "./header";
import { Logs } from "./logs";
import { Preview } from "./preview";
import { SettingsSurface } from "./settings-surface";
import { TerminalSurface } from "./terminal-surface";
import { Sidebar } from "@/components/layout/sidebar";
import { TabContent, TabItem } from "@/components/tabs";
import { useTabState } from "@/components/tabs/use-tab-state";
import { cn } from "@/lib/utils";

export function WorkspaceShell() {
  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-black text-zinc-200">
      <Header className="flex w-full items-center" />

      <div className="border-b border-[#242424] bg-black md:hidden">
        <ul className="flex items-center gap-4 overflow-x-auto px-3 py-2 font-mono text-xs tracking-tight text-zinc-500">
          <TabItem tabId="chat">Chat</TabItem>
          <TabItem tabId="preview">Preview</TabItem>
          <TabItem tabId="settings">Settings</TabItem>
          <TabItem tabId="logs">Logs</TabItem>
          <TabItem tabId="code">Code</TabItem>
          <TabItem tabId="terminal">Terminal</TabItem>
        </ul>
      </div>

      <div className="flex min-h-0 w-full flex-1 overflow-hidden">
        <Sidebar className="hidden lg:flex" />

        <section
          aria-label="Assistant"
          className="hidden w-[360px] shrink-0 border-r border-[#242424] bg-black md:flex"
        >
          <Chat className="min-h-0 flex-1 overflow-hidden" />
        </section>

        <WorkSurface />
      </div>
    </div>
  );
}

function WorkSurface() {
  const [activeTab] = useTabState();

  if (activeTab === "chat") {
    return (
      <div className="min-w-0 flex-1 bg-black md:hidden">
        <Chat className="h-full overflow-hidden" />
      </div>
    );
  }

  return (
    <section aria-label="Work surface" className="h-full min-w-0 flex-1 bg-black">
      <TabContent tabId="preview" className={cn("h-full min-h-0 flex-col")}>
        <Preview className="h-full min-h-0" />
      </TabContent>
      <TabContent tabId="settings" className={cn("h-full min-h-0 flex-col")}>
        <SettingsSurface className="h-full min-h-0" />
      </TabContent>
      <TabContent tabId="logs" className={cn("h-full min-h-0 flex-col")}>
        <Logs className="h-full min-h-0" />
      </TabContent>
      <TabContent tabId="code" className={cn("h-full min-h-0 flex-col")}>
        <FileExplorer className="h-full min-h-0" />
      </TabContent>
      <TabContent tabId="terminal" className={cn("h-full min-h-0 flex-col")}>
        <TerminalSurface className="h-full min-h-0" />
      </TabContent>
    </section>
  );
}
