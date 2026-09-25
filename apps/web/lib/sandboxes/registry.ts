import {
  isDbConfigured,
  recordSandbox as persistSandbox,
} from '@/lib/projects/db'
import { Sandbox } from '@vercel/sandbox'

export async function trackSandbox(sandboxId: string): Promise<void> {
  if (!isDbConfigured()) {
    return
  }
  try {
    await persistSandbox(sandboxId)
  } catch (error) {
    console.error('Failed to track sandbox:', error)
  }
}

export async function stopSandbox(sandboxId: string): Promise<boolean> {
  try {
    const sandbox = await Sandbox.get({ sandboxId })
    await sandbox.stop()
    return true
  } catch (error) {
    console.error('Failed to stop sandbox:', error)
    return false
  }
}