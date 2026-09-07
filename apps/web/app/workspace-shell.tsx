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

export function WorkspaceShell() {
  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-[#000]">
      <Header className="flex items-center w-full shrink-0" />

      <div className="flex lg:hidden">
        <TabItem tabId="chat">Chat</TabItem>
        <TabItem tabId="preview">Preview</TabItem>
        <TabItem tabId="settings">Settings</TabItem>
        <TabItem tabId="logs">Logs</TabItem>
        <TabItem tabId="code">Code</TabItem>
        <TabItem tabId="terminal">Terminal</TabItem>
      </div>

      <div className="flex flex-1 w-full min-h-0 overflow-hidden">
        <Sidebar className="hidden lg:flex" />

        <div className="hidden md:flex w-[340px] lg:w-[400px] border-r border-white/10 shrink-0">
          <Chat className="flex-1 overflow-hidden" />
        </div>

        <WorkSurface />
      </div>
    </div>
  );
}

function WorkSurface() {
  const [activeTab] = useTabState();

  if (activeTab === ("chat" as any)) {
    return (
      <div className="flex-1 min-w-0">
        <Chat className="flex-1 overflow-hidden" />
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 h-full">
      <TabContent tabId="preview" className="h-full">
        <Preview className="h-full" />
      </TabContent>
      <TabContent tabId="settings" className="h-full">
        <SettingsSurface className="h-full" />
      </TabContent>
      <TabContent tabId="logs" className="h-full">
        <Logs className="h-full" />
      </TabContent>
      <TabContent tabId="code" className="h-full">
        <FileExplorer className="h-full" />
      </TabContent>
      <TabContent tabId="terminal" className="h-full">
        <TerminalSurface className="h-full" />
      </TabContent>
    </div>
  );
}
