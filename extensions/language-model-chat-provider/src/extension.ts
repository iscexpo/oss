import * as vscode from "vscode";

export const VENDOR = "vibe";

const SETTING_SECTION = "languageModelChatProvider";

interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxOutputTokens: number;
}

function loadConfig(): ProviderConfig {
  const config = vscode.workspace.getConfiguration(SETTING_SECTION);
  return {
    baseUrl: config.get<string>("baseUrl", "https://api.kilo.ai/api/gateway"),
    apiKey: config.get<string>("apiKey", ""),
    model: config.get<string>("model", "kilo-auto/free"),
    maxOutputTokens: config.get<number>("maxOutputTokens", 8192),
  };
}

class VibeLanguageModelChatProvider
  implements vscode.LanguageModelChatProvider<vscode.LanguageModelChatInformation>
{
  private readonly changeEmitter = new vscode.EventEmitter<void>();

  readonly onDidChangeLanguageModelChatInformation = this.changeEmitter.event;

  notifyChanged(): void {
    this.changeEmitter.fire();
  }

  async provideLanguageModelChatInformation(
    _options: vscode.PrepareLanguageModelChatModelOptions,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelChatInformation[]> {
    const config = loadConfig();
    return [
      {
        id: VENDOR,
        name: config.model,
        family: config.model.split("/")[0] ?? "openai-compatible",
        detail: safeHost(config.baseUrl),
        version: "1",
        maxInputTokens: 128000,
        maxOutputTokens: config.maxOutputTokens,
        capabilities: {
          toolCalling: true,
        },
      },
    ];
  }

  async provideLanguageModelChatResponse(
    model: vscode.LanguageModelChatInformation,
    messages: readonly vscode.LanguageModelChatRequestMessage[],
    options: vscode.ProvideLanguageModelChatResponseOptions,
    progress: vscode.Progress<vscode.LanguageModelResponsePart>,
    token: vscode.CancellationToken
  ): Promise<void> {
    const config = loadConfig();
    await streamChatCompletion(config, model, messages, options, progress, token);
  }

  async provideTokenCount(
    _model: vscode.LanguageModelChatInformation,
    text: string | vscode.LanguageModelChatRequestMessage,
    _token: vscode.CancellationToken
  ): Promise<number> {
    const length =
      typeof text === "string" ? text.length : countMessageLength(text);
    return Math.ceil(length / 4);
  }
}

function safeHost(baseUrl: string): string | undefined {
  try {
    return new URL(baseUrl).host;
  } catch {
    return undefined;
  }
}

function countMessageLength(message: vscode.LanguageModelChatRequestMessage): number {
  return message.content.reduce<number>((total, part) => {
    if (part instanceof vscode.LanguageModelTextPart) {
      return total + part.value.length;
    }
    try {
      return total + JSON.stringify(part).length;
    } catch {
      return total;
    }
  }, 0);
}

interface ToolCallAccumulator {
  id?: string;
  name?: string;
  arguments?: string;
}

interface ChatCompletionChunk {
  choices?: Array<{
    delta?: {
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason?: string | null;
  }>;
}

async function streamChatCompletion(
  config: ProviderConfig,
  model: vscode.LanguageModelChatInformation,
  messages: readonly vscode.LanguageModelChatRequestMessage[],
  options: vscode.ProvideLanguageModelChatResponseOptions,
  progress: vscode.Progress<vscode.LanguageModelResponsePart>,
  token: vscode.CancellationToken
): Promise<void> {
  if (!config.apiKey) {
    throw new Error(
      "No API key configured. Set the 'languageModelChatProvider.apiKey' setting, then run the 'Language Model Chat Provider: Configure Language Model' command for details."
    );
  }

  const controller = new AbortController();
  const onCancel = token.onCancellationRequested(() => controller.abort());

  try {
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    const body: Record<string, unknown> = {
      model: config.model,
      messages: toOpenAIMessages(messages),
      stream: true,
      max_tokens: config.maxOutputTokens,
    };

    const tools = toOpenAITools(options.tools);
    if (tools && tools.length > 0) {
      body["tools"] = tools;
      if (options.toolMode === vscode.LanguageModelChatToolMode.Required) {
        body["tool_choice"] = "required";
      }
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Language model request failed (${response.status}) for model "${config.model}". ${detail.slice(0, 500)}`
      );
    }

    if (!response.body) {
      throw new Error("Language model response contained no body.");
    }

    await consumeSse(response.body, token, progress);
  } finally {
    onCancel.dispose();
    controller.abort();
  }
}

function toOpenAIMessages(
  messages: readonly vscode.LanguageModelChatRequestMessage[]
): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];

  for (const message of messages) {
    const role =
      message.role === vscode.LanguageModelChatMessageRole.Assistant
        ? "assistant"
        : "user";

    const texts: string[] = [];
    const toolCalls: Array<Record<string, unknown>> = [];
    const hasData = message.content.some(
      (part) => part instanceof vscode.LanguageModelDataPart
    );

    for (const part of message.content) {
      if (part instanceof vscode.LanguageModelTextPart) {
        texts.push(part.value);
      } else if (part instanceof vscode.LanguageModelToolResultPart) {
        out.push({
          role: "tool",
          tool_call_id: part.callId,
          content: toolResultToText(part),
        });
      } else if (part instanceof vscode.LanguageModelToolCallPart) {
        toolCalls.push({
          id: part.callId,
          type: "function",
          function: {
            name: part.name,
            arguments: JSON.stringify(part.input),
          },
        });
      }
    }

    if (hasData) {
      texts.push("[Image data omitted by the language model chat provider]");
    }

    if (toolCalls.length > 0) {
      out.push({
        role: "assistant",
        content: texts.length > 0 ? texts.join("\n") : null,
        tool_calls: toolCalls,
      });
    } else if (texts.length > 0 || role === "user") {
      out.push({ role, content: texts.join("\n") });
    }
  }

  return out;
}

function toolResultToText(part: vscode.LanguageModelToolResultPart): string {
  return part.content
    .map((value) =>
      value instanceof vscode.LanguageModelTextPart
        ? value.value
        : stringifySafely(value)
    )
    .join("\n");
}

function stringifySafely(value: unknown): string {
  try {
    const serialized = JSON.stringify(value);
    return serialized ?? String(value);
  } catch {
    return String(value);
  }
}

function toOpenAITools(
  tools: readonly vscode.LanguageModelChatTool[] | undefined
): Array<Record<string, unknown>> | undefined {
  if (!tools || tools.length === 0) {
    return undefined;
  }
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema ?? { type: "object", properties: {} },
    },
  }));
}

async function consumeSse(
  body: ReadableStream<Uint8Array>,
  token: vscode.CancellationToken,
  progress: vscode.Progress<vscode.LanguageModelResponsePart>
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const toolAccumulators = new Map<number, ToolCallAccumulator>();
  let buffer = "";

  const flushToolCalls = () => {
    for (const accumulator of toolAccumulators.values()) {
      progress.report(
        new vscode.LanguageModelToolCallPart(
          accumulator.id ?? "",
          accumulator.name ?? "",
          safeParse(accumulator.arguments)
        )
      );
    }
    toolAccumulators.clear();
  };

  try {
    while (true) {
      if (token.isCancellationRequested) {
        return;
      }

      const result = await reader.read();
      if (result.done) {
        break;
      }

      buffer += decoder.decode(result.value, { stream: true });

      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        newlineIndex = buffer.indexOf("\n");

        if (!line.startsWith("data:")) {
          continue;
        }

        const data = line.slice("data:".length).trim();
        if (data === "[DONE]") {
          flushToolCalls();
          return;
        }

        let chunk: ChatCompletionChunk;
        try {
          chunk = JSON.parse(data) as ChatCompletionChunk;
        } catch {
          continue;
        }

        const choice = chunk.choices?.[0];
        const delta = choice?.delta;
        if (delta?.content) {
          progress.report(new vscode.LanguageModelTextPart(delta.content));
        }
        if (delta?.tool_calls) {
          for (const call of delta.tool_calls) {
            let accumulator = toolAccumulators.get(call.index);
            if (!accumulator) {
              accumulator = {};
              toolAccumulators.set(call.index, accumulator);
            }
            accumulator.id ??= call.id;
            accumulator.name ??= call.function?.name;
            if (call.function?.arguments) {
              accumulator.arguments =
                (accumulator.arguments ?? "") + call.function.arguments;
            }
          }
        }
        if (choice?.finish_reason === "tool_calls") {
          flushToolCalls();
        }
      }
    }
  } finally {
    reader.releaseLock();
    flushToolCalls();
  }
}

function safeParse(value: string | undefined): object {
  if (!value) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? (parsed as object) : {};
  } catch {
    return {};
  }
}

async function sendTestRequest(): Promise<void> {
  const models = await vscode.lm.selectChatModels({ vendor: VENDOR });
  if (models.length === 0) {
    vscode.window.showErrorMessage(
      "No language model from the Vibe Coding provider is available. Check the model picker and make sure 'languageModelChatProvider.apiKey' is set."
    );
    return;
  }

  const chat = models[0];
  const tokenSource = new vscode.CancellationTokenSource();
  const response = await chat.sendRequest(
    [vscode.LanguageModelChatMessage.User("Reply with exactly: pong")],
    {},
    tokenSource.token
  );

  let text = "";
  for await (const chunk of response.text) {
    text += chunk;
  }

  vscode.window.showInformationMessage(
    `Language Model Chat Provider test via "${chat.name}": ${text}`
  );
  tokenSource.dispose();
}

export function activate(context: vscode.ExtensionContext): void {
  const provider = new VibeLanguageModelChatProvider();

  context.subscriptions.push(
    vscode.lm.registerLanguageModelChatProvider(VENDOR, provider),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(SETTING_SECTION)) {
        provider.notifyChanged();
      }
    }),
    vscode.commands.registerCommand(
      "languageModelChatProvider.openSettings",
      async () => {
        await vscode.commands.executeCommand(
          "workbench.action.openSettings",
          SETTING_SECTION
        );
      }
    ),
    vscode.commands.registerCommand(
      "languageModelChatProvider.test",
      sendTestRequest
    )
  );
}

export function deactivate(): void {}