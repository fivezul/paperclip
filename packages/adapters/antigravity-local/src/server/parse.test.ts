import { describe, expect, it } from "vitest";
import { isSuccessfulAntigravityStatus, parseAntigravityJsonl } from "./parse.js";
import { parseAntigravityModelsOutput } from "./models.js";
import { buildAntigravityArgs } from "./execute.js";
import { DEFAULT_ANTIGRAVITY_LOCAL_MODEL } from "../index.js";
describe("antigravity_local", () => {
  it("parses models", () => expect(parseAntigravityModelsOutput("gemini-3.8-flash-medium   Gemini 3.8 Flash (Medium)\nclaude-sonnet-4-6  Claude Sonnet 4.6")).toEqual([{ id: "gemini-3.8-flash-medium", label: "Gemini 3.8 Flash (Medium)" }, { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" }]));
  it("parses NDJSON, conversation and usage while ignoring malformed lines", () => expect(parseAntigravityJsonl('{"type":"init","conversation_id":"c1"}\nbad\n{"type":"step_update","text":"Hi"}\n{"type":"result","status":"SUCCESS","usage":{"input_tokens":2,"output_tokens":3,"thinking_tokens":4,"cache_read_tokens":1,"total_tokens":10}}')).toMatchObject({ conversationId: "c1", status: "SUCCESS", summary: "Hi", inputTokens: 2, outputTokens: 3, thinkingTokens: 4, cacheReadTokens: 1, totalTokens: 10 }));
  it("uses final cumulative result usage without adding step snapshots", () => {
    const parsed = parseAntigravityJsonl([
      JSON.stringify({ type: "init", conversation_id: "resumed-conversation" }),
      JSON.stringify({ type: "step_update", text: "Working", usage: {
        input_tokens: 16_939, output_tokens: 48, thinking_tokens: 39, total_tokens: 16_987,
      } }),
      JSON.stringify({ type: "result", status: "SUCCESS", usage: {
        input_tokens: 33_619, output_tokens: 89, thinking_tokens: 71, total_tokens: 33_708,
      } }),
    ].join("\n"));

    expect(parsed).toMatchObject({
      inputTokens: 33_619,
      outputTokens: 89,
      thinkingTokens: 71,
      totalTokens: 33_708,
    });
  });
  it("uses explicit conversation continuation and safe argument entries", () => expect(buildAntigravityArgs({ model: "m", effort: "high", dangerouslySkipPermissions: true, sandbox: true }, "hello; rm", "conv-1")).toEqual(["-p", "hello; rm", "--conversation", "conv-1", "--model", "m", "--output-format", "stream-json", "--effort", "high", "--dangerously-skip-permissions", "--sandbox"]));
  it("omits unattended permission bypass by default and when explicitly disabled", () => {
    expect(buildAntigravityArgs({}, "hello", null)).not.toContain("--dangerously-skip-permissions");
    expect(buildAntigravityArgs({ dangerouslySkipPermissions: false }, "hello", null)).not.toContain("--dangerously-skip-permissions");
  });
  it("uses the required default model and never uses workspace-global continuation", () => {
    const args = buildAntigravityArgs({}, "hello", "conv-2");
    expect(args).toContain(DEFAULT_ANTIGRAVITY_LOCAL_MODEL);
    expect(args).not.toContain("--continue");
  });
  it("captures error status", () => expect(parseAntigravityJsonl('{"type":"result","status":"ERROR","error":"boom"}')).toMatchObject({ status: "ERROR", errorMessage: "boom" }));
  it.each(["CANCELED", "INTERRUPTED"])("does not classify %s as success", (status) => {
    expect(isSuccessfulAntigravityStatus(status)).toBe(false);
  });
});
