import type { ChatUIMessage, ChatUIMessagePart } from '@/components/chat/types'
import type { DataPart } from './data-parts'

function errorsToText(data: DataPart['report-errors']): string {
  return (
    `There are errors in the generated code. This is the summary of the errors we have:\n` +
    `\`\`\`${data.summary}\`\`\`\n` +
    (data.paths?.length
      ? `The following files may contain errors:\n` +
        `\`\`\`${data.paths.join('\n')}\`\`\`\n`
      : '') +
    `Fix the errors reported.`
  )
}

/**
 * Converts the client `data-report-errors` parts into plain text so they can be
 * passed to the model, which cannot interpret custom UI data parts.
 */
export function toModelMessages(messages: ChatUIMessage[]): ChatUIMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.map((part): ChatUIMessagePart =>
      part.type === 'data-report-errors'
        ? { type: 'text', text: errorsToText(part.data) }
        : part
    ),
  }))
}