---
name: bugsnag
description: Use when user wants to inspect Bugsnag errors for Gramax (top events, frequent crashes, impact ranking, error detail, mark fixed). Triggers on "bugsnag", "багснаг", "top errors", "most frequent crashes", "что в багснеге", "посмотри багснаг", "fix bug in bugsnag", "resolve error", "mark fixed", "examine error", "show error". Two Bugsnag projects exist: **Gramax-PROD** and **Gramax-DEV**. Pass full project name via `--project <name>`. Splits results by platform (TAURI/NEXT/BROWSER/...) parsed from message prefix. Includes stacktrace + full event metadata. Outputs JSON. Before patching code, invoke the `superpowers:systematic-debugging` skill — feed it the `show --error <id>` output. **Marking an error fixed in Bugsnag is not the actual fix** — the code change must reach the latest release branch via either (1) a GitLab MR targeting the latest `release/*` branch, or (2) a commit on `develop` followed by a cherry-pick to the latest `release/*` branch. Use `fix` only after the change is merged/cherry-picked.
---

# bugsnag — query + manage Gramax Bugsnag errors

CLI to inspect Bugsnag errors with impact ranking and stacktraces, examine a single error in full detail, mark errors fixed, and post comments.

Two Bugsnag projects on the SaaS org:
- **Gramax-PROD** — production crashes
- **Gramax-DEV** — pre-release / nightly

Pass the full project name as `--project <name>` (case-insensitive). `--project all` (default for `stats`) scans every project whose name starts with `Gramax`.

## Setup

1. Get a Personal Auth Token (PAT) from Bugsnag SaaS:
   - app.bugsnag.com → avatar → **My Account Settings** → **Personal auth tokens** → **Generate**
   - Token shown only once. Copy immediately.
2. Export:
   ```sh
   export BUGSNAG_API_PAT_KEY=<token>
   # optional: pin org if user has access to multiple
   export BUGSNAG_ORG=<org-slug-or-name>
   ```

Token is read-only at the account level by default; write ops (fix/comment) require token to have project write access.

## Platform detection

Gramax `BugsnagLogger` prepends `[<ENV>]` to error messages (see `core/extensions/loggers/BugsnagLogger.ts:26-33`). CLI parses the tag from `errorClass` or `message`:

- `TAURI`, `NEXT`, `BROWSER`, `DOCPORTAL`, `STATIC`, `CLI`
- absent prefix → `unknown`

## Impact formula

```
impact = countDisplayed / 10 + countUndisplayed / 100
```

`countDisplayed` — events where `metaData.user.errorDisplayed=true` (user saw an error modal). Estimated by sampling up to 100 most-recent events per error and applying the ratio to the total count.
`countUndisplayed` — silent errors.

With `--no-split`, no sampling is done and impact collapses to `count / 100`.

## Commands

### `stats` — list top errors (read-only)

```sh
bun .claude/skills/bugsnag/scripts/bugsnag.ts stats [flags]
```

| Flag | Default | Meaning |
|------|---------|---------|
| `--since <window>` | `30d` | `24h`, `7d`, `30d`, or ISO date `2026-05-01T00:00:00Z` |
| `--top <N>` | `20` | Top N errors per project (max ~30 by Bugsnag API) |
| `--project <name>` | `all` | Full project name (`Gramax-PROD`, `Gramax-DEV`), or `all` (every Gramax-* project) |
| `--platform <p>` | `all` | `tauri`, `next`, `browser`, `docportal`, `static`, `cli`, or `all` |
| `--no-stack` | off | Skip stacktrace fetch |
| `--no-split` | off | Skip displayed/undisplayed sampling (impact = count/100) |
| `--pretty` | off | Pretty-print JSON |

Output (stdout): JSON. Events sorted by `impact` desc.

```json
{
  "window": {"since": "2026-05-26T00:00:00Z", "until": "2026-06-02T00:00:00Z"},
  "totals": {
    "by_project": {"Gramax-PROD": 1234, "Gramax-DEV": 56},
    "by_platform": {"tauri": 800, "next": 230, "browser": 200, "unknown": 60}
  },
  "events": [
    {
      "project": "Gramax-PROD",
      "platform": "tauri",
      "errorId": "5f...",
      "errorClass": "TypeError",
      "message": "[TAURI] Cannot read 'x' of undefined",
      "count": 412,
      "countDisplayed": 12,
      "countUndisplayed": 400,
      "impact": 5.2,
      "firstSeen": "...",
      "lastSeen": "...",
      "topFrame": "core/extensions/bugsnag/logic/sendBug.ts:42 sendBug",
      "stacktrace": [{"file": "...", "line": 42, "method": "sendBug", "inProject": true}],
      "latestEvent": {
        "id": "...",
        "received": "...",
        "context": "...",
        "device": {"osName": "macOS"},
        "app": {"version": "2026.6.0", "releaseStage": "production"}
      },
      "url": "https://app.bugsnag.com/<org>/<project>/errors/5f..."
    }
  ]
}
```

### `show` — examine one error by ID (read-only)

```sh
bun .claude/skills/bugsnag/scripts/bugsnag.ts show --error <id> --project <name> [--pretty]
```

Returns the full latest event for the error: full stacktrace, all metaData tabs (custom + logic_props + user + ...), device, app, request, last 20 breadcrumbs, plus aggregate stats (count, first/last seen).

```json
{
  "project": "Gramax-PROD",
  "platform": "tauri",
  "errorId": "...",
  "errorClass": "...",
  "message": "...",
  "count": 412,
  "firstSeen": "...",
  "lastSeen": "...",
  "topFrame": "...",
  "stacktrace": [...],
  "latestEvent": {
    "id": "...",
    "received": "...",
    "context": "...",
    "device": {...},
    "app": {...},
    "user": {...},
    "request": {...},
    "metaData": {"user": {"errorDisplayed": true}, "logic_props": {...}, ...},
    "breadcrumbs": [...]
  },
  "url": "..."
}
```

### `fix` — mark resolved + comment (write)

> **Before touching code:** run the `superpowers:systematic-debugging` skill. It enforces reproduction → minimal failing case → root-cause hypothesis → targeted patch, instead of guessing from the stacktrace. Use `show --error <id>` to gather breadcrumbs, request, and metaData before forming hypotheses; that data is what feeds the debugging skill.
>
> **Important:** marking an error fixed in Bugsnag does *not* fix the bug. The CLI just changes the error's state and posts a comment. The actual code change must reach the latest release branch via one of:
>
> 1. **GitLab MR targeting the latest `release/*` branch** — open MR with the patch directly against the release branch.
> 2. **Commit to `develop` → cherry-pick to the latest `release/*` branch** — land on `develop` first, then `git cherry-pick <sha>` onto the release branch (or open a cherry-pick MR).
>
> Only call `fix` *after* the change is merged / cherry-picked. The `--comment` should reference the MR or commit (e.g. `"fixed in !1234, cherry-picked to release/2026.6"`).

```sh
bun .claude/skills/bugsnag/scripts/bugsnag.ts fix \
  --error <id> \
  --project <name> \
  --comment "<text>" \
  [--release-stage production] \
  --yes
```

`--yes` required. Without it CLI prints what it would do and exits 2.

```json
{
  "ok": true,
  "errorId": "5f...",
  "project": "Gramax-PROD",
  "operations": ["fix", "comment"],
  "comment": {"id": "...", "message": "fixed in 2026.6.0"},
  "url": "..."
}
```

On failure: `{"ok": false, "step": "fix"|"comment", "status": <code>, "error": "..."}` + non-zero exit.

### `comment` — post comment only (write)

```sh
bun .claude/skills/bugsnag/scripts/bugsnag.ts comment \
  --error <id> \
  --project <name> \
  --message "<text>" \
  --yes
```

## Common queries

After running `stats --pretty > /tmp/bs.json`:

```sh
# Top 5 Gramax-PROD tauri errors visible to users
jq '.events | map(select(.project=="Gramax-PROD" and .platform=="tauri" and .countDisplayed>0)) | .[:5]' /tmp/bs.json

# Impact >= 5
jq '.events | map(select(.impact>=5))' /tmp/bs.json

# Just error IDs + URLs for triage
jq '.events | map({errorId, url, impact, count})' /tmp/bs.json
```

## Rate limits + timing

Bugsnag SaaS rate limit ~100 req/min. CLI batches per-error fetches in chunks of 8 with 700ms throttle. Typical `stats --top 20` across 2 projects ≈ 40 errors × ≤2 enrich calls ≈ 60–80 requests, well within the limit. Use `--no-stack --no-split` to cut all enrich calls.

## Output format

`stdout` = JSON only. `stderr` = human progress (project discovery, page counts, warnings). Pipe stdout into `jq` safely.

Exit codes:
- `0` — success
- `1` — runtime error (network/auth/parse)
- `2` — usage error (bad flags, missing `--yes` on write)
- `3` — Bugsnag API rejection or error not found
