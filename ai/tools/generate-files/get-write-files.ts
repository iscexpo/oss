import type { DataPart } from '../../messages/data-parts'
import type { File } from './get-contents'
import type { Sandbox } from '@vercel/sandbox'
import type { UIMessageStreamWriter, UIMessage } from 'ai'
import { emitData } from '../emit-data'
import { getRichError } from '../get-rich-error'

interface Params {
  sandbox: Sandbox
  toolCallId: string
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export function getWriteFiles({ sandbox, toolCallId, writer }: Params) {
  return async function writeFiles(params: {
    written: string[]
    files: File[]
    paths: string[]
  }) {
    const paths = params.written.concat(params.files.map((file) => file.path))
    emitData(writer, toolCallId, 'generating-files', {
      paths,
      status: 'uploading',
    })

    try {
      await sandbox.writeFiles(
        params.files.map((file) => ({
          content: Buffer.from(file.content, 'utf8'),
          path: file.path,
        }))
      )
    } catch (error) {
      const richError = getRichError({
        action: 'write files to sandbox',
        args: params,
        error,
      })

      emitData(writer, toolCallId, 'generating-files', {
        error: richError.error,
        status: 'error',
        paths: params.paths,
      })

      return richError.message
    }

    emitData(writer, toolCallId, 'generating-files', {
      paths,
      status: 'uploaded',
    })
  }
}
