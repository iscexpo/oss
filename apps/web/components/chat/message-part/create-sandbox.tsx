import type { DataPart } from "@/ai/messages/data-parts";
import { BoxIcon, CheckIcon, SparklesIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "./spinner";
import { ToolHeader } from "../tool-header";
import { ToolMessage } from "../tool-message";

interface Props {
  message: DataPart["create-sandbox"];
}

export function CreateSandbox({ message }: Props) {
  const failureContext = `Failed to create sandbox: ${message.error?.message ?? "Unknown error"}`;

  return (
    <ToolMessage>
      <ToolHeader>
        <BoxIcon className="w-3.5 h-3.5" />
        Create Sandbox
      </ToolHeader>
      <div className="relative pl-6 min-h-5">
        <Spinner className="absolute left-0 top-0" loading={message.status === "loading"}>
          {message.status === "error" ? (
            <XIcon className="w-4 h-4 text-red-700" />
          ) : (
            <CheckIcon className="w-4 h-4" />
          )}
        </Spinner>
        <div className="flex flex-wrap items-center gap-2">
          <span className={message.status === "error" ? "text-red-700" : undefined}>
            {message.status === "done" && "Sandbox created successfully"}
            {message.status === "loading" && "Creating Sandbox"}
            {message.status === "error" && "Failed to create sandbox"}
          </span>
          {message.status === "error" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("v0-auto-fix-request", {
                    detail: { message: failureContext },
                  }),
                );
              }}
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              Fix with AI
            </Button>
          )}
        </div>
      </div>
    </ToolMessage>
  );
}
