import type { TranscriptEntry } from "@paperclipai/adapter-utils";
const record = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const string = (v: unknown) => typeof v === "string" ? v : "";
export function parseAntigravityStdoutLine(line: string, ts: string): TranscriptEntry[] {
  let event: Record<string, unknown>; try { event = record(JSON.parse(line)); } catch { return [{ kind: "stdout", ts, text: line }]; }
  const type = string(event.type).toLowerCase();
  if (type === "init") return [{ kind: "init", ts, model: string(event.model) || "antigravity", sessionId: string(event.conversation_id) }];
  if (type === "step_update") {
    const step = record(event.step), delta = record(event.delta);
    const text = string(event.text) || string(event.content) || string(delta.text) || string(step.text);
    if (text) return [{ kind: "assistant", ts, text }];
    const tool = string(event.tool) || string(step.tool) || string(step.name);
    return tool ? [{ kind: "system", ts, text: `tool: ${tool}` }] : [];
  }
  if (type === "result") { const usage = record(event.usage), status = string(event.status).toUpperCase(); return [{ kind: "result", ts, text: string(event.response), inputTokens: Number(usage.input_tokens) || 0, outputTokens: Number(usage.output_tokens) || 0, cachedTokens: Number(usage.cache_read_tokens) || 0, costUsd: 0, subtype: status || "result", isError: status !== "SUCCESS", errors: status === "SUCCESS" ? [] : [string(event.error) || status] }]; }
  if (type === "error") return [{ kind: "stderr", ts, text: string(event.error) || string(event.message) || "Antigravity error" }];
  return [{ kind: "stdout", ts, text: line }];
}
