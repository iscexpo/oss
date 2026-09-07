import type { Metadata } from "@/ai/messages/metadata";
import type { DataPart } from "@/ai/messages/data-parts";
import type { ToolSet } from "@/ai/tools";
import type { UIMessage, UIMessagePart } from "ai";

export type ChatUIMessage = UIMessage<Metadata, DataPart, ToolSet>;
export type ChatUIMessagePart = UIMessagePart<DataPart, ToolSet>;
