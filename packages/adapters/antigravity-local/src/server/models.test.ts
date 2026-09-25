import { afterEach, describe, expect, it, vi } from "vitest";
import * as serverUtils from "@paperclipai/adapter-utils/server-utils";
import { listAntigravityModels, parseAntigravityModelsOutput } from "./models.js";

const result = (overrides: Record<string, unknown> = {}) => ({ exitCode: 0, signal: null, timedOut: false, stdout: "", stderr: "", pid: 1, startedAt: new Date().toISOString(), ...overrides }) as never;

describe("Antigravity model discovery", () => {
  afterEach(() => vi.restoreAllMocks());

  it("parses agy model slugs and descriptive labels", () => {
    expect(parseAntigravityModelsOutput("gemini-3.8-flash-medium   Gemini 3.8 Flash (Medium)\ngpt-oss-120b-medium   GPT OSS 120B (Medium)\n")).toEqual([
      { id: "gemini-3.8-flash-medium", label: "Gemini 3.8 Flash (Medium)" },
      { id: "gpt-oss-120b-medium", label: "GPT OSS 120B (Medium)" },
    ]);
  });

  it("discovers models with an argv-based agy models invocation", async () => {
    const run = vi.spyOn(serverUtils, "runChildProcess").mockResolvedValue(result({ stdout: "claude-sonnet-4-6   Claude Sonnet 4.6\n" }));
    await expect(listAntigravityModels()).resolves.toEqual([{ id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" }]);
    expect(run.mock.calls[0]?.[1]).toBe("agy");
    expect(run.mock.calls[0]?.[2]).toEqual(["models"]);
  });

  it("returns no models when agy is unavailable", async () => {
    vi.spyOn(serverUtils, "runChildProcess").mockRejectedValue(Object.assign(new Error("spawn ENOENT"), { code: "ENOENT" }));
    await expect(listAntigravityModels()).resolves.toEqual([]);
  });
});
