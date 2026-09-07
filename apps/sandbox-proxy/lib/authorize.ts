import { NextRequest } from 'next/server'
import { getAllowedOrigin } from './origins'

/**
 * Same-origin baseline authorization, mirroring the v0-clone preview proxy.
 *
 * This is demo-only: there are no user accounts, so anyone who can reach the
 * deployment shares the deployer's workspace/quota. Replace or extend this
 * seam with real session auth before production use.
 *
 * @see https://github.com/vercel-labs/v0-sdk/blob/main/examples/v0-clone/apps/preview-proxy/lib/authorize.ts
 */
export function authorizeRequest(request: NextRequest): boolean {
  const origin =
    request.headers.get('origin') ?? request.headers.get('referer')

  // Requests without an Origin/Referer (curl, server-to-server) are allowed.
  if (!origin) {
    return true
  }

  try {
    return new URL(origin).origin === getAllowedOrigin()
  } catch {
    return false
  }
}