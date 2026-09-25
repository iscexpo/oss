import type { DataPart } from "@/ai/messages/data-parts";
import { BugIcon } from "lucide-react";
import { ToolHeader } from "../tool-header";
import { ToolMessage } from "../tool-message";
import { Streamdown } from "streamdown";

export function ReportErrors({ message }: { message: DataPart["report-errors"] }) {
  return (
    <ToolMessage className="overflow-hidden border-border/80 bg-muted/20 p-0 shadow-none">
      <ToolHeader>
        <BugIcon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Auto-detected errors</span>
      </ToolHeader>
      <div className="relative min-h-5 border-t border-border/60 bg-background/70 px-3.5 py-3 text-muted-foreground">
        <Streamdown>{message.summary}</Streamdown>
      </div>
    </ToolMessage>
  );
}
