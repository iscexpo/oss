'use client'

import { useEffect, useRef } from 'react'
import { useSandboxStore } from '@/app/state'
import {
  getCommand,
  getCommandLogs,
  type SandboxLog,
} from './sandbox'

export function CommandLogsStream() {
  const { sandboxId, commands, addLog, upsertCommand } = useSandboxStore()
  const ref = useRef<Record<string, AsyncGenerator<SandboxLog>>>({})

  useEffect(() => {
    if (sandboxId) {
      for (const command of commands.filter(
        (command) => typeof command.exitCode === 'undefined'
      )) {
        if (!ref.current[command.cmdId]) {
          const iterator = getCommandLogs(sandboxId, command.cmdId)
          ref.current[command.cmdId] = iterator
          ;(async () => {
            for await (const log of iterator) {
              addLog({
                sandboxId: sandboxId,
                cmdId: command.cmdId,
                log: log,
              })
            }

            const log = await getCommand(sandboxId, command.cmdId)
            upsertCommand({
              sandboxId: log.sandboxId,
              cmdId: log.cmdId,
              exitCode: log.exitCode ?? 0,
              command: command.command,
              args: command.args,
            })
          })()
        }
      }
    }
  }, [sandboxId, commands, addLog, upsertCommand])

  return null
}