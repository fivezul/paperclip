import { describe, expect, it } from "vitest";
import { DEFAULT_ANTIGRAVITY_LOCAL_MODEL } from "../index.js";
import { buildAntigravityLocalConfig } from "./build-config.js";

describe("buildAntigravityLocalConfig", () => {
  it("uses the documented default model", () => {
    expect(buildAntigravityLocalConfig({} as never)).toMatchObject({
      model: DEFAULT_ANTIGRAVITY_LOCAL_MODEL,
      dangerouslySkipPermissions: false,
    });
  });

  it("persists unattended tool execution only when explicitly enabled", () => {
    expect(
      buildAntigravityLocalConfig({ dangerouslySkipPermissions: true } as never),
    ).toMatchObject({ dangerouslySkipPermissions: true });
    expect(
      buildAntigravityLocalConfig({ dangerouslySkipPermissions: false } as never),
    ).toMatchObject({ dangerouslySkipPermissions: false });
  });

  it("maps effort, command, extra args, and environment", () => {
    expect(buildAntigravityLocalConfig({ thinkingEffort: "high", command: "agy-dev", extraArgs: "--flag,value", envBindings: [], envVars: "" } as never)).toMatchObject({ effort: "high", command: "agy-dev", extraArgs: ["--flag", "value"] });
  });
});
