import { NextRequest, NextResponse } from "next/server";
import { Sandbox, type CommandFinished } from "@vercel/sandbox";
import { CODE_SERVER_BIN, CODE_SERVER_TARBALL_URL, VSCODE_DIR, VSCODE_PORT } from "@/lib/vscode";

export const maxDuration = 300;

async function run(sandbox: Sandbox, cmd: string, args: string[]): Promise<CommandFinished>;
async function run(
  sandbox: Sandbox,
  cmd: string,
  args: string[],
  opts: { cwd?: string; detached: true },
): Promise<null>;
async function run(
  sandbox: Sandbox,
  cmd: string,
  args: string[],
  opts: { cwd?: string; detached?: boolean } = {},
): Promise<CommandFinished | null> {
  const result = await sandbox.runCommand({
    cmd,
    args,
    cwd: opts.cwd,
    detached: opts.detached,
  });
  if (opts.detached) return null;
  if (result.exitCode !== 0) {
    throw new Error((await result.stderr()).trim() || `Command failed: ${cmd} ${args.join(" ")}`);
  }
  return result;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ sandboxId: string }> },
) {
  const { sandboxId } = await params;

  try {
    const sandbox = await Sandbox.get({ sandboxId });

    if (!sandbox.routes.some((route) => route.port === VSCODE_PORT)) {
      return NextResponse.json(
        {
          error:
            "The current sandbox does not expose the VS Code port. Ask the assistant to create a fresh sandbox, then try again.",
        },
        { status: 409 },
      );
    }

    await run(sandbox, "bash", ["-lc", `mkdir -p ${VSCODE_DIR}/bin`]);

    const installed = await run(sandbox, "bash", [
      "-lc",
      `[ -f ${CODE_SERVER_BIN} ] && echo INSTALLED || echo MISSING`,
    ]);
    const isInstalled = (await installed.stdout()).trim() === "INSTALLED";

    if (!isInstalled) {
      await run(sandbox, "bash", [
        "-lc",
        `(command -v curl >/dev/null 2>&1 && curl -fsSL -o ${VSCODE_DIR}/bin/code-server.tgz '${CODE_SERVER_TARBALL_URL}') || (command -v wget >/dev/null 2>&1 && wget -qO ${VSCODE_DIR}/bin/code-server.tgz '${CODE_SERVER_TARBALL_URL}')`,
      ]);
      await run(sandbox, "bash", [
        "-lc",
        `tar xzf ${VSCODE_DIR}/bin/code-server.tgz -C ${VSCODE_DIR}/bin && mv ${VSCODE_DIR}/bin/code-server-* ${VSCODE_DIR}/bin/code-server && rm -f ${VSCODE_DIR}/bin/code-server.tgz`,
      ]);
    }

    const running = await run(sandbox, "bash", [
      "-lc",
      `pgrep -f "[c]ode-server.*${VSCODE_PORT}" >/dev/null && echo RUNNING || echo NOTRUNNING`,
    ]);
    const isRunning = (await running.stdout()).trim() === "RUNNING";

    if (!isRunning) {
      await run(
        sandbox,
        "bash",
        [
          "-lc",
          `exec ${CODE_SERVER_BIN} --bind-addr 0.0.0.0:${VSCODE_PORT} --auth none --disable-telemetry --disable-update-check --disable-workspace-trust /vercel/sandbox`,
        ],
        { cwd: "/vercel/sandbox", detached: true },
      );
    }

    return NextResponse.json({ url: sandbox.domain(VSCODE_PORT), ready: true });
  } catch (error) {
    console.error("Failed to start VS Code:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to start VS Code in the sandbox.",
      },
      { status: 500 },
    );
  }
}
