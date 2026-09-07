import 'server-only'

const LOCAL_PREVIEW_PROXY_URL = 'http://localhost:3001'

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
 * Resolve the sandbox proxy origin, in order:
 *
 *   1. `VIBE_PREVIEW_PROXY_URL` (or legacy `V0_PREVIEW_PROXY_URL`) env var
 *   2. Local: `http://localhost:3001`
 *   3. Related Project URL (preview/production on Vercel)
 *
 * @see https://github.com/vercel-labs/v0-sdk/blob/main/examples/v0-clone/apps/web/lib/preview-proxy.ts
 */
export function getPreviewProxyUrl(): string | null {
  const { VERCEL } = process.env

  if (!VERCEL) {
    return LOCAL_PREVIEW_PROXY_URL
  }

  const relatedProject = getRelatedProject()
  const configuredUrl = resolveOriginEnv()
  const resolvedUrl =
    process.env.VERCEL_ENV === 'preview'
      ? getPreviewUrl(relatedProject) || configuredUrl
      : configuredUrl || getProductionUrl(relatedProject)

  if (!resolvedUrl) {
    console.warn(
      'Preview proxy URL could not be resolved. Set VIBE_PREVIEW_PROXY_URL or link the sandbox proxy as a Vercel Related Project.',
    )
    return null
  }

  try {
    const url = new URL(resolvedUrl)
    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      url.protocol !== 'https:'
    ) {
      console.warn(
        'The preview proxy URL must be an HTTP(S) origin without a path.',
      )
      return null
    }
    return url.origin
  } catch {
    console.warn(`Invalid preview proxy URL: ${resolvedUrl}`)
    return null
  }
}

function resolveOriginEnv(): string | undefined {
  return (
    process.env.VIBE_PREVIEW_PROXY_URL?.trim() ||
    process.env.V0_PREVIEW_PROXY_URL?.trim()
  )
}

function getRelatedProject(): RelatedProject | undefined {
  const projects = parseRelatedProjects()
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
  const host = project?.preview?.customEnvironment || project?.preview?.branch
  return host ? `https://${host}` : undefined
}

function getProductionUrl(project?: RelatedProject) {
  const host =
    project?.production?.alias || project?.production?.url || project?.url
  return host ? `https://${host}` : undefined
}