#!/bin/bash
# Install bun with retries (network to GitHub from CI can be flaky).
set -euo pipefail

MAX_ATTEMPTS="${BUN_INSTALL_MAX_ATTEMPTS:-5}"
BUN_VERSION="${1:-}"

install_once() {
	if [[ -n "$BUN_VERSION" ]]; then
		HTTPS_PROXY="${RUNNER_HTTPS_PROXY:-}" curl -fsSL https://bun.com/install | bash -s "$BUN_VERSION"
	else
		HTTPS_PROXY="${RUNNER_HTTPS_PROXY:-}" curl -fsSL https://bun.com/install | bash
	fi
}

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
	if install_once; then
		export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
		export PATH="$BUN_INSTALL/bin:$PATH"
		bun --version
		return 0
	fi
	echo "bun install failed (attempt ${attempt}/${MAX_ATTEMPTS})" >&2
	if [[ "$attempt" -lt "$MAX_ATTEMPTS" ]]; then
		sleep $((attempt * 2))
	fi
done

echo "bun install failed after ${MAX_ATTEMPTS} attempts" >&2
exit 1
