import { describe, expect, it, vi } from 'vitest'
import { V0PlatformClient } from './client'
import { V0PlatformError, type V0PlatformTransport } from './contracts'

function transport(overrides: Partial<V0PlatformTransport> = {}): V0PlatformTransport {
  return {
    createSandbox: vi.fn().mockResolvedValue({ id: 'sbx_1', status: 'running' }),
    runCommand: vi.fn().mockResolvedValue({ commandId: 'cmd_1', exitCode: 0, stdout: 'ok', stderr: '' }),
    readFile: vi.fn().mockResolvedValue({ path: 'file.ts', content: 'ok' }),
    writeFile: vi.fn().mockResolvedValue(undefined),
    getPreviewUrl: vi.fn().mockResolvedValue('https://preview.example.com'),
    ...overrides,
  }
}

describe('V0PlatformClient', () => {
  it('validates transport responses', async () => {
    const client = new V0PlatformClient(transport())
    await expect(client.createSandbox()).resolves.toMatchObject({ id: 'sbx_1' })
    await expect(client.runCommand('sbx_1', 'npm', ['test'])).resolves.toMatchObject({ exitCode: 0 })
    await expect(client.readFile('sbx_1', 'file.ts')).resolves.toMatchObject({ path: 'file.ts' })
    await expect(client.writeFile('sbx_1', { path: 'file.ts', content: 'new' })).resolves.toBeUndefined()
    await expect(client.getPreviewUrl('sbx_1', 3000)).resolves.toBe('https://preview.example.com')
  })

  it('retries retryable failures and eventually succeeds', async () => {
    const createSandbox = vi.fn()
      .mockRejectedValueOnce({ code: 'TIMEOUT', message: 'try again', retryable: true })
      .mockResolvedValue({ id: 'sbx_2', status: 'running' })
    await expect(new V0PlatformClient(transport({ createSandbox }), 1).createSandbox()).resolves.toMatchObject({ id: 'sbx_2' })
    expect(createSandbox).toHaveBeenCalledTimes(2)
  })

  it('stops retrying non-retryable failures', async () => {
    const createSandbox = vi.fn().mockRejectedValue({ code: 'INVALID_INPUT', message: 'bad', retryable: false })
    await expect(new V0PlatformClient(transport({ createSandbox })).createSandbox()).rejects.toMatchObject({ code: 'INVALID_INPUT' })
    expect(createSandbox).toHaveBeenCalledTimes(1)
  })

  it('preserves normalized platform errors', async () => {
    const error = new V0PlatformError({ code: 'INVALID_INPUT', message: 'bad', retryable: false })
    const createSandbox = vi.fn().mockRejectedValue(error)
    await expect(new V0PlatformClient(transport({ createSandbox })).createSandbox()).rejects.toBe(error)
  })

  it('surfaces exhausted retries and invalid preview URLs', async () => {
    const createSandbox = vi.fn().mockRejectedValue({ code: 'TIMEOUT', message: 'still down', retryable: true })
    await expect(new V0PlatformClient(transport({ createSandbox }), 1).createSandbox()).rejects.toMatchObject({ code: 'TIMEOUT' })
    const getPreviewUrl = vi.fn().mockResolvedValue('not a url')
    await expect(new V0PlatformClient(transport({ getPreviewUrl })).getPreviewUrl('sbx_1', 3000)).rejects.toMatchObject({ code: 'UNKNOWN_ERROR' })
  })
})
