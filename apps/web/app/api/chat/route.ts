import { type ChatUIMessage } from '@/components/chat/types'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from 'ai'
import { DEFAULT_MODEL, MODEL_NAMES, SUPPORTED_MODELS } from '@/ai/constants'
import { toModelMessages } from '@/ai/messages/model-messages'
import { NextResponse } from 'next/server'
import { getModelOptions } from '@/ai/gateway'
import { checkBotId } from 'botid/server'
import { tools } from '@/ai/tools'
import prompt from './prompt.md'

type AutonomyMode = 'agent' | 'editor'

interface BodyData {
  messages: ChatUIMessage[]
  modelId?: string
  reasoningEffort?: 'low' | 'medium'
  autonomyMode?: AutonomyMode
}

export async function POST(req: Request) {
  const [checkResult, { messages, modelId = DEFAULT_MODEL, reasoningEffort, autonomyMode = 'agent' }] =
    await Promise.all([checkBotId(), req.json() as Promise<BodyData>])

  if (checkResult.isBot) {
    return NextResponse.json({ error: `Bot detected` }, { status: 403 })
  }

  if (!SUPPORTED_MODELS.includes(modelId)) {
    return NextResponse.json(
      { error: `Model ${modelId} not found.` },
      { status: 400 }
    )
  }

  const modeInstructions = autonomyMode === 'editor'
    ? `\n\nEDITOR MODE:\n- Act as an autonomous implementation editor. Inspect the existing project before changing it.\n- Prefer precise, minimal file edits over explanations.\n- Use the available sandbox and file tools to implement the requested change, then run the narrowest useful validation.\n- Never overwrite unrelated work or regenerate existing files without need.\n- Report changed files and validation results after completing the work.`
    : `\n\nAGENT MODE:\n- Act as an autonomous coding agent. Break the request into concrete steps and execute them with the available tools.\n- Inspect before editing, preserve existing work, and recover from errors with targeted fixes.\n- Continue through implementation and validation instead of stopping at a plan.\n- Summarize completed work and any remaining blocker only after the workflow is complete.`

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      originalMessages: messages,
      execute: async ({ writer }) => {
        const result = streamText({
          ...getModelOptions(modelId, { reasoningEffort }),
system: `${prompt}${modeInstructions}`,
            messages: await convertToModelMessages(toModelMessages(messages)),
            stopWhen: stepCountIs(20),
          tools: tools({ modelId, writer }),
          onError: (error) => {
            console.error('Error communicating with AI')
            console.error(JSON.stringify(error, null, 2))
          },
        })
        result.consumeStream()
        writer.merge(
          result.toUIMessageStream({
            sendReasoning: true,
            sendStart: false,
            messageMetadata: () => ({
              model: MODEL_NAMES[modelId] ?? modelId,
            }),
          })
        )
      },
    }),
  });
}
