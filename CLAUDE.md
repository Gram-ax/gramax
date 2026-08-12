# Gramax — Claude context

## Repos
- **Upstream (code + CI)**: `gitlab.ics-it.ru/ics/doc-reader.git`
- **GitHub mirror (issues only)**: https://github.com/gram-ax/gramax — read-only for code; issues/labels/board live here. Use `gh -R gram-ax/gramax` for issue work. No code MRs on GitHub.

## Rules
- **Read workspace `gramax-team/CLAUDE.md`** (parent dir). Cross-repo rules (Bun/uv/rg/fd/fzf, `.specs/` at workspace root, GitLab auth + `Assisted-By:` footer) not restated here.
- **MR write/review/board-URL resolve**: skill `mr`.
- **UI**: new UI MUST use `@core/ui-kit`. Missing primitive → add under `core/ui-kit/components/<Name>/`. Never ad-hoc styled wrappers in `core/components/`.
- **Editor guards**: before using an editor, check both that it exists and that it has not been destroyed: `if (!editor || editor.isDestroyed) return;`. Do not check only `!editor`.
- **Article CSS units**: in `core/styles/article.css`, use `em` for spatial dimensions and spacing. Use `px` only for visual effects such as borders, outlines, and shadows.
- **E2E**: use `e2e-pw/` only — ignore legacy `e2e/`. Write/run/debug → skill `writing-e2e-tests`.
- **Lint gate**: after edit any TS/JS/JSON run `bunx biome check --write <file>`, fix all. Project gate: `bun run lint` (= `tsc --incremental false && biome ci`).
- **Tests**: `bun run test <path/to/file.test.ts>` single suite (`scripts/run-tests.ts` routes path → jest), `bun run test:unit` for `*.unit.test.ts`, `bun run test:int` integration. `--no-server` / `-n` skips git-http-mock-server boot. Worktree dirs cause `jest-haste-map` collision warnings — harmless.
- **Logging**: no `console.*`. Emit via OpenTelemetry from `@ext/loggers/opentelemetry` — wrap work units in `traced(name, () => …)` (or `@trace()` decorator) to open span, then `span()?.addEvent(name, attrs)` for diagnostics. Outside active span `addEvent` no-ops → caller must be traced. Thrown errors: let `traced` record (`span.recordException`); `addEvent` for non-throwing signals. **Naming**: span + event names use `kebab-case` with `-` separator (`lfs-batch-pull`, not `lfs.batch.pull`). Events render under span → keep event names short, unprefixed (`add`, `flush`, `done`); span name carries namespace.
- **Worktrees** (epics/releases): create under `.worktrees/<branch>`, then `./scripts/link-worktree-deps.sh` symlinks `node_modules`, `.cache`, `services/node_modules` from main. Never `bun install` inside worktree.
- **Maintainability first**: avoid ad-hoc hacks, prefer explicit wiring. If the code needs to be explained = this bad code, write obvious **plain** code**
- **Branches**: `release/*` → production env, `develop` → nightly dev channel, MRs → MR pipeline, `us/*` → user story branch, `epic/*` → epic branch.

## Layout

| Path | Role |
|------|------|
| `apps/tauri/` | Desktop editor (Tauri + Rust). Dev: `bun run tauri`. |
| `apps/web/` | Web editor (WASM backend). Dev: `bun run web`. |
| `apps/next/` | Docportal (Next.js SSR). |
| `core/` | Shared FE. `ui-kit/` (design system), `components/` (product UI), `ui-logic/`, `logic/`, `extensions/`, `plugins/`. |
| `app/commands/` | Namespaced command tree — canonical FE↔BE call surface. |
| `app/resolveModule/` | Platform-aware module wiring (FE/BE injection + `rustcall/` dispatcher). |
| `crates/` | Rust workspace (`fs`, `git`, `core`, `spa`, `bugsnag`, `opentelemetry`). |
| `e2e-pw/` | Playwright tests. |
| `.ci/` | GitLab CI fragments. |

## Frontend architecture
Shared FE in `core/` runs in 6 envs by `VITE_ENVIRONMENT`: `browser`, `tauri`, `next`, `docportal`, `static`, `cli` (`test` aliases `next`). See `app/resolveModule/env.ts`. Platform code injected via 3 layers — extend right one:

1. `app/resolveModule/index.ts` — `DynamicModules` (FE) / `BackendDynamicModules` (BE) interfaces (Cookie, Router, Fetcher, openInExplorer, initWasm, getDOMParser, …). Each app wires impls at boot.
2. `app/resolveModule/{frontend,backend}/` — per-env impls.
3. `app/resolveModule/rustcall/` — single entry for native FS/git calls. Use `rustCall<O>("fs.<cmd>" | "git.<cmd>", args)`. `initRustCall()` (lazy) picks backend by `getExecutingEnvironment()`: web→wasm worker, tauri→`invoke`, next→Node, static→static, cli→cli. Namespace MUST be `fs` or `git`; `parseCommand` throws otherwise.

### Commands
New backend call → add command under `app/commands/<namespace>/`, not ad-hoc fetcher. `createCommands(app)` (`app/commands/index.ts`) walks tree, injects `_app` (`Application` instance) + `_commands` (full tree) into each leaf so commands call siblings. `findCommand(commands, path)` resolves by `_c.path`. Tree exposed as `window.commands` for in-browser debug.

## Runtime logs (desktop)
NDJSON spans, one per line:
- macOS: `$HOME/Library/Application Support/gramax.dev/logs/`
- Windows: `%APPDATA%/gramax.dev/logs/`
- Linux: `$XDG_CONFIG_HOME/gramax.dev/logs/` (fallback `$HOME/.config/gramax.dev/logs/`)

Files: `gx-YYYY-MM-DD_HH-MM-SS.ndjson`. **Never `cat`** — pipe through `jq`.

Record shape:
```json
{"name":"WorkspaceManager.setWorkspace","spanId":"...","traceId":"...","duration":34.0,"timestamp":1780318178.0,"error":null,"args":null,"result":null,"attrs":{...},"events":[],"parentSpanId":"..."}
```

Snippets (newest file):
```sh
LOG_DIR="$HOME/Library/Application Support/gramax.dev/logs"
LATEST=$(ls -t "$LOG_DIR"/*.ndjson | head -1)

# Top-level spans with duration
jq -c 'select(.parentSpanId == null) | {name, duration}' "$LATEST"

# Errors
jq -c 'select(.error != null) | {name, error, traceId}' "$LATEST"

# Spans for one traceId
jq -c --arg t "<traceId>" 'select(.traceId == $t) | {name, parentSpanId, spanId, duration, error}' "$LATEST"

# Slowest 20
jq -s 'sort_by(-.duration) | .[:20] | .[] | {name, duration}' "$LATEST"
```

Call tree = join records on `parentSpanId → spanId` within `traceId`.
