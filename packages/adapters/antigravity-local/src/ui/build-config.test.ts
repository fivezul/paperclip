import { describe, expect, it } from "vitest";
import { DEFAULT_ANTIGRAVITY_LOCAL_MODEL } from "../index.js";
import { buildAntigravityLocalConfig } from "./build-config.js";

describe("buildAntigravityLocalConfig", () => {
  it("uses the documented default model", () => {
    expect(buildAntigravityLocalConfig({} as never).model).toBe(DEFAULT_ANTIGRAVITY_LOCAL_MODEL);
  });

  it("maps effort, command, extra args, and environment", () => {
    expect(buildAntigravityLocalConfig({ thinkingEffort: "high", command: "agy-dev", extraArgs: "--flag,value", envBindings: [], envVars: "" } as never)).toMatchObject({ effort: "high", command: "agy-dev", extraArgs: ["--flag", "value"] });
  });
});
