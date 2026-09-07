import { NextResponse } from 'next/server'
import { handleChat } from '@/app/api/chat/handler'

export async function POST(req: Request) {
  return handleChat(req)
}

export async function GET(request: Request) {
  const denied = authorizeProxyRequest(request)
  if (denied) return denied
  return NextResponse.json({ chats: [], cursor: null })
}

function authorizeProxyRequest(request: Request): Response | undefined {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ message: 'Forbidden' }, { status: 403 })
  }
}
