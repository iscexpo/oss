import { NextRequest } from 'next/server'
import { Sandbox } from '@vercel/sandbox'

export interface PreviewTarget {
  url: URL
  origin: string
}

const PREVIEW_PATH_PATTERN = /^\/api\/preview\/([^/]+)(?:\/(.*))?$/

/**
 * Resolve the public sandbox domain for a given sandbox + port. Mirrors the
 * v0-clone proxy's use of `Sandbox.get().domain()` for route resolution.
 */
export async function getPreviewTarget(
  sandboxId: string,
  port: number,
): Promise<PreviewTarget> {
  const sandbox = await Sandbox.get({ sandboxId })
  return {
    url: new URL(sandbox.domain(port)),
    origin: sandbox.domain(port),
  }
}

export function parseSandboxIdFromPreviewPath(pathname: string): string | null {
  const match = PREVIEW_PATH_PATTERN.exec(pathname)
  return match?.[1] ?? null
}

export function parsePreviewPort(value: string | null): number {
  const port = Number(value ?? '3000')
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : 3000
}

/**
 * Headers forwarded to the upstream sandbox preview. The browser's sandbox
 * session cookie is forwarded so cookie-authed previews keep working, while
 * hop-by-hop and origin-tracking headers are stripped.
 */
const FORWARDED_REQUEST_HEADERS = new Set([
  'accept',
  'accept-language',
  'cache-control',
  'content-type',
  'cookie',
  'range',
  'user-agent',
])

export function buildUpstreamRequest(
  request: NextRequest,
  target: PreviewTarget,
): RequestInit {
  const headers = new Headers()
  for (const [name, value] of request.headers) {
    if (FORWARDED_REQUEST_HEADERS.has(name)) {
      headers.set(name, value)
    }
  }

  headers.set('x-forwarded-host', request.nextUrl.host)
  headers.set('x-forwarded-proto', request.nextUrl.protocol.replace(':', ''))

  const method = request.method
  const init: RequestInit = {
    method,
    headers,
    redirect: 'follow',
  }

  if (method !== 'GET' && method !== 'HEAD') {
    init.body = request.body
  }

  return init
}

/**
 * Response headers that must not leak from the sandbox preview. The sandbox
 * domain may forbid framing; since proxying implies framing, drop those.
 */
const STRIPPED_RESPONSE_HEADERS = new Set([
  'content-security-policy',
  'x-frame-options',
  'content-security-policy-report-only',
  'set-cookie',
])

export function buildUpstreamResponse(
  response: Response,
  target: PreviewTarget,
): Response {
  const headers = new Headers(response.headers)
  for (const name of STRIPPED_RESPONSE_HEADERS) {
    headers.delete(name)
  }
  headers.set('x-sandbox-preview-origin', target.origin)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}