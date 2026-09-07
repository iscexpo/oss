import { z } from 'zod'

export const platformErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  retryable: z.boolean().default(false),
})

export const sandboxSchema = z.object({
  id: z.string(),
  status: z.enum(['starting', 'running', 'stopped', 'failed']),
})

export const commandResultSchema = z.object({
  commandId: z.string(),
  exitCode: z.number().nullable(),
  stdout: z.string(),
  stderr: z.string(),
})

export const fileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
})

export type PlatformError = z.infer<typeof platformErrorSchema>
export type Sandbox = z.infer<typeof sandboxSchema>
export type CommandResult = z.infer<typeof commandResultSchema>
export type FilePayload = z.infer<typeof fileSchema>

export interface V0PlatformTransport {
  createSandbox(signal?: AbortSignal): Promise<Sandbox>
  runCommand(
    sandboxId: string,
    command: string,
    args: string[],
    signal?: AbortSignal,
  ): Promise<CommandResult>
  readFile(sandboxId: string, path: string, signal?: AbortSignal): Promise<FilePayload>
  writeFile(sandboxId: string, file: FilePayload, signal?: AbortSignal): Promise<void>
  getPreviewUrl(sandboxId: string, port: number, signal?: AbortSignal): Promise<string>
}

export class V0PlatformError extends Error {
  readonly code: string
  readonly retryable: boolean

  constructor(error: PlatformError) {
    super(error.message)
    this.name = 'V0PlatformError'
    this.code = error.code
    this.retryable = error.retryable
  }
}

export function parsePlatformError(value: unknown): V0PlatformError {
  const parsed = platformErrorSchema.safeParse(value)
  if (parsed.success) return new V0PlatformError(parsed.data)
  return new V0PlatformError({
    code: 'UNKNOWN_ERROR',
    message: 'The platform request failed.',
    retryable: false,
  })
}
