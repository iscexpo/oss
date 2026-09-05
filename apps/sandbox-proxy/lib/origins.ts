import 'server-only'

const DEFAULT_WEB_ORIGIN = 'http://localhost:3000'

interface RelatedProject {
  name?: string
  url?: string
  productionUrl?: string
  production?: {
    url?: string
    alias?: string
  }
  preview?: {
    url?: string
    alias?: string
    branch?: string
    customEnvironment?: string
  }
}

/**
 * Resolve the allowed web (clone) origin, in order:
 *
 *   1. `VIBE_CLONE_ORIGIN` env var
 *   2. Related Project URL (preview/production on Vercel)
 *   3. `http://localhost:3000` locally
 *
 * @see https://github.com/vercel-labs/v0-sdk/blob/main/examples/v0-clone/apps/preview-proxy/lib/origins.ts
 */
export function getAllowedOrigin(): string {
  const env = process.env.VIBE_CLONE_ORIGIN?.trim()

  const { VERCEL, VERCEL_RELATED_PROJECTS } = process.env
  if (VERCEL && VERCEL_RELATED_PROJECTS) {
    const project = getRelatedProject()
    const resolvedUrl =
      process.env.VERCEL_ENV === 'preview'
        ? getPreviewUrl(project)
        : getProductionUrl(project)

    if (resolvedUrl) {
      return normalizeOrigin(resolvedUrl)
    }
  }

  if (env) {
    return normalizeOrigin(env)
  }

  return DEFAULT_WEB_ORIGIN
}

function getRelatedProject(): RelatedProject | undefined {
  const projects = parseRelatedProjects()
  if (projects.length > 1) {
    throw new Error(
      'The sandbox proxy must have only the web app configured as a Related Project.',
    )
  }
  return projects[0]
}

function parseRelatedProjects(): RelatedProject[] {
  const raw = process.env.VERCEL_RELATED_PROJECTS
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as RelatedProject[]) : []
  } catch {
    return []
  }
}

function getPreviewUrl(project?: RelatedProject) {
  const host =
    project?.preview?.customEnvironment || project?.preview?.branch
  return host ? `https://${host}` : undefined
}

function getProductionUrl(project?: RelatedProject) {
  const host =
    project?.production?.alias || project?.production?.url || project?.url
  return host ? `https://${host}` : undefined
}

function normalizeOrigin(value: string): string {
  const url = new URL(value)
  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    (url.protocol !== 'https:' && process.env.VERCEL)
  ) {
    throw new Error('The web app origin must be an HTTPS origin without a path.')
  }
  return url.origin
}