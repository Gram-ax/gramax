---
name: triage-issues
description: Use when user asks to triage, process, or label GitHub issues in the Gramax project. Triggers on: "обработай заявки", "разбери ишью", "обработай ишью", "расставь лейблы", "needs-triage", specific issue numbers like "#1234". Also triggers when user mentions issues are missing impact, subsystem, or priority.
---

# Process GitHub Issues

Repo: `Gram-ax/gramax` — https://github.com/Gram-ax/gramax/issues  
Project board: https://github.com/orgs/Gram-ax/projects/2  
Project ID: `PVT_kwDOCFR9d84A0Ver`

An issue is **unprocessed** if ANY of the following is true:
- it has the `needs-triage` label
- it has no `impact:*` label
- it has no `type: *` label (`type: bug` / `type: feature` / `type: task`)
- it has no Subsystem set in the project board

Always check all four conditions — an issue without `needs-triage` can still be unprocessed if it's missing impact, type, or subsystem.

## Required fields for every issue

| Field | Source | Required | Default |
|-------|--------|----------|---------|
| **Type** | GitHub issue type (bug / feature / task) | Yes | — |
| **Subsystem** | Project field (GraphQL) | Yes | — |
| **Impact** | Label `impact:1` … `impact:5` | Yes | — |
| **Priority** | Label `priority: minor` / `priority: critical` / `priority: blocker` | Yes | `priority: normal` (no label = normal) |
| **Target** | Label `target: web` / `target: desktop` / `target: docportal` / `target: cli` / `target: mobile` / `target: static` | When platform-specific | — |
| **OS** | Label `os: windows` / `os: mac` / `os: linux` | When OS-specific | — |

Other labels (`regress`, `needs-repro`, `flaky`, `community`, `docs`, `wait`) apply when relevant.

## Subsystem options

`inline.code`, `openApi`, `diagrams`, `export`, `table`, `mergeRequest`, `copy`, `block.code`, `comments`, `note`, `snippet`, `multilang`, `tabs`, `image`, `navigation`, `UI/UX`, `list`, `file`, `link`, `workspace`, `git`, `search`, `import`, `ai`, `templates`, `parser`

UI/UX option ID: `17df1d4d`  
Subsystem field ID: `PVTSSF_lADOCFR9d84A0Verzgrfzz0`  
Status field ID: `PVTSSF_lADOCFR9d84A0Verzgp_A4U` → set to **"Analyzed"** (ID: `f75ad846`) after processing.

## Workflow (MANDATORY)

### 1. Fetch unprocessed issues

If the user provides specific issue numbers, fetch them directly and skip the steps below:
```bash
gh issue view <number> --repo Gram-ax/gramax --json number,title,body,labels,comments
```

Otherwise, collect issues from **all three** sources and deduplicate by number:

**1a. Issues with `needs-triage` label:**
```bash
gh issue list --repo Gram-ax/gramax --label "needs-triage" --limit 100 --json number,title,body,labels,assignees,comments
```

**1b. Open issues missing `impact:*` or `type:*` label** — fetch all open issues, filter locally:
```bash
gh issue list --repo Gram-ax/gramax --state open --limit 500 --json number,title,body,labels,assignees,comments \
  | jq '[.[] | select(
      (.labels | map(.name) | any(startswith("impact:")) | not)
      or
      (.labels | map(.name) | any(startswith("type:")) | not)
    )]'
```

**1c. Open issues missing Subsystem on the project board** — query the project via GraphQL:
```bash
gh api graphql -f query='
query {
  organization(login: "Gram-ax") {
    projectV2(number: 2) {
      items(first: 100) {
        nodes {
          id
          content { ... on Issue { number title state } }
          fieldValueByName(name: "Subsystem") { ... on ProjectV2ItemFieldSingleSelectValue { name } }
        }
      }
    }
  }
}'
```
Filter items where `fieldValueByName` is null and `content.state` is OPEN.

Merge all found issue numbers into a single deduplicated list. For issues found only in 1b or 1c (no `needs-triage`), fetch full details:
```bash
gh issue view <number> --repo Gram-ax/gramax --json number,title,body,labels,assignees,comments
```

### 2. Analyze each issue

Read title + body + comments. Determine:

**Type:**
- `bug` — something is broken / doesn't work as expected
- `feature` — new capability requested (including improvements to existing functionality)
- `task` — internal work, refactoring, docs, infra

**Subsystem:** identify the part of the product from the list above. Read the issue carefully — pick the most specific match. Multiple subsystems: pick the primary one.

**Impact (1–5):**
- `5` — data loss, crash, security, blocker for all users
- `4` — major feature broken, significant UX degradation
- `3` — moderate pain, workaround exists
- `2` — minor inconvenience, cosmetic issues
- `1` — very rare edge case, negligible effect

**Priority:**
- `priority: blocker` — blocks release or critical user flow
- `priority: critical` — must be fixed in the next sprint
- `priority: minor` — nice to have, backlog
- *(no priority label)* — normal priority (default)

**Target:** add if the issue is specific to a platform. Omit if it affects all platforms.

**OS:** add if the issue is OS-specific.

**Other labels:**
- `regress` — worked before, broke in a recent release
- `needs-repro` — reproduction steps missing or unclear
- `flaky` — intermittent behavior
- `community` — reported by an external contributor
- `docs` — documentation issue
- `wait` — blocked on external dependency or decision

### 3. Present a triage summary before applying

Before making any changes, print a table for all issues you will process:

```
| # | Title | Type | Subsystem | Impact | Priority | Target | Other labels |
|---|-------|------|-----------|--------|----------|--------|--------------|
| 123 | Button doesn't save | bug | UI/UX | impact:3 | (normal) | target: web | — |
```

Ask the user: **"Apply these changes?"** Wait for confirmation.

### 4. Apply changes

For each issue after confirmation:

**4a. Set labels (remove `needs-triage`, add determined labels):**
```bash
gh issue edit <number> --repo Gram-ax/gramax \
  --remove-label "needs-triage" \
  --add-label "impact:3,target: web"
```

**4b. Set issue type** — `gh issue edit --type` is NOT supported. Use a label instead:
```bash
gh issue edit <number> --repo Gram-ax/gramax --add-label "type: bug"
# or: type: feature / type: task
```

**4c. Set Subsystem project field** (GraphQL):

First, get the item ID in the project:
```bash
gh api graphql -f query='
query {
  repository(owner: "Gram-ax", name: "gramax") {
    issue(number: <NUMBER>) {
      projectItems(first: 10) {
        nodes { id project { id } }
      }
    }
  }
}'
```

Then update the Subsystem field:
```bash
gh api graphql -f query='
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "PVT_kwDOCFR9d84A0Ver"
    itemId: "<ITEM_ID>"
    fieldId: "PVTSSF_lADOCFR9d84A0Verzgrfzz0"
    value: { singleSelectOptionId: "<OPTION_ID>" }
  }) { projectV2Item { id } }
}'
```

**4d. Set Status to "Analyzed":**
```bash
gh api graphql -f query='
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "PVT_kwDOCFR9d84A0Ver"
    itemId: "<ITEM_ID>"
    fieldId: "PVTSSF_lADOCFR9d84A0Verzgp_A4U"
    value: { singleSelectOptionId: "f75ad846" }
  }) { projectV2Item { id } }
}'
```

If an issue is **not yet added to the project**, add it first:
```bash
gh api graphql -f query='
mutation {
  addProjectV2ItemById(input: {
    projectId: "PVT_kwDOCFR9d84A0Ver"
    contentId: "<ISSUE_NODE_ID>"
  }) { item { id } }
}'
```

Get `contentId` from:
```bash
gh issue view <number> --repo Gram-ax/gramax --json id
```

### 5. Report results

After all changes are applied, print a summary:
```
Processed N issues:
- #123 Bug: Button doesn't save → bug / UI/UX / impact:3 / normal / target:web
- #124 Feature: Dark mode → feature / UI/UX / impact:2 / minor
```

## Auth requirements

Scopes needed: `read:project`, `project`

Refresh if needed:
```bash
gh auth refresh -s project
```

## Priority decision guide

When unsure between priorities, ask:
- Would a PM escalate this? → critical or blocker
- Would a user complain loudly? → critical
- Would a user notice but work around it? → normal
- Would only power users notice? → minor

## Subsystem decision guide

When multiple subsystems apply, pick the one **where the bug manifests** (not where it originates). For example, a parser bug that corrupts table display → `table` (user-facing), not `parser`.
