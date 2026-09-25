import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import type {
  CreateProjectInput,
  Project,
  SandboxRecord,
  UpdateProjectInput,
} from './types'

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      'The project database is not configured. Set POSTGRES_URL or DATABASE_URL to enable project management.'
    )
    this.name = 'DatabaseNotConfiguredError'
  }
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL)
}

export function assertDbConfigured(): void {
  if (!isDbConfigured()) {
    throw new DatabaseNotConfiguredError()
  }
}

export function dbErrorResponse(error: unknown): NextResponse {
  if (error instanceof DatabaseNotConfiguredError) {
    return NextResponse.json({ error: error.message }, { status: 503 })
  }
  console.error('Database error:', error)
  return NextResponse.json({ error: 'Database request failed.' }, { status: 500 })
}

export async function ensureSchema(): Promise<void> {
  assertDbConfigured()
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      repo_url text,
      sandbox_id text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS sandboxes (
      id text PRIMARY KEY,
      project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
      status text NOT NULL DEFAULT 'running',
      created_at timestamptz NOT NULL DEFAULT now(),
      last_checked_at timestamptz
    )
  `
}

export async function listProjects(): Promise<Project[]> {
  await ensureSchema()
  const { rows } = await sql`
    SELECT id, name, description, repo_url AS "repoUrl", sandbox_id AS "sandboxId",
           created_at AS "createdAt", updated_at AS "updatedAt"
    FROM projects
    ORDER BY updated_at DESC
  `
  return rows as unknown as Project[]
}

export async function getProject(id: string): Promise<Project | null> {
  await ensureSchema()
  const { rows } = await sql`
    SELECT id, name, description, repo_url AS "repoUrl", sandbox_id AS "sandboxId",
           created_at AS "createdAt", updated_at AS "updatedAt"
    FROM projects
    WHERE id = ${id}
  `
  return (rows[0] as unknown as Project) ?? null
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  await ensureSchema()
  const { rows } = await sql`
    INSERT INTO projects (name, description, repo_url, sandbox_id)
    VALUES (
      ${input.name},
      ${input.description ?? null},
      ${input.repoUrl ?? null},
      ${input.sandboxId ?? null}
    )
    RETURNING id, name, description, repo_url AS "repoUrl", sandbox_id AS "sandboxId",
              created_at AS "createdAt", updated_at AS "updatedAt"
  `
  return rows[0] as unknown as Project
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<Project | null> {
  await ensureSchema()
  const existing = await getProject(id)
  if (!existing) {
    return null
  }

  const { rows } = await sql`
    UPDATE projects SET
      name = ${input.name ?? existing.name},
      description = ${input.description !== undefined ? input.description : existing.description},
      repo_url = ${input.repoUrl !== undefined ? input.repoUrl : existing.repoUrl},
      sandbox_id = ${input.sandboxId !== undefined ? input.sandboxId : existing.sandboxId},
      updated_at = now()
    WHERE id = ${id}
    RETURNING id, name, description, repo_url AS "repoUrl", sandbox_id AS "sandboxId",
              created_at AS "createdAt", updated_at AS "updatedAt"
  `
  return (rows[0] as unknown as Project) ?? null
}

export async function deleteProject(id: string): Promise<boolean> {
  await ensureSchema()
  const { rowCount } = await sql`DELETE FROM projects WHERE id = ${id}`
  return (rowCount ?? 0) > 0
}

export async function listSandboxRecords(): Promise<SandboxRecord[]> {
  await ensureSchema()
  const { rows } = await sql`
    SELECT id, project_id AS "projectId", status, created_at AS "createdAt",
           last_checked_at AS "lastCheckedAt"
    FROM sandboxes
    ORDER BY created_at DESC
  `
  return rows as unknown as SandboxRecord[]
}

export async function getSandboxRecord(
  sandboxId: string
): Promise<SandboxRecord | null> {
  await ensureSchema()
  const { rows } = await sql`
    SELECT id, project_id AS "projectId", status, created_at AS "createdAt",
           last_checked_at AS "lastCheckedAt"
    FROM sandboxes
    WHERE id = ${sandboxId}
  `
  return (rows[0] as unknown as SandboxRecord) ?? null
}

export async function recordSandbox(sandboxId: string): Promise<void> {
  await ensureSchema()
  await sql`
    INSERT INTO sandboxes (id) VALUES (${sandboxId})
    ON CONFLICT (id) DO NOTHING
  `
}

export async function setSandboxRecordStatus(
  sandboxId: string,
  status: SandboxRecord['status']
): Promise<void> {
  await ensureSchema()
  await sql`
    UPDATE sandboxes SET status = ${status}, last_checked_at = now()
    WHERE id = ${sandboxId}
  `
}