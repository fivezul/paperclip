export const type = "antigravity_local";
export const label = "Antigravity";
export const DEFAULT_ANTIGRAVITY_LOCAL_MODEL = "gemini-3.8-flash-medium";
export const models = [{ id: DEFAULT_ANTIGRAVITY_LOCAL_MODEL, label: "Gemini 3.8 Flash (Medium)" }];

export const agentConfigurationDoc = `# antigravity_local agent configuration

Runs the locally installed and authenticated Antigravity CLI (\`agy\`) once per Paperclip run.
Sessions continue only with the explicit saved \`conversation_id\` and \`--conversation\`; they are never resumed with \`--continue\`.

Fields: model, effort (low|medium|high), command, extraArgs, env, timeoutSec,
dangerouslySkipPermissions, and sandbox. The project workspace supplies cwd.
Authentication is inherited from the local CLI. Run \`agy\` interactively to sign in.
`;
