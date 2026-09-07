import { NextResponse } from 'next/server'
import { handleChat } from '@/app/api/chat/handler'

export async function POST(req: Request) {
  return handleChat(req)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await params
  return NextResponse.json({ id: 'unknown', messages: [], createdAt: new Date() })
}
