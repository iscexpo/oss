import { createOpenAI } from "@ai-sdk/openai";
import type { JSONValue } from "ai";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import { Models, OPENROUTER_MODEL_PREFIX } from "./constants";

const gateway = createOpenAI({
  name: "kilo",
  baseURL: process.env.KILO_GATEWAY_BASE_URL ?? "https://api.kilo.ai/api/gateway",
  apiKey: process.env.KILO_API_KEY,
});

const openrouter = createOpenAI({
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export interface ModelOptions {
  model: LanguageModelV3;
  providerOptions?: Record<string, Record<string, JSONValue>>;
  headers?: Record<string, string>;
}

/**
 * NOTE: reasoning effort is intentionally NOT forwarded. The OpenAI provider
 * emits both `reasoning_effort` (top-level) and `reasoning.effort` (nested)
 * when `reasoningEffort` is set, but the Kilo gateway derives
 * `reasoning: { effort }` itself and rejects any request that also carries a
 * top-level `reasoning_effort` ("conflicting values"). Letting the gateway
 * pick the effort avoids the hard error.
 *
 * Models prefixed with `openrouter/` are routed to the OpenRouter provider
 * (prefix stripped before the request); everything else goes to Kilo.
 */
export function getModelOptions(
  modelId: string,
  _options?: { reasoningEffort?: "low" | "medium" | "high" },
): ModelOptions {
  if (modelId.startsWith(OPENROUTER_MODEL_PREFIX)) {
    const openrouterModel =
      modelId === Models.OpenRouterFree ? modelId : modelId.slice(OPENROUTER_MODEL_PREFIX.length);
    return {
      model: openrouter.chat(openrouterModel),
    };
  }

  return {
    model: gateway.chat(modelId),
  };
}
