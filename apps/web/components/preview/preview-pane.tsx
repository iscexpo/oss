"use client";

import { BarLoader } from "react-spinners";
import { CompassIcon, ExternalLinkIcon, RefreshCwIcon, XIcon } from "lucide-react";
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

  return (
    <Panel className={className}>
      <PanelHeader className="relative justify-center px-2">
        <div className="absolute left-1 flex items-center">
          <a
            href={sandboxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer rounded p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
            title="Open the sandbox preview in a new tab"
          >
            <CompassIcon className="size-3.5" />
          </a>
          <button
            type="button"
            onClick={openInNewTab}
            className="cursor-pointer rounded p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
            title="Open the sandbox preview in a new tab"
          >
            <ExternalLinkIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={refreshIframe}
            className={cn(
              "cursor-pointer rounded p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200",
              { "animate-spin": isLoading },
            )}
            title="Reload the preview"
          >
            <RefreshCwIcon className="size-3.5" />
          </button>
          {manualSrc && (
            <button
              type="button"
              onClick={() => setManualSrc(undefined)}
              className="cursor-pointer rounded p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
              title="Return to the sandbox preview"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>

        <input
          type="text"
          aria-label="Preview URL"
          className="h-7 w-full max-w-md rounded-md border border-[#2a2a2a] bg-[#111111] px-3 text-center font-mono text-xs text-zinc-300 outline-none placeholder:text-zinc-600 focus:border-[#3a3a3a]"
          onChange={(event) => setAddress(event.target.value)}
          onClick={(event) => event.currentTarget.select()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
              navigateTo();
            }
          }}
          value={address}
          placeholder="/"
        />
      </PanelHeader>

      <div className="relative flex h-[calc(100%-2.5rem-1px)] bg-black">
        {!sandboxId && (
          <div className="flex h-full w-full items-center justify-center px-8 text-center text-[13px] text-zinc-500">
            Run the agent to generate an app — its live preview will appear here.
          </div>
        )}

        {!proxyOrigin && sandboxId && (
          <div className="flex h-full w-full items-center justify-center px-8 text-center font-mono text-xs text-zinc-500">
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
                className="h-full w-full bg-black"
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

            {isLoading && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/90">
                <BarLoader color="#71717a" />
                <span className="text-xs text-zinc-500">Loading...</span>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black">
                <span className="text-sm text-red-400">Failed to load page</span>
                <button
                  className="text-sm text-zinc-200 underline underline-offset-4 hover:text-white"
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
