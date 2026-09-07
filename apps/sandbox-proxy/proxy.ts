import { NextResponse, type NextRequest } from "next/server";

const previewPath = /^\/api\/preview\/([^/]+)(?:\/|$)/;

/**
 * Keep root-relative asset requests issued by a sandbox-generated app on the
 * proxy-scoped preview path, mirroring the v0-clone preview proxy.
 *
 * Generated apps frequently request assets at the document root (`/foo`)
 * instead of using relative paths; those land on the proxy origin without a
 * sandbox scope, so we 307-redirect them to `/api/preview/{sandboxId}/foo`.
 *
 * @see https://github.com/vercel-labs/v0-sdk/blob/main/examples/v0-clone/apps/preview-proxy/proxy.ts
 */
export function proxy(request: NextRequest) {
  const referer = request.headers.get("referer");
  if (!referer) return NextResponse.next();
  if (!URL.canParse(referer)) return NextResponse.next();

  const refererUrl = new URL(referer);
  if (refererUrl.origin !== request.nextUrl.origin) return NextResponse.next();

  const sandboxId = refererUrl.pathname.match(previewPath)?.[1];
  if (!sandboxId) return NextResponse.next();

  const proxyUrl = request.nextUrl.clone();
  proxyUrl.pathname = `/api/preview/${sandboxId}${request.nextUrl.pathname}`;

  return NextResponse.redirect(proxyUrl, 307);
}

export const config = {
  matcher: "/((?!api/preview/).*)",
};
