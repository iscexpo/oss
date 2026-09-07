import { createOpenAI } from '@ai-sdk/openai'
import { Models } from './constants'
import type { JSONValue } from 'ai'
import type { LanguageModelV3 } from '@ai-sdk/provider'

const gateway = createOpenAI({
  name: 'kilo',
  baseURL:
    process.env.KILO_GATEWAY_BASE_URL ?? 'https://api.kilo.ai/api/gateway',
  apiKey: process.env.KILO_API_KEY,
})

export interface ModelConfig {
  reasoningEffort?: 'low' | 'medium' | 'high'
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  [Models.OpenAIGPT53Codex]: { reasoningEffort: 'low' },
}

export interface ModelOptions {
  model: LanguageModelV3
  providerOptions?: Record<string, Record<string, JSONValue>>
  headers?: Record<string, string>
}

export function getModelOptions(
  modelId: string,
  options?: { reasoningEffort?: 'low' | 'medium' | 'high' }
): ModelOptions {
  const reasoningEffort =
    options?.reasoningEffort ?? MODEL_CONFIGS[modelId]?.reasoningEffort

  return {
    model: gateway.chat(modelId),
    ...(reasoningEffort
      ? { providerOptions: { openai: { reasoningEffort } } }
      : {}),
  }
}