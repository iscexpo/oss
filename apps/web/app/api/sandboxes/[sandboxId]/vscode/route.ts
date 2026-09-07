import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Sandbox, type CommandFinished } from '@vercel/sandbox'
import { VSCODE_DIR, VSCODE_PORT } from '@/lib/vscode'

export const maxDuration = 300

async function run(
  sandbox: Sandbox,
  cmd: string,
  args: string[]
): Promise<CommandFinished>
async function run(
  sandbox: Sandbox,
  cmd: string,
  args: string[],
  opts: { cwd?: string; detached: true }
): Promise<null>
async function run(
  sandbox: Sandbox,
  cmd: string,
  args: string[],
  opts: { cwd?: string; detached?: boolean } = {}
): Promise<CommandFinished | null> {
  const result = await sandbox.runCommand({
    cmd,
    args,
    cwd: opts.cwd,
    detached: opts.detached,
  })
  if (opts.detached) return null
  if (result.exitCode !== 0) {
    throw new Error(
      (await result.stderr()).trim() ||
        `Command failed: ${cmd} ${args.join(' ')}`
    )
  }
  return result
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ sandboxId: string }> }
) {
  const { sandboxId } = await params

  try {
    const sandbox = await Sandbox.get({ sandboxId })

    if (!sandbox.routes.some((route) => route.port === VSCODE_PORT)) {
      return NextResponse.json(
        {
          error:
            'The current sandbox does not expose the VS Code port. Ask the assistant to create a fresh sandbox, then try again.',
        },
        { status: 409 }
      )
    }

    await run(sandbox, 'bash', ['-lc', `mkdir -p ${VSCODE_DIR}`])

    const installed = await run(sandbox, 'bash', [
      '-lc',
      `[ -d ${VSCODE_DIR}/node_modules/code-server ] && echo INSTALLED || echo MISSING`,
    ])
    const isInstalled = (await installed.stdout()).trim() === 'INSTALLED'

    if (!isInstalled) {
      await run(sandbox, 'bash', [
        '-lc',
        `npm install --prefix ${VSCODE_DIR} --no-audit --no-fund code-server`,
      ])
    }

    const passwordFile = `${VSCODE_DIR}/.password`
    const existing = await run(sandbox, 'bash', [
      '-lc',
      `[ -f ${passwordFile} ] && echo FOUND || echo MISSING`,
    ])
    const passwordExists = (await existing.stdout()).trim() === 'FOUND'

    let password: string
    if (passwordExists) {
      const cat = await run(sandbox, 'bash', ['-lc', `cat ${passwordFile}`])
      password = (await cat.stdout()).trim()
    } else {
      password = randomBytes(16).toString('hex')
      await run(sandbox, 'bash', [
        '-lc',
        `printf '%s' '${password}' > ${passwordFile}`,
      ])
    }

    const running = await run(sandbox, 'bash', [
      '-lc',
      `pgrep -f "code-server.*${VSCODE_PORT}" >/dev/null && echo RUNNING || echo NOTRUNNING`,
    ])
    const isRunning = (await running.stdout()).trim() === 'RUNNING'

    if (!isRunning) {
      await run(sandbox, 'bash', [
        '-lc',
        `exec node ${VSCODE_DIR}/node_modules/code-server/out/node/entry.js --bind-addr 0.0.0.0:${VSCODE_PORT} --auth password --password '${password}' --disable-telemetry --disable-update-check --disable-workspace-trust /vercel/sandbox`,
      ], { cwd: '/vercel/sandbox', detached: true })
    }

    const url = sandbox.domain(VSCODE_PORT)
    return NextResponse.json({ url, password, ready: true })
  } catch (error) {
    console.error('Failed to start VS Code:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start VS Code in the sandbox.',
      },
      { status: 500 }
    )
  }
}