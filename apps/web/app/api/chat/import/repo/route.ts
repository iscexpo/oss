import { NextResponse, type NextRequest } from 'next/server'
import { Sandbox } from '@vercel/sandbox'
import { checkBotId } from 'botid/server'
import { VSCODE_PORT } from '@/lib/vscode'
import { trackSandbox } from '@/lib/sandboxes/registry'
import z from 'zod/v3'

const TARBALL_EXTENSIONS = ['.zip', '.tar', '.tar.gz', '.tgz']

const RepoSchema = z.object({
  url: z.string().trim().refine(isImportableUrl, {
    message: 'Repo URL must be an http(s) URL pointing to a Git repository or archive.',
  }),
  revision: z.string().max(256).optional(),
  username: z.string().max(256).optional(),
  password: z.string().max(1024).optional(),
})

const ImportRepoBodySchema = z.object({
  repo: RepoSchema,
})

const MAX_LISTED_FILES = 5000

function isImportableUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function isTarballUrl(url: string): boolean {
  const normalized = url.split('?')[0].toLowerCase()
  return TARBALL_EXTENSIONS.some(
    (extension) =>
      normalized !== extension && normalized.endsWith(extension)
  )
}

function buildSource(repo: z.infer<typeof RepoSchema>) {
  if (isTarballUrl(repo.url)) {
    return { type: 'tarball' as const, url: repo.url }
  }

  return {
    type: 'git' as const,
    url: repo.url,
    ...(repo.revision ? { revision: repo.revision } : {}),
    ...(repo.username ? { username: repo.username } : {}),
    ...(repo.password ? { password: repo.password } : {}),
  }
}

export async function POST(request: NextRequest) {
  const checkResult = await checkBotId()
  if (checkResult.isBot) {
    return NextResponse.json({ error: 'Bot detected' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'The request body is not valid JSON.' },
      { status: 400 }
    )
  }

  const result = ImportRepoBodySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      {
        error:
          'Invalid body. Expected `{ "repo": { "url": string, "revision"?: string, "username"?: string, "password"?: string } }`.',
      },
      { status: 400 }
    )
  }

  try {
    const sandbox = await Sandbox.create({
      timeout: 600000,
      ports: [VSCODE_PORT],
      source: buildSource(result.data.repo),
    })

    void trackSandbox(sandbox.sandboxId)

    const paths = await listFiles(sandbox)

    return NextResponse.json({
      sandboxId: sandbox.sandboxId,
      url: result.data.repo.url,
      files: paths,
    })
  } catch (error) {
    console.error('Error importing repo into the Sandbox:', error)
    return NextResponse.json(
      { error: 'Failed to import the repository.' },
      { status: 500 }
    )
  }
}

async function listFiles(sandbox: Sandbox): Promise<string[]> {
  const command = await sandbox.runCommand({
    cmd: 'find',
    args: [
      '.',
      '-type',
      'f',
      '-not',
      '-path',
      './.git/*',
      '-not',
      '-path',
      './.git',
      '-not',
      '-path',
      '*/node_modules/*',
    ],
  })

  if (command.exitCode !== 0) {
    return []
  }

  const stdout = await command.stdout()
  const paths = stdout
    .split('\n')
    .map((path) => path.trim())
    .filter((path) => path.length > 0 && path.startsWith('./'))
    .map((path) => path.slice(2))
    .sort()

  return paths.slice(0, MAX_LISTED_FILES)
}