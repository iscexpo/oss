import {
  commandResultSchema,
  fileSchema,
  parsePlatformError,
  sandboxSchema,
  type CommandResult,
  type FilePayload,
  type Sandbox,
  V0PlatformError,
  type V0PlatformTransport,
} from './contracts'

const RETRYABLE_CODES = new Set(['TIMEOUT', 'RATE_LIMITED', 'NETWORK_ERROR'])

export class V0PlatformClient implements V0PlatformTransport {
  constructor(
    private readonly transport: V0PlatformTransport,
    private readonly maxRetries = 2,
  ) {}

  createSandbox(signal?: AbortSignal) {
    return this.request(() => this.transport.createSandbox(signal), sandboxSchema.parse)
  }

  runCommand(sandboxId: string, command: string, args: string[], signal?: AbortSignal) {
    return this.request(
      () => this.transport.runCommand(sandboxId, command, args, signal),
      commandResultSchema.parse,
    )
  }

  readFile(sandboxId: string, path: string, signal?: AbortSignal) {
    return this.request(() => this.transport.readFile(sandboxId, path, signal), fileSchema.parse)
  }

  writeFile(sandboxId: string, file: FilePayload, signal?: AbortSignal) {
    return this.request(() => this.transport.writeFile(sandboxId, file, signal), () => undefined)
  }

  getPreviewUrl(sandboxId: string, port: number, signal?: AbortSignal) {
    return this.request(() => this.transport.getPreviewUrl(sandboxId, port, signal), (url) => {
      if (typeof url !== 'string' || !URL.canParse(url)) throw new Error('Invalid preview URL')
      return url
    })
  }

  private async request<T>(operation: () => Promise<T>, parse: (value: T) => T): Promise<T> {
    let attempt = 0
    while (true) {
      try {
        return parse(await operation())
      } catch (error) {
        const normalized = error instanceof V0PlatformError ? error : parsePlatformError(error)
        if (!normalized.retryable && !RETRYABLE_CODES.has(normalized.code)) throw normalized
        if (attempt >= this.maxRetries) throw normalized
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 50))
        attempt += 1
      }
    }
  }
}
