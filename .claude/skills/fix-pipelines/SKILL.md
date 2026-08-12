---
name: fix-pipelines
description: Use when CI jobs are red on a Gramax branch and need diagnosing/fixing — failed pipeline, broken build/tests, "почини пайплайн", "сломанные джобы", "failed CI jobs", "pipeline red", "fix the pipeline". Triages failed jobs, reproduces the harness locally, verifies a fix, lands it per branch policy.
---

# Fixing Gramax CI pipelines

Diagnose and repair red CI jobs on a branch of the Gramax product repo
(`ics/doc-reader`, id `155`). Reproduce the failing harness locally, verify the
fix by re-running it green, then land it per the branch policy below.

Runs headless in CI (see the `ci` skill for the shared environment) or locally
from the team workspace. Non-interactive when headless: decide and act.

**Harness run recipes + env + gotchas live in `REFERENCE.md` — read it before
reproducing anything.**

## Target branch

- CI: `$CI_COMMIT_BRANCH`.
- Local: current checked-out gramax branch —
  `git -C gramax rev-parse --abbrev-ref HEAD`.

## Algorithm

### 1. Triage — what failed, since when, why

```sh
BRANCH=${CI_COMMIT_BRANCH:-$(git -C gramax rev-parse --abbrev-ref HEAD)}
# recent pipelines for the ref (spot the newest failed + last green)
glab api "projects/155/pipelines?ref=$BRANCH&per_page=20" \
  | jq -r '.[]|"\(.id)\t\(.status)\t\(.updated_at)\t\(.sha[0:8])"'
# failed jobs of a pipeline
glab api "projects/155/pipelines/$PID/jobs?per_page=100" \
  | jq -r '.[]|select(.status=="failed")|"\(.id)\t\(.name)\t\(.stage)"'
# decisive error — tail of the trace
glab api "projects/155/jobs/$JOB_ID/trace" | tail -50
```

Quote the shortest decisive error line. Compare against the last green pipeline
to date the break and tie it to the commit that introduced it.

**Classify each failure into one root cause:**

- **code bug** — an app-source change broke the build or a test.
- **test bug** — the test is wrong/stale; product code is fine.
- **runner infra** — OOM, timeout, native-module rebuild failure, image/tag
  mismatch, external-dependency outage.
- **flaky** — non-deterministic; passes on re-run.

### 2. Reproduce locally

Follow the `REFERENCE.md` recipe for the failing harness. It documents the
preflight (`install-deps.sh`, native `better-sqlite3` rebuild, the
`gramax-core.node` addon) and the exact run command per suite. **Confirm you see
the same failure locally before touching code** — can't reproduce → report the
env gap, don't guess a fix.

### 3. Propose fix + verify

Apply the **narrowest** fix for the cause class (targeted guard at the call
site, not a global/config change). Re-run that harness locally and confirm it
goes green before landing.

### 4. Land the fix

| Target branch          | CI / test fix | App-code fix |
| ---------------------- | ------------- | ------------ |
| `release/*`, `develop` | push direct   | open MR      |
| any other branch       | push direct   | push direct  |

- **App-code fix on `release/*`/`develop`** → open an MR (title English, body
  Russian, `## Notes`; use the `merge-request` skill). Everything else → push
  straight to the branch.
- All writes bot-authored (`GITLAB_CLAUDE_ACCESS_TOKEN`) + initiator credit
  (`.claude/scripts/gitlab-initiator` → `Co-Authored-By: <Full Name> <Email>`).
- Footer every commit/MR/comment with `Assisted-By: <model display name>`.

## Cause → action

| Cause | Action |
| --- | --- |
| code bug | fix source; land per table (MR on release/develop) |
| test bug | fix/adjust the test; it's a CI/test fix → push direct |
| flaky | retry the job first; patch only if it recurs; note it, don't guess a code change |
| runner infra (ours) | fix CI config/resources (timeout, memory, native rebuild) → push direct |
| runner infra (external outage) | report, do not patch — nothing to fix in our code |

## Red flags — stop

- Pushing a fix you never reproduced/verified locally.
- Patching product code for a flaky failure.
- A broad global/config change to silence one job — prefer the narrowest layer.
- Editing enterprise/`ges` harnesses — out of scope (see `REFERENCE.md`).
