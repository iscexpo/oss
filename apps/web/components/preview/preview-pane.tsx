"use client";

import { BarLoader } from "react-spinners";
import { CompassIcon, ExternalLinkIcon, MousePointer2Icon, RefreshCwIcon, ScanIcon, XIcon } from "lucide-react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Panel, PanelHeader } from "@/components/panels/panels";
import { usePreviewOrigin } from "./preview-provider";
import { useSandboxStore } from "@/app/state";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  disabled?: boolean;
}

const LOADING_MESSAGE = "v0-preview-loading";

/**
 * iframe pane that routes generated-app previews through the isolated
 * sandbox-proxy origin, mirroring the v0-clone preview pane. The iframe
 * never points at the host application origin.
 *
 * @see https://github.com/vercel-labs/v0-sdk/blob/main/examples/v0-clone/apps/web/components/preview/preview-pane.tsx
 */
export function PreviewPane({ className, disabled }: Props) {
  const { sandboxId, url: sandboxUrl, urlUUID, port, status } = useSandboxStore();
  const { origin: proxyOrigin } = usePreviewOrigin();

  const [manualSrc, setManualSrc] = useState<string | undefined>(undefined);
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<"element" | "area" | null>(null);
  const [areaStart, setAreaStart] = useState<{ x: number; y: number } | null>(null);
  const [areaRect, setAreaRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadStartTime = useRef<number | null>(null);

  const frameKey = `${sandboxId ?? "none"}:${urlUUID ?? "none"}`;

  const previewUrl = useMemo(() => {
    if (!proxyOrigin || !sandboxId) return undefined;
    const url = new URL(`${proxyOrigin}/api/preview/${sandboxId}`);
    url.searchParams.set("port", String(port ?? 3000));
    return url.toString();
  }, [proxyOrigin, sandboxId, port]);

  const effectiveSrc = manualSrc ?? previewUrl;

  useEffect(() => {
    setManualSrc(undefined);
    setError(null);
    setIsLoading(!!previewUrl);
  }, [frameKey, previewUrl]);

  useEffect(() => {
    setAddress(effectiveSrc ?? "");
  }, [effectiveSrc]);

  // The sandbox-proxy loading page broadcasts this while a preview boots.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === LOADING_MESSAGE) {
        setIsLoading(true);
        setError(null);
        loadStartTime.current = Date.now();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const refreshIframe = useCallback(() => {
    const target = effectiveSrc;
    if (!iframeRef.current || !target) return;
    setIsLoading(true);
    setError(null);
    loadStartTime.current = Date.now();
    iframeRef.current.src = "";
    setTimeout(() => {
      if (iframeRef.current) iframeRef.current.src = target;
    }, 10);
  }, [effectiveSrc]);

  const navigateTo = useCallback(() => {
    const value = address.trim();
    if (!value) return;
    if (iframeRef.current) {
      setIsLoading(true);
      setError(null);
      loadStartTime.current = Date.now();
      iframeRef.current.src = value;
    }
    // Keep whatever URL was typed (proxy-scoped or arbitrary) until "return
    // to preview" is pressed, so sub-path edits don't snap back on re-render.
    setManualSrc(value);
  }, [address]);

  const openInNewTab = () => {
    const external = sandboxUrl;
    if (external) window.open(external, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (selectionMode === "element") {
      iframeRef.current?.contentWindow?.postMessage({ type: "ENABLE_ELEMENT_INSPECTOR" }, "*");
    }
  }, [selectionMode]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "ELEMENT_SELECTED") return;
      window.dispatchEvent(new CustomEvent("v0-preview-context", { detail: { kind: "element", data: event.data.data } }));
      setSelectionMode(null);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const finishAreaSelection = useCallback(() => {
    if (!areaStart || !areaRect) return;
    window.dispatchEvent(new CustomEvent("v0-preview-context", {
      detail: { kind: "area", data: { ...areaRect, instruction: "The user selected this visual preview area for focused changes." } },
    }));
    setAreaStart(null);
    setAreaRect(null);
    setSelectionMode(null);
  }, [areaRect, areaStart]);

  return (
    <Panel className={className}>
      <PanelHeader>
        <div className="absolute flex items-center space-x-1">
          <a
            href={sandboxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer px-1"
            title="Open the sandbox preview in a new tab"
          >
            <CompassIcon className="w-4" />
          </a>
          <button
            type="button"
            onClick={openInNewTab}
            className="cursor-pointer px-1"
            title="Open the sandbox preview in a new tab"
          >
            <ExternalLinkIcon className="w-4" />
          </button>
          <button
            type="button"
            onClick={() => setSelectionMode("element")}
            className={cn("cursor-pointer px-1", { "text-blue-500": selectionMode === "element" })}
            title="Inspect an element in the preview"
            aria-label="Inspect an element in the preview"
          >
            <MousePointer2Icon className="w-4" />
          </button>
          <button
            type="button"
            onClick={() => setSelectionMode("area")}
            className={cn("cursor-pointer px-1", { "text-blue-500": selectionMode === "area" })}
            title="Select a preview area"
            aria-label="Select a preview area"
          >
            <ScanIcon className="w-4" />
          </button>
          <button
            type="button"
            onClick={refreshIframe}
            className={cn("cursor-pointer px-1", { "animate-spin": isLoading })}
            title="Reload the preview"
          >
            <RefreshCwIcon className="w-4" />
          </button>
          {manualSrc && (
            <button
              type="button"
              onClick={() => setManualSrc(undefined)}
              className="cursor-pointer px-1"
              title="Return to the sandbox preview"
            >
              <XIcon className="w-4" />
            </button>
          )}
        </div>

        <div className="m-auto h-6">
          <input
            type="text"
            className="font-mono text-xs h-6 border border-gray-200 px-4 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[300px]"
            onChange={(event) => setAddress(event.target.value)}
            onClick={(event) => event.currentTarget.select()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
                navigateTo();
              }
            }}
            value={address}
            placeholder="Preview URL"
          />
        </div>
      </PanelHeader>

      <div className="flex h-[calc(100%-2rem-1px)] relative">
        {!sandboxId && (
          <div className="flex items-center justify-center w-full h-full font-mono text-sm text-muted-foreground">
            Run the agent to generate an app — its live preview will appear here.
          </div>
        )}

        {!proxyOrigin && sandboxId && (
          <div className="flex items-center justify-center w-full h-full font-mono text-sm text-muted-foreground">
            Preview proxy is not configured. Set VIBE_PREVIEW_PROXY_URL and restart.
          </div>
        )}

        {effectiveSrc && proxyOrigin && !disabled && (
          <>
            <ScrollArea className="w-full">
              <iframe
                key={frameKey}
                ref={iframeRef}
                src={effectiveSrc}
                className="w-full h-full"
                onLoad={() => {
                  setIsLoading(false);
                  setError(null);
                }}
                onError={() => {
                  setIsLoading(false);
                  setError("Failed to load the page");
                }}
                title="Sandbox preview"
              />
            </ScrollArea>

            {selectionMode === "area" && (
              <div
                className="absolute inset-0 z-20 cursor-crosshair bg-blue-500/5"
                onMouseDown={(event) => {
                  const bounds = event.currentTarget.getBoundingClientRect();
                  setAreaStart({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
                  setAreaRect({ x: event.clientX - bounds.left, y: event.clientY - bounds.top, width: 0, height: 0 });
                }}
                onMouseMove={(event) => {
                  if (!areaStart) return;
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const x = event.clientX - bounds.left;
                  const y = event.clientY - bounds.top;
                  setAreaRect({ x: Math.min(x, areaStart.x), y: Math.min(y, areaStart.y), width: Math.abs(x - areaStart.x), height: Math.abs(y - areaStart.y) });
                }}
                onMouseUp={finishAreaSelection}
              >
                {areaRect && <div className="absolute border-2 border-blue-500 bg-blue-500/10" style={{ left: areaRect.x, top: areaRect.y, width: areaRect.width, height: areaRect.height }} />}
              </div>
            )}

            {isLoading && !error && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center flex-col gap-2">
                <BarLoader color="#666" />
                <span className="text-gray-500 text-xs">Loading...</span>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 bg-white flex items-center justify-center flex-col gap-2">
                <span className="text-red-500">Failed to load page</span>
                <button
                  className="text-blue-500 hover:underline text-sm"
                  type="button"
                  onClick={refreshIframe}
                >
                  Try again
                </button>
              </div>
            )}
          </>
        )}

        {disabled && (
          <div className="flex items-center justify-center w-full h-full font-mono text-sm text-muted-foreground">
            The sandbox has stopped. Start a new session to continue.
          </div>
        )}
      </div>
    </Panel>
  );
}
