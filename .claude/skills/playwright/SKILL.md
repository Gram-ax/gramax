---
name: playwright
description: Use when the user wants to inspect a Playwright `trace.zip` (actions, screenshots, console errors, network). Triggers on "examine trace", "explore trace", "open trace.zip", "look at the playwright trace", "что в trace.zip", "посмотри трейс", or any message attaching a `*.zip` path that looks like a Playwright trace (e.g. `trace-*.zip`, `trace.zip`).
---

# Examining a Playwright trace.zip

A Playwright trace is a zip with NDJSON event streams plus screenshots/snapshots. Never read the `.zip` directly — extract first, then query.

## Contents of a trace.zip

| File | What it holds |
|------|---------------|
| `trace.trace` (and optional `<n>-trace.trace`) | NDJSON of actions, `before`/`after`/`event`, errors, console |
| `trace.network` | NDJSON of network requests/responses |
| `trace.stacks` | Binary stack traces (rarely needed) |
| `resources/*.jpeg` | Screenshots captured per action |
| `resources/*.html` | DOM snapshots |

## Workflow

### 1. Extract + summarize

Use the helper. It unzips and prints a structured summary.

```sh
./.claude/skills/explore-playwright-trace/scripts/extract-trace.sh ~/Downloads/trace-1.zip
# or specify out dir:
./.claude/skills/explore-playwright-trace/scripts/extract-trace.sh ~/Downloads/trace-1.zip /tmp/trace-1
```

Output includes: action breakdown, console/errors, screenshot count, top network requests, and the extraction dir.

If the helper is not available (other repo): fallback to
```sh
OUT=$(mktemp -d) && unzip -q ~/Downloads/trace-1.zip -d "$OUT" && echo "$OUT"
```

### 2. Inspect specific things

After extraction, `$OUT` holds the files. Use `jq` to drill in.

**Timeline of actions:**
```sh
jq -c 'select(.type == "before") | {t: .startTime, api: .apiName, params}' "$OUT"/*.trace
```

**Failed actions with error message:**
```sh
jq -c 'select(.error != null) | {api: .apiName, error: .error.message, stack: .error.stack}' "$OUT"/*.trace
```

**Console messages (browser-side):**
```sh
jq -c 'select(.type == "console") | {level: .messageType, text}' "$OUT"/*.trace
```

**All page navigations:**
```sh
jq -c 'select(.apiName == "page.goto" or .method == "navigate") | {url: (.params.url // .url), t: .startTime}' "$OUT"/*.trace
```

**Network failures (status >= 400 or no response):**
```sh
jq -c 'select(.status != null and .status >= 400) | {method, url, status}' "$OUT"/*.network
```

**Slowest actions:**
```sh
jq -s 'map(select(.type == "before" and .endTime != null) | {api: .apiName, dur: (.endTime - .startTime)}) | sort_by(-.dur) | .[:20]' "$OUT"/*.trace
```

### 3. Look at screenshots

```sh
ls "$OUT/resources/"*.jpeg | head
open "$OUT/resources/"   # macOS — opens Finder for visual scan
```

Each action references a screenshot by sha1 in `params.snapshot` / `pageId`. To link an action to its screenshot: grab the sha1 referenced near the action's timestamp and match `resources/<sha1>.jpeg`.

### 4. Report

Summarize for the user in this order:
1. **Verdict** — passed / failed; if failed, which action.
2. **Error** — exact message + the action that caused it (api, params).
3. **Console** — relevant web errors/warnings.
4. **Network** — failed/4xx/5xx requests, if any.
5. **Last screenshot** — the path; suggest opening it.

Quote error strings exact. Do not paraphrase.

## Notes

- Some traces have multiple `*.trace` files (one per BrowserContext). The helper concatenates them.
- Timestamps are unix epoch seconds (floats). Pretty-print with `strftime` if needed: `(.startTime | strftime("%H:%M:%S"))`.
- Don't dump full NDJSON to the conversation — it's huge. Always filter with `jq`.
- The helper uses `$TMPDIR` by default; clean up with `rm -rf` when done if the trace was big.
