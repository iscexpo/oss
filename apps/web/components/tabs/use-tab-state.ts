import { useQueryState, parseAsStringLiteral } from "nuqs";

export type SurfaceTab = "preview" | "settings" | "logs" | "code" | "terminal" | "chat";

const VALID_TABS: SurfaceTab[] = ["preview", "settings", "logs", "code", "terminal", "chat"];

export function useTabState() {
  const [tabId, setTabId] = useQueryState<SurfaceTab>(
    "tab",
    parseAsStringLiteral(VALID_TABS).withDefault("preview"),
  );
  return [tabId, setTabId] as const;
}
