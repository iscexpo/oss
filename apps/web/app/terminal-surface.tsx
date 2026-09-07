"use client";

import { CommandsLogs } from "@/components/commands-logs/commands-logs";
import { useSandboxStore } from "./state";

export function TerminalSurface({ className }: { className?: string }) {
  const { commands } = useSandboxStore();
  return <CommandsLogs className={className} commands={commands} />;
}
