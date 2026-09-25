import { NextResponse } from 'next/server'

import { dbErrorResponse, listSandboxRecords } from '@/lib/projects/db'

export async function GET() {
  try {
    const sandboxes = await listSandboxRecords()
    return NextResponse.json({ sandboxes })
  } catch (error) {
    return dbErrorResponse(error)
  }
}