import { buildAdapterEnvConfig, type CreateConfigValues } from "@paperclipai/adapter-utils";
import { DEFAULT_ANTIGRAVITY_LOCAL_MODEL } from "../index.js";
export function buildAntigravityLocalConfig(v: CreateConfigValues): Record<string, unknown> {
  const config: Record<string, unknown> = {
    model: v.model || DEFAULT_ANTIGRAVITY_LOCAL_MODEL,
    timeoutSec: 0,
    graceSec: 20,
    dangerouslySkipPermissions: v.dangerouslySkipPermissions === true,
  };
  if (v.thinkingEffort) config.effort = v.thinkingEffort;
  if (v.command) config.command = v.command;
  if (v.extraArgs) config.extraArgs = v.extraArgs.split(",").map((x) => x.trim()).filter(Boolean);
  const env = buildAdapterEnvConfig(v.envBindings, v.envVars); if (Object.keys(env).length) config.env = env;
  return config;
}
