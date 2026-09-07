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
        <div className="flex items-center font-mono font-semibold uppercase">
          Settings
        </div>
      </PanelHeader>
      <div className="flex-1 overflow-auto p-4 space-y-6">
        <ModelSelector />
        <AutoFixErrors />
        <ReasoningEffort />
      </div>
    </Panel>
  );
}
