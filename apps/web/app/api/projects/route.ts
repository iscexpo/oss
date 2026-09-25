import { NextResponse, type NextRequest } from 'next/server'
import { checkBotId } from 'botid/server'
import z from 'zod/v3'

import {
  createProject,
  dbErrorResponse,
  listProjects,
} from '@/lib/projects/db'

const CreateProjectBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000).optional(),
  repoUrl: z.string().trim().max(2000).optional(),
  sandboxId: z.string().trim().max(200).optional(),
})

export async function GET() {
  try {
    const projects = await listProjects()
    return NextResponse.json({ projects })
  } catch (error) {
    return dbErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  const botResult = await checkBotId(request)
  if (botResult) {
    return NextResponse.json({ error: 'bot request blocked.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const result = CreateProjectBodySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid project.' }, { status: 400 })
  }

  try {
    const project = await createProject(result.data)
    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    return dbErrorResponse(error)
  }
}