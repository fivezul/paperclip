import { asNumber, asString, parseJson, parseObject } from "@paperclipai/adapter-utils/server-utils";

export type AntigravityStatus = "SUCCESS" | "ERROR" | "CANCELED" | "INTERRUPTED" | "INVALID" | "WAITING" | "RUNNING" | string;
export interface ParsedAntigravityJsonl {
  conversationId: string | null; status: AntigravityStatus | null; summary: string;
  errorMessage: string | null; inputTokens: number; outputTokens: number;
  thinkingTokens: number; cacheReadTokens: number; totalTokens: number;
}

function text(value: unknown): string {
  if (typeof value === "string") return value;
  const record = parseObject(value);
  return asString(record.text, "") || asString(record.content, "") || asString(record.message, "");
}

export function parseAntigravityJsonl(stdout: string): ParsedAntigravityJsonl {
  let conversationId: string | null = null, status: AntigravityStatus | null = null, errorMessage: string | null = null;
  let inputTokens = 0, outputTokens = 0, thinkingTokens = 0, cacheReadTokens = 0, totalTokens = 0;
  const deltas: string[] = [];
  for (const raw of stdout.split(/\r?\n/)) {
    const event = parseJson(raw.trim());
    if (!event) continue;
    conversationId = asString(event.conversation_id, "").trim() || conversationId;
    const type = asString(event.type, "").toLowerCase();
    if (type === "step_update") {
      const delta = text(event.delta) || text(event.text) || text(event.content) || text(parseObject(event.step).delta);
      if (delta) deltas.push(delta);
      // Antigravity may attach a cumulative conversation usage snapshot to
      // step updates. Do not accumulate or persist it: the terminal result
      // contains the authoritative cumulative snapshot for this conversation.
    }
    if (type === "result") {
      status = asString(event.status, "").toUpperCase() || status;
      const response = text(event.response) || text(event.result);
      if (response && deltas.length === 0) deltas.push(response);
      errorMessage = text(event.error).trim() || errorMessage;
      const usage = parseObject(event.usage);
      inputTokens = asNumber(usage.input_tokens, inputTokens);
      outputTokens = asNumber(usage.output_tokens, outputTokens);
      thinkingTokens = asNumber(usage.thinking_tokens, thinkingTokens);
      cacheReadTokens = asNumber(usage.cache_read_tokens, cacheReadTokens);
      totalTokens = asNumber(usage.total_tokens, totalTokens);
    }
    if (type === "error") errorMessage = text(event.error) || text(event.message) || errorMessage;
  }
  return { conversationId, status, summary: deltas.join("").trim(), errorMessage, inputTokens, outputTokens, thinkingTokens, cacheReadTokens, totalTokens };
}

export function isSuccessfulAntigravityStatus(status: string | null): boolean { return status === "SUCCESS"; }
