import { NextResponse, type NextRequest } from 'next/server'
import { checkBotId } from 'botid/server'

import { dbErrorResponse, setSandboxRecordStatus } from '@/lib/projects/db'
import { stopSandbox } from '@/lib/sandboxes/registry'

interface RouteContext {
  params: Promise<{ sandboxId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const botResult = await checkBotId(request)
  if (botResult) {
    return NextResponse.json({ error: 'bot request blocked.' }, { status: 403 })
  }

  const { sandboxId } = await context.params
  if (!sandboxId) {
    return NextResponse.json({ error: 'Invalid sandbox ID.' }, { status: 400 })
  }

  const stopped = await stopSandbox(sandboxId)
  if (!stopped) {
    return NextResponse.json(
      { error: 'Failed to stop the sandbox.' },
      { status: 500 }
    )
  }

  try {
    await setSandboxRecordStatus(sandboxId, 'stopped')
  } catch (error) {
    return dbErrorResponse(error)
  }

  return NextResponse.json({ sandboxId, status: 'stopped' })
}