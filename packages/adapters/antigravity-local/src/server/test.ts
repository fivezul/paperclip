import type { AdapterEnvironmentCheck, AdapterEnvironmentTestContext, AdapterEnvironmentTestResult } from "@paperclipai/adapter-utils";
import { runAdapterExecutionTargetProcess, resolveAdapterExecutionTargetCwd } from "@paperclipai/adapter-utils/execution-target";
import { asNumber, asString, parseObject } from "@paperclipai/adapter-utils/server-utils";
import { DEFAULT_ANTIGRAVITY_LOCAL_MODEL } from "../index.js";
import { parseAntigravityModelsOutput } from "./models.js";

const AUTH_RE = /not authenticated|not signed in|authentication required|unauthorized|sign in/i;
export async function testEnvironment(ctx: AdapterEnvironmentTestContext): Promise<AdapterEnvironmentTestResult> {
  const config = parseObject(ctx.config), checks: AdapterEnvironmentCheck[] = [];
  const command = asString(config.command, "agy"), target = ctx.executionTarget ?? null;
  const cwd = resolveAdapterExecutionTargetCwd(target, asString(config.cwd, ""), process.cwd());
  const env = parseObject(config.env) as Record<string, string>;
  const timeoutSec = Math.max(1, asNumber(config.discoveryTimeoutSec, 20));
  const version = await runAdapterExecutionTargetProcess(`agy-version-${Date.now()}`, target, command, ["--version"], { cwd, env, timeoutSec, graceSec: 3, onLog: async () => {} });
  checks.push((version.exitCode ?? 1) === 0
    ? { code: "antigravity_command_ready", level: "info", message: `Antigravity CLI is executable: ${command}` }
    : { code: "antigravity_command_failed", level: "error", message: `Could not execute ${command}.`, detail: version.stderr.trim() || undefined });
  if ((version.exitCode ?? 1) === 0) {
    const probe = await runAdapterExecutionTargetProcess(`agy-models-${Date.now()}`, target, command, ["models"], { cwd, env, timeoutSec, graceSec: 3, onLog: async () => {} });
    const combined = `${probe.stdout}\n${probe.stderr}`;
    if (probe.timedOut) checks.push({ code: "antigravity_models_timeout", level: "error", message: "`agy models` timed out." });
    else if ((probe.exitCode ?? 1) !== 0) checks.push({ code: AUTH_RE.test(combined) ? "antigravity_auth_required" : "antigravity_models_failed", level: "error", message: AUTH_RE.test(combined) ? "Antigravity is not authenticated." : "`agy models` failed.", detail: probe.stderr.trim() || probe.stdout.trim() || undefined, hint: AUTH_RE.test(combined) ? "Run `agy` and sign in interactively, then retry." : undefined });
    else {
      const models = parseAntigravityModelsOutput(probe.stdout);
      checks.push({ code: "antigravity_models_discovered", level: models.length ? "info" : "error", message: models.length ? `Discovered ${models.length} Antigravity model(s).` : "`agy models` returned no parseable models." });
      const configured = asString(config.model, DEFAULT_ANTIGRAVITY_LOCAL_MODEL);
      checks.push(models.some((model) => model.id === configured)
        ? { code: "antigravity_model_available", level: "info", message: `Configured model is available: ${configured}` }
        : { code: "antigravity_model_unavailable", level: "error", message: `Configured model is unavailable: ${configured}` });
    }
  }
  return { adapterType: "antigravity_local", status: checks.some((c) => c.level === "error") ? "fail" : checks.some((c) => c.level === "warn") ? "warn" : "pass", checks, testedAt: new Date().toISOString() };
}
