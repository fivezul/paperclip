export interface AntigravityModel { id: string; label: string }
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
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
    const { stdout } = await execFileAsync("agy", ["models"], { timeout: 20_000, windowsHide: true });
    return parseAntigravityModelsOutput(stdout);
  } catch {
    return [];
  }
}
