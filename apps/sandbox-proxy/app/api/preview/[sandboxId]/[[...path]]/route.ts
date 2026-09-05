import { NextRequest, NextResponse } from 'next/server'
import { authorizeRequest } from '@/lib/authorize'
import {
  parsePreviewPort,
  getPreviewTarget,
  buildUpstreamRequest,
  buildUpstreamResponse,
} from '@/lib/proxy'
import { previewLoadingHtml } from '@/lib/loading'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ sandboxId: string; path?: string[] }>
}

async function handle(request: NextRequest, context: RouteContext) {
  const { sandboxId, path = [] } = await context.params

  if (!authorizeRequest(request)) {
    return new Response('Forbidden', { status: 403 })
  }

  const port = parsePreviewPort(request.nextUrl.searchParams.get('port'))
  const pathname = `/${path.join('/')}`

  let target
  try {
    target = await getPreviewTarget(sandboxId, port)
  } catch {
    // Sandbox not resolvable (stopped or still starting): show the loading
    // page instead of a hard error. It retries the preview path on a timer.
    return previewLoadingHtml(sandboxId, port)
  }

  const upstream = new URL(pathname, target.origin)
  upstream.search = request.nextUrl.search
  upstream.searchParams.delete('port')

  let upstreamResponse: Response
  try {
    upstreamResponse = await fetch(
      upstream.toString(),
      buildUpstreamRequest(request, target),
    )
  } catch {
    // Sandbox server not ready yet: retry via the loading page.
    return previewLoadingHtml(sandboxId, port)
  }

  if (upstreamResponse.status >= 500) {
    return previewLoadingHtml(sandboxId, port)
  }

  return buildUpstreamResponse(upstreamResponse, target)
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handle(request, context)
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return handle(request, context)
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handle(request, context)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handle(request, context)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handle(request, context)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handle(request, context)
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  if (!authorizeRequest(request)) {
    return new NextResponse(null, { status: 403 })
  }
  return new NextResponse(null, {
    status: 204,
    headers: { allow: 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS' },
  })
}