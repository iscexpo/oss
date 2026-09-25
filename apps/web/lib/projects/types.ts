export interface Project {
  id: string
  name: string
  description: string | null
  repoUrl: string | null
  sandboxId: string | null
  createdAt: string
  updatedAt: string
}

export interface SandboxRecord {
  id: string
  projectId: string | null
  status: 'running' | 'stopped' | 'unknown'
  createdAt: string
  lastCheckedAt: string | null
}

export type SandboxStatus = SandboxRecord['status']

export interface CreateProjectInput {
  name: string
  description?: string
  repoUrl?: string
  sandboxId?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string | null
  repoUrl?: string | null
  sandboxId?: string | null
}