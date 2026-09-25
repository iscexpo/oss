import { unzipSync, type Unzipped } from 'fflate'
import { NextResponse, type NextRequest } from 'next/server'
import { Sandbox } from '@vercel/sandbox'
import { checkBotId } from 'botid/server'
import { VSCODE_PORT } from '@/lib/vscode'
import { trackSandbox } from '@/lib/sandboxes/registry'
import z from 'zod/v3'

const MAX_FILES = 1000
const MAX_TOTAL_BYTES = 50 * 1024 * 1024
const MAX_FILE_BYTES = 5 * 1024 * 1024

const ImportedFileSchema = z.object({
  path: z.string().min(1).max(4096),
  content: z.string().max(MAX_FILE_BYTES),
})

const ImportFilesBodySchema = z.object({
  files: z.array(ImportedFileSchema).min(1).max(MAX_FILES),
})

const ZIP_MIME_TYPES = ['application/zip', 'application/x-zip-compressed']

interface ImportedFile {
  path: string
  content: string
}

interface SandboxWriteFile {
  path: string
  content: Buffer
}

interface ExtractedFiles {
  files: ImportedFile[]
  writeFiles: SandboxWriteFile[]
}

function sanitizePath(name: string): string | null {
  const normalized = name.replaceAll('\\', '/')
  if (!normalized || normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
    return null
  }
  if (normalized.endsWith('/')) {
    return null
  }

  const parts: string[] = []
  for (const part of normalized.split('/')) {
    if (!part || part === '.') {
      continue
    }
    if (part === '..') {
      if (parts.length === 0) {
        return null
      }
      parts.pop()
      continue
    }
    parts.push(part)
  }

  if (parts.length === 0) {
    return null
  }
  return parts.join('/')
}

function extractZipUpload(buffer: Uint8Array): ExtractedFiles {
  let entries: Unzipped
  try {
    entries = unzipSync(buffer)
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `The uploaded archive is not a valid ZIP file: ${error.message}`
        : 'The uploaded archive is not a valid ZIP file.'
    )
  }

  const names = Object.keys(entries)
  if (names.length === 0) {
    throw new Error('The uploaded archive is empty.')
  }
  if (names.length > MAX_FILES) {
    throw new Error(`The uploaded archive contains more than ${MAX_FILES} files.`)
  }

  const files: ImportedFile[] = []
  const writeFiles: SandboxWriteFile[] = []
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let totalBytes = 0

  for (const name of names) {
    const path = sanitizePath(name)
    if (!path) {
      continue
    }

    const data = entries[name]
    totalBytes += data.byteLength
    if (totalBytes > MAX_TOTAL_BYTES) {
      throw new Error(
        `The uploaded archive exceeds the ${MAX_TOTAL_BYTES / (1024 * 1024)}MB limit.`
      )
    }
    if (data.byteLength > MAX_FILE_BYTES) {
      continue
    }

    writeFiles.push({ path, content: Buffer.from(data) })

    let content: string
    try {
      content = decoder.decode(data)
    } catch {
      continue
    }
    files.push({ path, content })
  }

  return { files, writeFiles }
}

async function parseJsonBody(request: NextRequest): Promise<ExtractedFiles> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new Error('The request body is not valid JSON.')
  }

  const result = ImportFilesBodySchema.safeParse(body)
  if (!result.success) {
    throw new Error(
      'Invalid body. Expected `{ "files": [{ "path": string, "content": string }] }`.'
    )
  }

  const files: ImportedFile[] = []
  const writeFiles: SandboxWriteFile[] = []
  for (const file of result.data.files) {
    const path = sanitizePath(file.path)
    if (!path) {
      throw new Error(`Invalid file path: "${file.path}"`)
    }
    const content = Buffer.from(file.content, 'utf-8')
    files.push({ path, content: file.content })
    writeFiles.push({ path, content })
  }

  return { files, writeFiles }
}

async function parseZipUpload(request: NextRequest): Promise<ExtractedFiles> {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to read the upload: ${error.message}`
        : 'Failed to read the upload.'
    )
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    throw new Error('Expected a file uploaded with the `file` field.')
  }
  if (!file.name.toLowerCase().endsWith('.zip') && !ZIP_MIME_TYPES.includes(file.type)) {
    throw new Error('The uploaded file must be a ZIP archive.')
  }

  const buffer = new Uint8Array(await file.arrayBuffer())
  return extractZipUpload(buffer)
}

export async function POST(request: NextRequest) {
  const checkResult = await checkBotId()
  if (checkResult.isBot) {
    return NextResponse.json({ error: 'Bot detected' }, { status: 403 })
  }

  const contentType = request.headers.get('content-type') ?? ''

  let extracted: ExtractedFiles
  try {
    if (contentType.includes('multipart/form-data')) {
      extracted = await parseZipUpload(request)
    } else if (contentType.includes('application/json')) {
      extracted = await parseJsonBody(request)
    } else {
      return NextResponse.json(
        {
          error:
            'Unsupported content type. Use `multipart/form-data` with a ZIP `file` field or `application/json` with a `files` array.',
        },
        { status: 415 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import files.' },
      { status: 400 }
    )
  }

  if (extracted.files.length === 0) {
    return NextResponse.json({ error: 'No readable files found.' }, { status: 400 })
  }

  try {
    const sandbox = await Sandbox.create({
      timeout: 600000,
      ports: [VSCODE_PORT],
    })

    await sandbox.writeFiles(extracted.writeFiles)

    return NextResponse.json({
      sandboxId: sandbox.sandboxId,
      files: extracted.files,
    })
  } catch (error) {
    console.error('Error importing files into the Sandbox:', error)
    return NextResponse.json({ error: 'Failed to create the project sandbox.' }, { status: 500 })
  }
}