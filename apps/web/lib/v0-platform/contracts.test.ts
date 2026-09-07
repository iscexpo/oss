import { describe, expect, it } from 'vitest'
import {
  commandResultSchema,
  fileSchema,
  parsePlatformError,
  sandboxSchema,
  V0PlatformError,
} from './contracts'

describe('platform contracts', () => {
  it('parses valid sandbox and command payloads', () => {
    expect(sandboxSchema.parse({ id: 'sbx_1', status: 'running' })).toEqual({ id: 'sbx_1', status: 'running' })
    expect(commandResultSchema.parse({ commandId: 'cmd_1', exitCode: 0, stdout: 'ok', stderr: '' }).exitCode).toBe(0)
    expect(fileSchema.parse({ path: 'app/page.tsx', content: 'export default null' }).path).toContain('page')
  })

  it('rejects malformed payloads', () => {
    expect(sandboxSchema.safeParse({ id: '', status: 'unknown' }).success).toBe(false)
    expect(fileSchema.safeParse({ path: '', content: 1 }).success).toBe(false)
  })

  it('normalizes structured and unknown errors', () => {
    const structured = parsePlatformError({ code: 'TIMEOUT', message: 'Timed out', retryable: true })
    expect(structured).toBeInstanceOf(V0PlatformError)
    expect(structured.code).toBe('TIMEOUT')
    expect(structured.retryable).toBe(true)

    const unknown = parsePlatformError(new Error('secret internal detail'))
    expect(unknown.code).toBe('UNKNOWN_ERROR')
    expect(unknown.message).toBe('The platform request failed.')
  })
})
