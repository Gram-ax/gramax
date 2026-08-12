#!/bin/bash

set -euo pipefail

SKIP_NPM=false
CI_MODE=false
COMPILE_WASM=false
COMPILE_NODE=false

for arg in "$@"; do
    case "$arg" in
        --skip-npm) SKIP_NPM=true ;;
        --ci)       CI_MODE=true ;;
        --wasm)     COMPILE_WASM=true ;;
        --node)     COMPILE_NODE=true ;;
        --all)
            COMPILE_WASM=true
            COMPILE_NODE=true
            ;;
        *) echo "Unknown arg: $arg" >&2; exit 1 ;;
    esac
done

HAS_BUN=false
if command -v bun &> /dev/null; then
    HAS_BUN=true
elif [ "$CI_MODE" = true ]; then
    echo "bun required in CI mode" >&2
    exit 1
fi

install_once() {
    if [ "$HAS_BUN" = true ]; then
        bun install --cwd "$1"
    else
        npm --prefix "$1" --force install --cache .npm
    fi
}

install() {
    local dir="$1"
    local max=3
    echo "Installing: $dir"
    for attempt in $(seq 1 "$max"); do
        if install_once "$dir"; then
            return 0
        fi
        echo "Install failed for $dir (attempt $attempt/$max)" >&2
        [ "$attempt" -lt "$max" ] && sleep 2
    done
    echo "Installation failed after $max attempts for $dir" >&2
    exit 1
}

fetch_gh_ratelimit() {
    curl -fsS https://api.github.com/rate_limit \
        | awk -F'[:,]' '/"core":/{c=1} c && /"remaining"/ {gsub(/ /,"",$2); print $2; exit}'
}

if [ "$SKIP_NPM" = false ]; then
    install "."
    [ -f services/package.json ] && install services
fi

echo "Github API rate limit: $(fetch_gh_ratelimit || echo unknown)"

if [ "$COMPILE_WASM" = true ]; then
    mkdir -p apps/web/crates/gramax-wasm/dist
    bun run --cwd apps/web build:wasm
fi

if [ "$COMPILE_NODE" = true ]; then
    bun run --cwd apps/next/crates/next-gramax-core build
fi

echo "Compiling schemes"
