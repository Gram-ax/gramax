# merge-request — GitLab command reference

Concrete commands for the `merge-request` skill. Project `ics/doc-reader` (id `155`), host `gitlab.ics-it.ru`, API base `$GITLAB_API_URL` (`https://gitlab.ics-it.ru/api/v4`). Writes use whatever token the environment provides (`$GITLAB_TOKEN` — set by `glab`'s login / the CI env). No token prescription — **except replies to comments, which always use the bot token** `GITLAB_CLAUDE_ACCESS_TOKEN` (prefix those calls: `GITLAB_TOKEN=$GITLAB_CLAUDE_ACCESS_TOKEN` / `PRIVATE-TOKEN: $GITLAB_CLAUDE_ACCESS_TOKEN`).

## Create / update MR

```sh
glab mr create --title "<title>" --description-from-file <file> -y
glab mr update <iid> --description-from-file <file>
```

## Regular (non-inline) comment

For the *Missing description comment* — one MR-level note, not tied to a line:

```sh
glab mr note <iid> -m "$(cat <file>)"
# or via API:
curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --data-urlencode "body@<file>" \
  "$GITLAB_API_URL/projects/155/merge_requests/<iid>/notes"
```

## Inline comments (code findings)

One thread = one finding, on a specific line. Needs the diff `base_sha`/`start_sha`/`head_sha` from the MR versions endpoint:

```sh
curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "$GITLAB_API_URL/projects/155/merge_requests/<iid>/versions" | jq '.[0]'

curl -s -X POST -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --data-urlencode "body=<finding text>" \
  --data "position[position_type]=text" \
  --data "position[base_sha]=<base>" \
  --data "position[start_sha]=<start>" \
  --data "position[head_sha]=<head>" \
  --data "position[new_path]=<file>" \
  --data "position[new_line]=<line>" \
  "$GITLAB_API_URL/projects/155/merge_requests/<iid>/discussions"
```

For the GitHub mirror use `gh pr comment` / `gh api` instead.

## Diverged commits (source behind target — minor remark)

```sh
glab api "projects/155/merge_requests/<iid>?include_diverged_commits_count=true" | jq '.diverged_commits_count'
```

## Read an MR

```sh
glab mr view <iid>
glab api "projects/155/merge_requests/<iid>" | jq
```
