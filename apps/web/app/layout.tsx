import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ChatProvider } from "@/lib/chat-context";
import { CommandLogsStream } from "@/components/commands-logs/commands-logs-stream";
import { ErrorMonitor } from "@/components/error-monitor/error-monitor";
import { PreviewOriginProvider } from "@/components/preview/preview-provider";
import { SandboxState } from "@/components/modals/sandbox-state";
import { Toaster } from "@/components/ui/sonner";
import { getPreviewProxyUrl } from "@/lib/preview-proxy";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

const title = "Sign in to v0";
const description = "Sign in to v0 using your Vercel account.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    images: [
      {
        url: "https://assets.vercel.com/image/upload/v1754588799/OSSvibecodingplatform/OG.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: "https://assets.vercel.com/image/upload/v1754588799/OSSvibecodingplatform/OG.png",
      },
    ],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const previewProxyUrl = getPreviewProxyUrl();

  return (
    <html lang="en" className="dark bg-background">
      <body className="antialiased">
        <Suspense fallback={null}>
          <NuqsAdapter>
            <ChatProvider>
              <ErrorMonitor>
                <PreviewOriginProvider origin={previewProxyUrl}>{children}</PreviewOriginProvider>
              </ErrorMonitor>
            </ChatProvider>
          </NuqsAdapter>
        </Suspense>
        <Toaster />
        <CommandLogsStream />
        <SandboxState />
      </body>
    </html>
  );
}
