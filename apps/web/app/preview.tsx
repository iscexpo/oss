"use client";

import { PreviewPane } from "@/components/preview/preview-pane";
import { useSandboxStore } from "./state";

interface Props {
  className?: string;
}

export function Preview({ className }: Props) {
  const { status } = useSandboxStore();
  return <PreviewPane className={className} disabled={status === "stopped"} />;
}
