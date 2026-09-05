import { NextRequest, NextResponse } from 'next/server'

/**
 * Same-origin baseline authorization for the web app's API routes, mirroring
 * the v0-clone proxy authorization seam.
 *
 * This is demo-only: there are no user accounts, so anyone who can reach the
 * deployment shares the deployer's workspace/quota. Replace or extend this
 * seam with real session auth before production use.
 *
 * The check is intentionally lenient: it only rejects requests that carry an
 * Origin/Referer header pointing at a different origin, so curl and
 * server-to-server requests keep working.
 *
 * @see https://github.com/vercel-labs/v0-sdk/blob/main/examples/v0-clone/apps/web/lib/proxy.ts
 */
export async function authorizeRequest(request: NextRequest): Promise<boolean> {
  const origin = request.headers.get('origin') ?? request.headers.get('referer')

  if (!origin) {
    return true
  }

  try {
    return new URL(origin).origin === request.nextUrl.origin
  } catch {
    return false
  }
}

export function proxy(proxyRequest: NextRequest) {
  const { pathname } = proxyRequest.nextUrl

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const origin =
    proxyRequest.headers.get('origin') ?? proxyRequest.headers.get('referer')
  if (!origin) {
    return NextResponse.next()
  }

  try {
    if (new URL(origin).origin === proxyRequest.nextUrl.origin) {
      return NextResponse.next()
    }
  } catch {
    return NextResponse.next()
  }

  return new NextResponse('Forbidden', { status: 403 })
}

export const config = {
  matcher: ['/api/:path*'],
}