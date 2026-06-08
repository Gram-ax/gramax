#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel)"
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
	(cd $wt && ./gx make-icons --no-badges)
	git -C "$wt" checkout-index --index --force -- apps/tauri/src-tauri/icons/icon.png
done

echo "Done."
