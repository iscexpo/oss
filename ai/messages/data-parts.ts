import z from 'zod/v3'
import type { UIDataTypes } from 'ai'

export const errorSchema = z.object({
  message: z.string(),
})

const createSandboxSchema = z.object({
  sandboxId: z.string().optional(),
  status: z.enum(['loading', 'done', 'error']),
  error: errorSchema.optional(),
})

const generatingFilesSchema = z.object({
  paths: z.array(z.string()),
  status: z.enum(['generating', 'uploading', 'uploaded', 'done', 'error']),
  error: errorSchema.optional(),
})

const runCommandSchema = z.object({
  sandboxId: z.string(),
  commandId: z.string().optional(),
  command: z.string(),
  args: z.array(z.string()),
  status: z.enum(['executing', 'running', 'waiting', 'done', 'error']),
  exitCode: z.number().optional(),
  error: errorSchema.optional(),
})

const getSandboxUrlSchema = z.object({
  url: z.string().optional(),
  status: z.enum(['loading', 'done']),
})

const reportErrorsSchema = z.object({
  summary: z.string(),
  paths: z.array(z.string()).optional(),
})

/**
 * Shared map of custom data parts streamed from server tools to the client.
 * Uses `UIDataTypes` so AI SDK derives `data-<name>` part types automatically.
 */
export const dataPartSchema = {
  'create-sandbox': createSandboxSchema,
  'generating-files': generatingFilesSchema,
  'run-command': runCommandSchema,
  'get-sandbox-url': getSandboxUrlSchema,
  'report-errors': reportErrorsSchema,
} satisfies UIDataTypes

export type DataPart = {
  [Name in keyof typeof dataPartSchema]: z.infer<(typeof dataPartSchema)[Name]>
}
export type DataPartName = keyof DataPart
export type DataPartPayload<Name extends DataPartName> = DataPart[Name]
export type DataPartValue = DataPart[DataPartName]
