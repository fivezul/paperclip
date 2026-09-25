# Antigravity local adapter

`antigravity_local` runs Google Antigravity's `agy` CLI as a first-class local Paperclip runtime. Install `agy`, run `agy` interactively once, and complete its sign-in flow. Paperclip inherits that local authentication; it does not store, copy, or manage Antigravity consumer credentials.

The default command is `agy` and the default model is `gemini-3.8-flash-medium`. Models are discovered from `agy models`; model IDs and descriptive labels come from that command. Configure `model`, `effort` (`low`, `medium`, or `high`), `command`, `extraArgs`, `env`, `timeoutSec`, `printTimeout`, `sandbox`, and `dangerouslySkipPermissions` as needed. The unsafe permission bypass is off by default.

Each heartbeat launches a fresh non-interactive process using `agy -p <prompt> --model <model> --output-format stream-json`. Paperclip extracts `conversation_id` from NDJSON and, only when the saved workspace and execution target still match, continues with `--conversation <id>`. It never uses workspace-global `--continue`.

Run the environment test to verify the executable, CLI operation, authentication, model discovery, and configured model. If authentication is missing, run `agy` in a terminal and sign in. To check manually:

```sh
agy --version
agy models
agy -p "Respond with exactly hello." --model gemini-3.8-flash-medium --output-format stream-json
```

## Limitations

Version 1 uses one CLI process per run. It does not use a warmed persistent `--input-format stream-json` process. Antigravity does not report monetary billing, so the adapter reports token usage without inventing cost. Remote environments must already contain `agy` and usable authentication.
