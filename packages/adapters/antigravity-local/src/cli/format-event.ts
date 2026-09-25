import pc from "picocolors";
export function printAntigravityStreamEvent(raw: string): void {
  let event: Record<string, unknown>; try { event = JSON.parse(raw) as Record<string, unknown>; } catch { console.log(raw); return; }
  const type = String(event.type ?? "");
  if (type === "step_update") { const text = event.text ?? event.content ?? (event.delta as Record<string, unknown> | undefined)?.text; if (text) console.log(pc.green(String(text))); return; }
  if (type === "result") { const failed = String(event.status).toUpperCase() !== "SUCCESS"; console.log((failed ? pc.red : pc.blue)(`result: ${String(event.status ?? "unknown")}`)); return; }
  if (type === "error") { console.log(pc.red(String(event.error ?? event.message ?? "Antigravity error"))); return; }
  console.log(raw);
}
