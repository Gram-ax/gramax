---
name: biome
description: Use when user asks to lint with Biome, check lint warnings introduced in an MR/branch, run `lint:ref`, or read/triage large Biome diagnostic output in the Gramax project. Triggers on keywords like biome, lint, lint:ref, warnings, lint gate.
---

# Biome — lint the MR diff

Biome v2.5.1. Config: `gramax/biome.jsonc` (`defaultBranch: develop`).

## What `lint:ref` does

```
"lint:ref": "bun run biome ci --no-errors-on-unmatched --error-on-warnings --files-ignore-unknown=true --changed --since=origin/develop"
```

Lints **only files changed vs `origin/develop`** and treats warnings as errors (exit non-zero). This is the MR lint gate — same check CI runs. Use it to see only the lint debt **your branch introduces**, not the whole repo.

Other scripts:
- `bun run lint` = `tsc --incremental false && biome ci` — full repo gate (slow).
- `bunx biome check --write <file>` — autofix one file (use after editing any TS/JS/JSON).

## The output problem

`lint:ref` default output is huge: each diagnostic prints a multi-line source frame + rule docs. Dozens of warnings = thousands of lines that blow context. **Never run the bare command and read its stdout directly.** Pick a strategy below.

### Strategy 1 — count + concise scan (default, do this first)

`--reporter=concise` collapses each finding to one line (`path:line:col rule message`). No source frames.

```sh
cd gramax && bunx biome ci \
  --no-errors-on-unmatched --files-ignore-unknown=true \
  --changed --since=origin/develop --reporter=concise
```

(Dropped `--error-on-warnings` so exit code doesn't mask output; the listing is what matters.)

Gives you: how many, which files, which rules. Cheap on context. Usually enough to triage.

### Strategy 2 — dump full detail to a file, then slice

When you need the source frames to actually fix something, write to disk and read selectively — never dump to terminal.

```sh
cd gramax && bunx biome ci \
  --no-errors-on-unmatched --files-ignore-unknown=true \
  --changed --since=origin/develop --max-diagnostics=none \
  --reporter-file=/tmp/biome-ref.txt ; echo "exit=$?"
```

Then:
- `rg -n "rules/" /tmp/biome-ref.txt` — list every rule + location.
- Read `/tmp/biome-ref.txt` with the Read tool, `offset`/`limit` to one finding at a time.
- `rg -c "⚠|ℹ|✖" /tmp/biome-ref.txt` — total count.

Severities: `✖` error, `⚠` warning, `ℹ` info. The footer summarizes (`Found N warning(s).` / `Found N info.`). With `--error-on-warnings` the gate fails on **errors + warnings**; `info` never fails the gate but still shows — don't waste effort on `info` unless asked.

`--max-diagnostics=none` lifts the default 20-diagnostic cap (else trailing findings hidden).

### Strategy 3 — machine output for filtering

For grouping by rule / scripted triage:

```sh
cd gramax && bunx biome ci --no-errors-on-unmatched --files-ignore-unknown=true \
  --changed --since=origin/develop --reporter=json \
  --reporter-file=/tmp/biome-ref.json
# then: jq '.diagnostics | group_by(.category) | map({rule: .[0].category, n: length})' /tmp/biome-ref.json
```

Reporters available: `default json json-pretty github junit summary gitlab checkstyle rdjson sarif concise`.

## Recommended flow

1. Strategy 1 (concise) → see scope.
2. If fixable & small → `bunx biome check --write <file>` per file, re-run Strategy 1 to confirm clean.
3. If need detail → Strategy 2, fix, re-check.
4. Gate before push: `bun run lint:ref` (full flags incl `--error-on-warnings`) must exit 0.

## Notes

- `nursery` rules (e.g. `noFloatingPromises`) are unstable but still gate the MR — fix or `void`-ignore.
- `--no-errors-on-unmatched` + `--files-ignore-unknown=true` keep biome quiet when the diff has no lintable files.
- Run from `gramax/` (where `biome.jsonc` lives).
