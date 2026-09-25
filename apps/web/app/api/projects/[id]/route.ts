import { NextResponse, type NextRequest } from 'next/server'
import { checkBotId } from 'botid/server'
import z from 'zod/v3'

import {
  dbErrorResponse,
  deleteProject,
  updateProject,
  getProject,
} from '@/lib/projects/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

const UpdateProjectBodySchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  repoUrl: z.string().trim().max(2000).nullable().optional(),
  sandboxId: z.string().trim().max(200).nullable().optional(),
})

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  try {
    const project = await getProject(id)
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
    }
    return NextResponse.json({ project })
  } catch (error) {
    return dbErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const botResult = await checkBotId(request)
  if (botResult) {
    return NextResponse.json({ error: 'bot request blocked.' }, { status: 403 })
  }

  const { id } = await context.params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const result = UpdateProjectBodySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid project.' }, { status: 400 })
  }

  try {
    const project = await updateProject(id, result.data)
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
    }
    return NextResponse.json({ project })
  } catch (error) {
    return dbErrorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  try {
    const deleted = await deleteProject(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
    }
    return NextResponse.json({ projectId: id })
  } catch (error) {
    return dbErrorResponse(error)
  }
}