#!/bin/bash

set -euo pipefail

SHOULD_SKIP_NPM=false
CI_MODE=false

SHOULD_COMPILE_WASM=false
SHOULD_COMPILE_NODE=false
SHOULD_COMPILE_WARP=false

for arg in "$@"; do
    case "$arg" in
        "--skip-npm")
            SHOULD_SKIP_NPM=true
        ;;
        "--ci")
            CI_MODE=true
        ;;
        "--wasm")
            SHOULD_COMPILE_WASM=true
        ;;
        "--node")
            SHOULD_COMPILE_NODE=true
        ;;
        "--warp")
            SHOULD_COMPILE_WARP=true
        ;;
        
        "--all")
            SHOULD_COMPILE_WASM=true
            SHOULD_COMPILE_NODE=true
            SHOULD_COMPILE_WARP=true
        ;;
    esac
done

install() {
    echo "Installing: $1"
    local max_retries=3
    local retry_count=0
    
    set +euo pipefail
    while [ $retry_count -lt $max_retries ]; do
        if [ $retry_count -gt 0 ]; then
            attempt_msg=" (attempt $((retry_count + 1)))"
        else
            attempt_msg=""
        fi
        
        if command -v bun &> /dev/null; then
            if [ "$CI_MODE" = true ]; then
                echo "Using bun for installation in CI mode${attempt_msg}"
                bun install --cwd "$1" --no-cache && break || {
                    echo "Failed to install packages for $1 in CI mode using bun"
                    ((retry_count++))
                }
            else
                echo "Using bun for installation${attempt_msg}"
                bun install --cwd "$1" && break || {
                    echo "Failed to install packages for $1 using bun"
                    ((retry_count++))
                }
            fi
        else
            echo "Using npm for installation${attempt_msg}"
            if [ "$CI_MODE" = true ]; then
                npm --prefix "$1" --force ci --cache .npm --prefer-offline --no-audit --verbose && break || {
                    echo "Failed to install packages in CI mode for $1 using npm"
                    ((retry_count++))
                }
            else
                npm --prefix "$1" --force install --cache .npm && break || {
                    echo "Failed to install packages for $1 using npm"
                    ((retry_count++))
                }
            fi
        fi
        
        if [ $retry_count -eq $max_retries ]; then
            echo "Installation failed after $max_retries attempts for $1"
            exit 1
        else
            echo "Retrying installation for $1..."
            sleep 2
        fi
    done
    set -euo pipefail
}

fetch_gh_ratelimit() {
    curl -s https://api.github.com/rate_limit | grep -A 2 '"core":' | grep '"remaining":' | awk '{print $2}' | tr -d ','
}

if ! "$SHOULD_SKIP_NPM"; then
    install "."
    if [ -f "services/package.json" ]; then
        install "services"
    fi
fi

echo "Github API rate limit: $(fetch_gh_ratelimit)"

if $SHOULD_COMPILE_WASM; then
    mkdir -p apps/browser/wasm/dist
    npm --prefix apps/browser run build:wasm
fi

if $SHOULD_COMPILE_NODE; then
    npm --prefix apps/next/crates/next-gramax-git run build
fi

if $SHOULD_COMPILE_WARP; then
    cargo install --path rbins/warp-spa
fi

echo "Compiling schemes"

npm run build:schemes 2>&1 || {
    echo "Failed to compile schemes"
    exit 1
}
