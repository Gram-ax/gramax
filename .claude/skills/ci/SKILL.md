---
name: ci
description: Use when running headless inside a GitLab CI job in the Gramax repo (the `ai` job). Establishes environment — repo checked out, glab/gh authenticated, what tools exist, how to read/post on GitLab, how to diagnose failed pipeline jobs. Triggers on "ci", "running in CI", "headless CI job", "ты в CI", "запущен в пайплайне".
---

Claude Code running **headless** in GitLab CI job for **Gramax**.

## Environment

- Cwd = **team workspace root** (cloned fresh by `init.sh`). Layout:
  - `gramax/` — **product repo**, on **MR source branch**. `cd gramax` for code.
  - `docs/`, `board/` — sibling repos (shallow). `.claude/` — workspace config + skills.
- GitLab host: **`gitlab.ics-it.ru`**, project **`ics/doc-reader`** (id `155`).
- `glab` **already authed** (`GITLAB_HOST`+`GITLAB_TOKEN` set). Use for every GitLab op — read MRs, diffs, job logs, post notes.
- `gh` for GitHub mirror (`gram-ax/gramax`, issues only).
- Non-interactive: no prompts, no questions. Decide and act.

## Tools in image

`claude`, `glab`, `gh`, `git`, `bun`, `rg`, `fd`, `jq`, `uv`/`python3`, `openssh-client`.
`bun` for JS/TS (`bun run lint`, `bun run test <file>`), `rg`/`fd` for search.

## Current context

CI vars say where you are:

- `CI_MERGE_REQUEST_IID` — MR (on MR pipeline).
- `CI_MERGE_REQUEST_SOURCE_BRANCH_NAME` / `CI_MERGE_REQUEST_TARGET_BRANCH_NAME`.
- `CI_PIPELINE_ID` — current pipeline. `CI_PROJECT_ID` (`155`), `CI_PROJECT_PATH` (`ics/doc-reader`), `CI_SERVER_HOST`.

CI vars omit MR body — pull live title/desc/diff with `glab`. Run from `gramax/`, or target `-R ics/doc-reader`:

```sh
glab mr view "$CI_MERGE_REQUEST_IID" -R ics/doc-reader
glab mr diff "$CI_MERGE_REQUEST_IID" -R ics/doc-reader
```

## Diagnose failed pipeline jobs

Part of helping the dev: find **which jobs failed and why**, so you can propose a fix.

1. List pipeline jobs, spot failed ones:
   ```sh
   glab api "projects/155/pipelines/$CI_PIPELINE_ID/jobs?per_page=100" | jq -r '.[] | select(.status=="failed") | "\(.id)\t\(.name)\t\(.stage)"'
   ```
2. Read each failed job's log, find root cause (tail = error):
   ```sh
   glab api "projects/155/jobs/<job-id>/trace"
   ```
   Quote shortest decisive error line. Map to source file/line in the diff.
3. Diagnose: lint break, test fail, type error, build error. Tie to the MR change that caused it.
4. Tell dev concrete fix — file:line + what to change. If fix is small + safe, may commit it (attribution below).

## Acting

- **Reviews follow `merge-request` skill.** Run first — checklist (description + task link + `## Notes`) is hard block before code review, defines comment style.
- **Prefer inline comments** on exact lines (`merge-request` → REFERENCE.md → *Inline comments*), one thread = one finding, no status emoji. Summary MR note only for cross-file points not mapping to a line. Don't dump whole review in one note.
- Output GitLab-flavored markdown. Reference files by path. Terse.
- **Review**: focus correctness bugs, security, clear simplifications. Skip style nits (Biome handles). Nothing material wrong → say so in one line.
- **Attribution**: commit or open MR → append the `Assisted-By: <model display name>` footer (e.g. `Assisted-By: Claude Opus 4.8`).
- **Comment replies = bot.** Any reply to an MR/review comment posts as the bot (bot token `GITLAB_CLAUDE_ACCESS_TOKEN`). In CI that's the only token anyway; the rule matters when both tokens exist.
- Conventions in `gramax/CLAUDE.md` + workspace `CLAUDE.md` (cwd). Follow.

## Persistent review context across runs

`ai` job persists context dir between runs **on same MR** (GitLab cache keyed by MR IID). CI script restores before start, saves after, exports:

- `AI_CONTEXT_DIR` — abs path to persisted dir (always exists). Read/write state here.
- `AI_REVIEW_MODE` — `fresh` (first review) or `continue` (reviewed before).
- `AI_LAST_REVIEWED_SHA` — head reviewed last run (empty on `fresh`); `AI_HEAD_SHA` = current head.

**State file: `$AI_CONTEXT_DIR/review-state.md`.** Its presence + `last-reviewed-sha` flips next run to `continue` — always (re)write at end. Keep compact:

- Current head SHA + one-line MR summary.
- Findings table: finding → file:line → status (`open`/`fixed`/`wontfix`/`replied`) → inline thread/discussion ID.
- Open questions to author, waiting on.
- Latest MR note timestamp seen (detect new comments next run).

### `fresh` mode

Full review. Read MR via `glab` (description, full diff), run `merge-request` checklist, post inline comments per finding, write `review-state.md` from scratch.

### `continue` mode — resume, don't restart

1. Read `$AI_CONTEXT_DIR/review-state.md` — memory of prior review.
2. **Read new MR comments** since recorded timestamp (`glab mr view "$CI_MERGE_REQUEST_IID" --comments` / discussions API in `merge-request` → REFERENCE.md). Reply in-thread: resolve addressed, push back on wrong fixes, answer questions.
3. **Review only new commits.** Diff range, not whole MR: `git -C gramax diff "$AI_LAST_REVIEWED_SHA".."$AI_HEAD_SHA"` (`--stat` first to scope). `AI_LAST_REVIEWED_SHA` == `AI_HEAD_SHA` → no new code, only process comments. Don't re-review unchanged code or re-post known findings.
4. Post new inline comments for new issues; update statuses of old findings as author fixes.
5. Rewrite `review-state.md`: bump head SHA + timestamp, merge new findings, update statuses.

`last-reviewed-sha` written by CI script after you finish — don't manage it yourself.
