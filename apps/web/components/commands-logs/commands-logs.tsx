"use client";

import type { Command } from "./types";
import { Panel, PanelHeader } from "@/components/panels/panels";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SquareChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
  className?: string;
  commands: Command[];
  bare?: boolean;
}

export function CommandsLogs(props: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [props.commands]);

  return (
    <Panel className={props.className}>
      {props.bare ? null : (
        <PanelHeader className="gap-2 px-2 text-[11px] tracking-wide text-zinc-500 uppercase">
          <SquareChevronRight className="size-3.5" />
          <span className="font-medium">Sandbox Remote Output</span>
        </PanelHeader>
      )}
      <div className={props.bare ? "h-full bg-black" : "h-[calc(100%-2.5rem-1px)] bg-black"}>
        <ScrollArea className="h-full">
          <div className="space-y-2 p-3">
            {props.commands.map((command) => {
              const date = new Date(command.startedAt).toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

              const line = `${command.command} ${command.args.join(" ")}`;
              const body = command.logs?.map((log) => log.data).join("") || "";
              return (
                <pre
                  key={command.cmdId}
                  className="font-mono text-xs leading-5 whitespace-pre-wrap text-zinc-300"
                >
                  {`[${date}] ${line}\n${body}`}
                </pre>
              );
            })}
            {props.bare ? (
              <p aria-hidden="true" className="font-mono text-xs leading-5 text-zinc-300">
                <span className="text-zinc-500">~/v0-project</span> $&nbsp;
                <span className="inline-block h-3.5 w-2 translate-y-0.5 animate-pulse bg-zinc-300" />
              </p>
            ) : null}
          </div>
          <div ref={bottomRef} />
        </ScrollArea>
      </div>
    </Panel>
  );
}
