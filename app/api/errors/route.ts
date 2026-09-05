import { Models } from '@/ai/constants'
import { NextResponse } from 'next/server'
import { checkBotId } from 'botid/server'
import { generateText, Output } from 'ai'
import { linesSchema, resultSchema } from '@/components/error-monitor/schemas'
import prompt from './prompt.md'
import { getModelOptions } from '@/ai/gateway'

export async function POST(req: Request) {
  const checkResult = await checkBotId()
  if (checkResult.isBot) {
    return NextResponse.json({ error: `Bot detected` }, { status: 403 })
  }

  const body = await req.json()
  const parsedBody = linesSchema.safeParse(body)
  if (!parsedBody.success) {
    return NextResponse.json({ error: `Invalid request` }, { status: 400 })
  }

  const result = await generateText({
    ...getModelOptions(Models.OpenAIGPT53Codex),
    system: prompt,
    messages: [{ role: 'user', content: JSON.stringify(parsedBody.data) }],
    output: Output.object({ schema: resultSchema }),
  })

  return NextResponse.json(result.output, {
    status: 200,
  })
}
