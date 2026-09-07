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

interface BodyData {
  messages: ChatUIMessage[]
  modelId?: string
  reasoningEffort?: 'low' | 'medium'
}

interface V0BodyData {
  message: string
  modelConfiguration?: { modelId?: string }
}

export async function handleChat(req: Request) {
  const body = await req.json().catch(() => null) as BodyData | V0BodyData | null

  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Detect v0 SDK format: { message, modelConfiguration? }
  if ('message' in body && typeof (body as V0BodyData).message === 'string') {
    const v0Body = body as V0BodyData
    const modelId = v0Body.modelConfiguration?.modelId ?? DEFAULT_MODEL

    if (!SUPPORTED_MODELS.includes(modelId)) {
      return NextResponse.json(
        { error: `Model ${modelId} not found.` },
        { status: 400 }
      )
    }

    return createUIMessageStreamResponse({
      stream: createUIMessageStream({
        originalMessages: [],
        execute: async ({ writer }) => {
          const result = streamText({
            ...getModelOptions(modelId, {}),
            system: prompt,
            messages: [],
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
              messageMetadata: () => undefined,
            })
          )
        },
      }),
    })
  }

  // Original format: { messages, modelId?, reasoningEffort? }
  const chatBody = body as BodyData
  const [checkResult, { messages, modelId = DEFAULT_MODEL, reasoningEffort }] =
    await Promise.all([checkBotId(), Promise.resolve(chatBody)])

  if (checkResult.isBot) {
    return NextResponse.json({ error: `Bot detected` }, { status: 403 })
  }

  if (!SUPPORTED_MODELS.includes(modelId)) {
    return NextResponse.json(
      { error: `Model ${modelId} not found.` },
      { status: 400 }
    )
  }

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      originalMessages: messages,
      execute: async ({ writer }) => {
        const result = streamText({
          ...getModelOptions(modelId, { reasoningEffort }),
          system: prompt,
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
            messageMetadata: () => undefined,
          })
        )
      },
    }),
  })
}
