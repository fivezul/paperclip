import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@paperclipai/adapter-utils/execution-target", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, runAdapterExecutionTargetProcess: vi.fn() };
});

import { runAdapterExecutionTargetProcess } from "@paperclipai/adapter-utils/execution-target";
import { execute } from "./execute.js";

const run = vi.mocked(runAdapterExecutionTargetProcess);
const processResult = (overrides: Record<string, unknown> = {}) => ({ exitCode: 0, signal: null, timedOut: false, stdout: "", stderr: "", pid: 1, startedAt: new Date().toISOString(), ...overrides }) as never;
const context = (runtime: Record<string, unknown> = {}) => ({
  runId: "run-1",
  agent: { id: "agent-1", companyId: "company-1", name: "Antigravity", adapterType: "antigravity_local", adapterConfig: {} },
  runtime: { sessionId: null, sessionParams: null, sessionDisplayId: null, taskKey: null, ...runtime },
  config: { model: "gemini-3.8-flash-medium", effort: "medium", cwd: process.cwd(), promptTemplate: "Do the task." },
  context: {}, onLog: async () => {},
}) as never;

describe("Antigravity execution", () => {
  beforeEach(() => run.mockReset());

  it("persists conversation_id from a successful result", async () => {
    run.mockResolvedValue(processResult({ stdout: '{"type":"init","conversation_id":"conv-new"}\n{"type":"result","status":"SUCCESS","response":"done","usage":{"input_tokens":5,"output_tokens":2}}' }));
    const result = await execute(context());
    expect(result).toMatchObject({ exitCode: 0, errorMessage: null, sessionId: "conv-new", summary: "done", usage: { inputTokens: 5, outputTokens: 2 } });
  });

  it("resumes the exact compatible conversation with --conversation, never --continue", async () => {
    run.mockResolvedValue(processResult({ stdout: '{"type":"result","status":"SUCCESS","conversation_id":"conv-old","response":"done"}' }));
    await execute(context({ sessionId: "conv-old", sessionParams: { conversationId: "conv-old", cwd: process.cwd() } }));
    const args = run.mock.calls[0]?.[3] ?? [];
    expect(args).toContain("--conversation");
    expect(args[args.indexOf("--conversation") + 1]).toBe("conv-old");
    expect(args).not.toContain("--continue");
  });

  it("does not resume a conversation saved for another workspace", async () => {
    run.mockResolvedValue(processResult({ stdout: '{"type":"result","status":"SUCCESS","conversation_id":"conv-new"}' }));
    await execute(context({ sessionId: "conv-old", sessionParams: { conversationId: "conv-old", cwd: "/different/workspace" } }));
    expect(run.mock.calls[0]?.[3]).not.toContain("--conversation");
  });

  it("fails a non-zero agy exit even if stdout claims success", async () => {
    run.mockResolvedValue(processResult({ exitCode: 7, stderr: "agy failed", stdout: '{"type":"result","status":"SUCCESS"}' }));
    await expect(execute(context())).resolves.toMatchObject({ exitCode: 7, errorMessage: "agy failed" });
  });

  it.each(["ERROR", "CANCELED", "INTERRUPTED"])("maps terminal %s to failure", async (status) => {
    run.mockResolvedValue(processResult({ stdout: JSON.stringify({ type: "result", status, error: `${status} detail` }) }));
    const result = await execute(context());
    expect(result.errorMessage).toBe(`${status} detail`);
  });
});
