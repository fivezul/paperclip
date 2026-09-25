export interface AntigravityModel { id: string; label: string }
import { runChildProcess } from "@paperclipai/adapter-utils/server-utils";
export function parseAntigravityModelsOutput(stdout: string): AntigravityModel[] {
  const result: AntigravityModel[] = [];
  for (const raw of stdout.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const match = /^(\S+)\s{2,}(.+)$/.exec(line);
    if (!match || !/^[a-z0-9][a-z0-9._-]*$/i.test(match[1]!)) continue;
    result.push({ id: match[1]!, label: match[2]!.trim() });
  }
  return [...new Map(result.map((model) => [model.id, model])).values()];
}

export async function listAntigravityModels(): Promise<AntigravityModel[]> {
  try {
    const result = await runChildProcess("antigravity-models", "agy", ["models"], {
      cwd: process.cwd(), env: {}, timeoutSec: 20, graceSec: 3, onLog: async () => {},
    });
    if (result.timedOut || (result.exitCode ?? 1) !== 0) return [];
    return parseAntigravityModelsOutput(result.stdout);
  } catch {
    return [];
  }
}
