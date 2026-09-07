import { NextRequest } from 'next/server'
import { authorizeRequest } from '@/lib/authorize'
import { previewLoadingHtml } from '@/lib/loading'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Loading page for a sandbox preview, mirroring the v0-clone preview proxy's
 * `/loading` route. It broadcasts a `v0-preview-loading` postMessage so the
 * host app can keep the preview in a loading state, then retries the preview
 * path so the frame flips to real content as soon as the sandbox is serving.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sandboxId: string }> },
) {
  const { sandboxId } = await params

  if (!authorizeRequest(request)) {
    return new Response('Forbidden', { status: 403 })
  }

  const port = Number(request.nextUrl.searchParams.get('port') ?? '3000')
  return previewLoadingHtml(sandboxId, port)
}