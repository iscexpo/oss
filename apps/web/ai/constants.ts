export enum Models {
  KiloAutoFree = 'kilo-auto/free',
  AnthropicClaudeOpus46 = 'anthropic/claude-opus-4.6',
  AnthropicClaudeSonnet46 = 'anthropic/claude-sonnet-4.6',
  OpenAIGPT53Codex = 'openai/gpt-5.3-codex',
  XaiGrok46 = 'x-ai/grok-4.6',
}

export const DEFAULT_MODEL = Models.KiloAutoFree

export const SUPPORTED_MODELS: string[] = [
  Models.KiloAutoFree,
  Models.AnthropicClaudeOpus46,
  Models.AnthropicClaudeSonnet46,
  Models.OpenAIGPT53Codex,
  Models.XaiGrok46,
]

export const MODEL_NAMES: Record<string, string> = {
  [Models.KiloAutoFree]: 'Kilo Auto Free',
  [Models.AnthropicClaudeOpus46]: 'Claude Opus 4.6',
  [Models.AnthropicClaudeSonnet46]: 'Claude Sonnet 4.6',
  [Models.OpenAIGPT53Codex]: 'GPT-5.3 Codex',
  [Models.XaiGrok46]: 'Grok 4.6',
}

export const TEST_PROMPTS = [
  'Generate a Next.js app that allows to list and search Pokemons',
  'Create a `golang` server that responds with "Hello World" to any request',
]
