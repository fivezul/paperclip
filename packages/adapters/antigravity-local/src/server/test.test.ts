import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@paperclipai/adapter-utils/execution-target", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, runAdapterExecutionTargetProcess: vi.fn() };
});

import { runAdapterExecutionTargetProcess } from "@paperclipai/adapter-utils/execution-target";
import { testEnvironment } from "./test.js";
const run = vi.mocked(runAdapterExecutionTargetProcess);
const result = (overrides: Record<string, unknown> = {}) => ({ exitCode: 0, signal: null, timedOut: false, stdout: "", stderr: "", pid: 1, startedAt: new Date().toISOString(), ...overrides }) as never;
const ctx = (config: Record<string, unknown> = {}) => ({ companyId: "company-1", adapterType: "antigravity_local", config: { model: "gemini-3.8-flash-medium", ...config } }) as never;

describe("Antigravity environment test", () => {
  beforeEach(() => run.mockReset());

  it("passes when agy is operational, authenticated, and the model is available", async () => {
    run.mockResolvedValueOnce(result({ stdout: "agy 1.0" })).mockResolvedValueOnce(result({ stdout: "gemini-3.8-flash-medium   Gemini 3.8 Flash (Medium)" }));
    const tested = await testEnvironment(ctx());
    expect(tested.status).toBe("pass");
    expect(tested.checks.map((check) => check.code)).toContain("antigravity_model_available");
  });

  it("reports a missing agy executable", async () => {
    run.mockRejectedValueOnce(Object.assign(new Error("spawn agy ENOENT"), { code: "ENOENT" }));
    const tested = await testEnvironment(ctx());
    expect(tested).toMatchObject({ status: "fail", checks: [expect.objectContaining({ code: "antigravity_command_missing" })] });
  });

  it("reports authentication failure with an actionable hint", async () => {
    run.mockResolvedValueOnce(result()).mockResolvedValueOnce(result({ exitCode: 1, stderr: "Not signed in" }));
    const tested = await testEnvironment(ctx());
    expect(tested.checks).toContainEqual(expect.objectContaining({ code: "antigravity_auth_required", hint: expect.stringContaining("Run `agy`") }));
  });

  it("rejects an unavailable configured model", async () => {
    run.mockResolvedValueOnce(result()).mockResolvedValueOnce(result({ stdout: "claude-sonnet-4-6   Claude Sonnet 4.6" }));
    const tested = await testEnvironment(ctx({ model: "gemini-3.8-flash-medium" }));
    expect(tested.checks).toContainEqual(expect.objectContaining({ code: "antigravity_model_unavailable", level: "error" }));
  });
});
