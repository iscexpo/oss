"use client";

import { AutoFixErrors } from "@/components/settings/auto-fix-errors";
import { ReasoningEffort } from "@/components/settings/reasoning-effort";
import { ModelSelector } from "@/components/settings/model-selector";
import { Panel, PanelHeader } from "@/components/panels/panels";

interface Props {
  className?: string;
}

export function SettingsSurface({ className }: Props) {
  return (
    <Panel className={className}>
      <PanelHeader>
        <div className="flex items-center font-mono font-semibold uppercase">Settings</div>
      </PanelHeader>
      <div className="min-h-0 flex-1 overflow-y-auto bg-black">
        <div className="mx-auto w-full max-w-2xl space-y-6 px-6 py-6">
          <section className="space-y-2">
            <h2 className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Model</h2>
            <ModelSelector className="w-full border-[#2a2a2a]" />
          </section>
          <section className="space-y-4 border-t border-[#242424] pt-4">
            <AutoFixErrors />
            <ReasoningEffort />
          </section>
        </div>
      </div>
    </Panel>
  );
}
