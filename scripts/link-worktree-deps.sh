#!/usr/bin/env bash
set -euo pipefail

# The main checkout, not "wherever this script sits": run from inside a worktree, the
# script's own path resolves to that worktree and every `rm -rf` below then points at the
# main checkout's deps. git-common-dir is shared by all worktrees and lives in the main one.
GIT_COMMON_DIR="$(git -C "$(dirname "$0")" rev-parse --path-format=absolute --git-common-dir)"
REPO_ROOT="$(dirname "$GIT_COMMON_DIR")"
DIRS=(.cache node_modules services/node_modules)

worktrees=$(git -C "$REPO_ROOT" worktree list --porcelain | awk '/^worktree /{print $2}')

for wt in $worktrees; do
  [ "$wt" = "$REPO_ROOT" ] && continue

  echo "==> $wt"
  for dir in "${DIRS[@]}"; do
    src="$REPO_ROOT/$dir"
    dst="$wt/$dir"

    if [ -L "$dst" ]; then
      echo "  $dir: already a symlink"
      continue
    fi

    if [ -d "$dst" ]; then
      echo "  $dir: removing existing directory"
      rm -rf "$dst"
    fi

    if [ -d "$src" ]; then
      ln -s "$src" "$dst"
      echo "  $dir -> $src"
    else
      echo "  $dir: source not found, skipping"
    fi
  done
  # Icons need cargo; without it the whole loop used to die and later worktrees got no deps.
  if (cd "$wt" && ./gx make-icons --no-badges); then
    git -C "$wt" checkout-index --index --force -- apps/tauri/src-tauri/icons/icon.png
  else
    echo "  icons: make-icons failed, skipping"
  fi
done

echo "Done."
