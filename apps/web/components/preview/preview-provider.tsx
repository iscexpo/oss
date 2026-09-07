'use client'

import { createContext, useContext } from 'react'

interface PreviewContextValue {
  origin?: string
}

const PreviewContext = createContext<PreviewContextValue>({ origin: undefined })

/**
 * Provides the resolved sandbox-proxy origin to the preview pane, mirroring
 * the v0-clone preview provider. The origin is resolved server-side so proxy
 * credentials and URLs never reach the client bundle logic.
 *
 * @see https://github.com/vercel-labs/v0-sdk/blob/main/examples/v0-clone/apps/web/components/preview/preview-provider.tsx
 */
export function PreviewOriginProvider({
  origin,
  children,
}: {
  origin?: string | null
  children: React.ReactNode
}) {
  return (
    <PreviewContext.Provider value={{ origin: origin ?? undefined }}>
      {children}
    </PreviewContext.Provider>
  )
}

export function usePreviewOrigin() {
  return useContext(PreviewContext)
}