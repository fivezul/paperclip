import path from "node:path";
import type { AdapterExecutionContext, AdapterExecutionResult } from "@paperclipai/adapter-utils";
import { adapterExecutionTargetSessionIdentity, adapterExecutionTargetSessionMatches, readAdapterExecutionTarget, resolveAdapterExecutionTargetCwd, runAdapterExecutionTargetProcess } from "@paperclipai/adapter-utils/execution-target";
import { asBoolean, asNumber, asString, asStringArray, buildPaperclipEnv, buildRuntimeToolsEnv, joinPromptSections, parseObject, renderPaperclipWakePrompt, renderTemplate, DEFAULT_PAPERCLIP_AGENT_PROMPT_TEMPLATE } from "@paperclipai/adapter-utils/server-utils";
import { DEFAULT_ANTIGRAVITY_LOCAL_MODEL } from "../index.js";
import { isSuccessfulAntigravityStatus, parseAntigravityJsonl } from "./parse.js";

export function buildAntigravityArgs(config: Record<string, unknown>, prompt: string, conversationId?: string | null): string[] {
  const args = ["-p", prompt];
  if (conversationId) args.push("--conversation", conversationId);
  args.push("--model", asString(config.model, DEFAULT_ANTIGRAVITY_LOCAL_MODEL), "--output-format", "stream-json");
  const effort = asString(config.effort, "").trim();
  if (effort) args.push("--effort", effort);
  if (asBoolean(config.dangerouslySkipPermissions, false)) args.push("--dangerously-skip-permissions");
  if (asBoolean(config.sandbox, false)) args.push("--sandbox");
  const printTimeout = asNumber(config.printTimeout, 0);
  if (printTimeout > 0) args.push("--print-timeout", String(printTimeout));
  args.push(...asStringArray(config.extraArgs));
  return args;
}

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const target = readAdapterExecutionTarget({ executionTarget: ctx.executionTarget, legacyRemoteExecution: ctx.executionTransport?.remoteExecution });
  const workspace = parseObject(ctx.context.paperclipWorkspace);
  const cwd = resolveAdapterExecutionTargetCwd(target, asString(workspace.cwd, "") || asString(ctx.config.cwd, ""), process.cwd());
  const saved = parseObject(ctx.runtime.sessionParams);
  const savedId = asString(saved.conversationId, asString(saved.conversation_id, ctx.runtime.sessionId ?? ""));
  const savedCwd = asString(saved.cwd, "");
  const canResume = Boolean(savedId) && (!savedCwd || path.resolve(savedCwd) === path.resolve(cwd)) && adapterExecutionTargetSessionMatches(parseObject(saved.remoteExecution), target);
  const conversationId = canResume ? savedId : null;
  const template = asString(ctx.config.promptTemplate, DEFAULT_PAPERCLIP_AGENT_PROMPT_TEMPLATE);
  const prompt = joinPromptSections([renderPaperclipWakePrompt(ctx.context.paperclipWake, { resumedSession: Boolean(conversationId) }), renderTemplate(template, { agentId: ctx.agent.id, companyId: ctx.agent.companyId, runId: ctx.runId, company: { id: ctx.agent.companyId }, agent: ctx.agent, run: { id: ctx.runId, source: "on_demand" }, context: ctx.context })]);
  const args = buildAntigravityArgs(ctx.config, prompt, conversationId);
  const command = asString(ctx.config.command, "agy");
  await ctx.onMeta?.({ adapterType: "antigravity_local", command, cwd, commandArgs: args.map((v, i) => i === 1 ? `<prompt ${prompt.length} chars>` : v), prompt, context: ctx.context });
  const env = { ...buildPaperclipEnv(ctx.agent), ...buildRuntimeToolsEnv(ctx.runtimeTools), ...parseObject(ctx.config.env), PAPERCLIP_RUN_ID: ctx.runId } as Record<string, string>;
  if (ctx.authToken) env.PAPERCLIP_API_KEY = ctx.authToken;
  const proc = await runAdapterExecutionTargetProcess(ctx.runId, target, command, args, { cwd, env, timeoutSec: asNumber(ctx.config.timeoutSec, 0), graceSec: asNumber(ctx.config.graceSec, 20), onSpawn: ctx.onSpawn, onRuntimeProgress: ctx.onRuntimeProgress, onLog: ctx.onLog });
  const parsed = parseAntigravityJsonl(proc.stdout);
  const failedStatus = parsed.status !== null && !isSuccessfulAntigravityStatus(parsed.status);
  const failed = proc.timedOut || (proc.exitCode ?? 0) !== 0 || failedStatus;
  const resolvedId = parsed.conversationId ?? (failed ? null : conversationId);
  return {
    exitCode: proc.exitCode, signal: proc.signal, timedOut: proc.timedOut,
    errorMessage: failed ? (parsed.errorMessage || proc.stderr.trim().split(/\r?\n/)[0] || `Antigravity ended with status ${parsed.status ?? proc.exitCode ?? "unknown"}`) : null,
    // Antigravity result usage is cumulative across the resumed conversation.
    // The heartbeat service persists the raw snapshot and derives this run's
    // delta from the previous snapshot for the same conversation.
    usage: { inputTokens: parsed.inputTokens, outputTokens: parsed.outputTokens, cachedInputTokens: parsed.cacheReadTokens }, usageBasis: "session_cumulative",
    sessionId: resolvedId, sessionDisplayId: resolvedId,
    sessionParams: resolvedId ? { conversationId: resolvedId, cwd, remoteExecution: adapterExecutionTargetSessionIdentity(target) } : null,
    provider: "google", model: asString(ctx.config.model, DEFAULT_ANTIGRAVITY_LOCAL_MODEL), billingType: "subscription", costUsd: null,
    resultJson: { status: parsed.status, thinkingTokens: parsed.thinkingTokens, totalTokens: parsed.totalTokens }, summary: parsed.summary,
  };
}
