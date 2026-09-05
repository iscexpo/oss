import type { CommandLog } from '@/components/commands-logs/types'
import stripAnsi from 'strip-ansi'
import z from 'zod/v3'

const logSchema = z.object({
  data: z.string(),
  stream: z.enum(['stdout', 'stderr']),
  timestamp: z.number(),
})

export type SandboxLog = z.infer<typeof logSchema>

export async function* getCommandLogs(
  sandboxId: string,
  cmdId: string
): AsyncGenerator<CommandLog> {
  const response = await fetch(
    `/api/sandboxes/${sandboxId}/cmds/${cmdId}/logs`,
    { headers: { 'Content-Type': 'application/json' } }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch logs for command ${cmdId}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let line = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    line += decoder.decode(value, { stream: true })
    const lines = line.split('\n')
    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i]) {
        const parsed = logSchema.parse(JSON.parse(lines[i]))
        yield {
          data: stripAnsi(parsed.data),
          stream: parsed.stream,
          timestamp: parsed.timestamp,
        }
      }
    }
    line = lines[lines.length - 1]
  }
}

const cmdSchema = z.object({
  sandboxId: z.string(),
  cmdId: z.string(),
  startedAt: z.number(),
  exitCode: z.number().optional(),
})

export type SandboxCommand = z.infer<typeof cmdSchema>

export async function getCommand(sandboxId: string, cmdId: string) {
  const response = await fetch(`/api/sandboxes/${sandboxId}/cmds/${cmdId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch command ${cmdId}`)
  }
  const json = await response.json()
  return cmdSchema.parse(json)
}