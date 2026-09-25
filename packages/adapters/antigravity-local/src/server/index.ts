import type { AdapterSessionCodec } from "@paperclipai/adapter-utils";
export { execute, buildAntigravityArgs } from "./execute.js";
export { testEnvironment } from "./test.js";
export { parseAntigravityJsonl, isSuccessfulAntigravityStatus } from "./parse.js";
export { parseAntigravityModelsOutput, listAntigravityModels } from "./models.js";

const read = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
export const sessionCodec: AdapterSessionCodec = {
  deserialize(raw) { const r = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {}; const id = read(r.conversationId) ?? read(r.conversation_id) ?? read(r.sessionId); return id ? { ...r, conversationId: id, sessionId: id } : null; },
  serialize(params) { if (!params) return null; const id = read(params.conversationId) ?? read(params.conversation_id) ?? read(params.sessionId); return id ? { ...params, conversationId: id } : null; },
  getDisplayId(params) { return params ? read(params.conversationId) ?? read(params.conversation_id) ?? read(params.sessionId) : null; },
};
