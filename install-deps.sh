#!/bin/bash

set -euo pipefail

SHOULD_SKIP_NPM=false
CI_MODE=false

SHOULD_COMPILE_WASM=false
SHOULD_COMPILE_NODE=false

SHOULD_BUILD_PLUGINS=false

for arg in "$@"; do
	case "$arg" in
	"--skip-npm")
		SHOULD_SKIP_NPM=true
		;;
	"--ci")
		CI_MODE=true
		;;
	"--build-plugins")
		SHOULD_BUILD_PLUGINS=true
		;;
	"--wasm")
		SHOULD_COMPILE_WASM=true
		;;
	"--node")
		SHOULD_COMPILE_NODE=true
		;;

	"--all")
		SHOULD_COMPILE_WASM=true
		SHOULD_COMPILE_NODE=true
		SHOULD_BUILD_PLUGINS=true
		;;
	esac
done

install() {
	echo "Installing: $1"
	local npm_log_file
	npm_log_file=$(mktemp)

	if $CI_MODE; then
		npm --prefix "$1" --force ci --cache .npm --prefer-offline --no-audit 2>"$npm_log_file" || {
			echo "Failed to install packages in CI mode for $1"
			cat "$npm_log_file"
			rm "$npm_log_file"
			exit 1
		}
	else
		npm --prefix "$1" --force i --cache .npm 2>"$npm_log_file" || {
			echo "Failed to install packages for $1"
			cat "$npm_log_file"
			rm "$npm_log_file"
			exit 1
		}
	fi

	rm "$npm_log_file"
}

fetch_gh_ratelimit() {
	curl -s https://api.github.com/rate_limit | grep -A 2 '"core":' | grep '"remaining":' | awk '{print $2}' | tr -d ','
}

installNodeModules() {
	if ! "$CI_MODE" || ! [ -d "node_modules" ]; then
		install "."

		if [ -f "services/package.json" ]; then
			install services
		fi
		if [ -f "plugins/package.json" ]; then
			install plugins
		fi
	else
		echo "node_modules directory exists; skipping installation"
	fi
}

if ! "$SHOULD_SKIP_NPM"; then
	installNodeModules
fi

echo "Github API rate limit: $(fetch_gh_ratelimit)"

if $SHOULD_COMPILE_WASM; then
	mkdir -p apps/browser/wasm/dist
	cargo +nightly build --release --target wasm32-unknown-emscripten -Zbuild-std --manifest-path apps/browser/wasm/Cargo.toml
fi

if $SHOULD_COMPILE_NODE; then
	npm --prefix apps/next/rlibs/next-gramax-git run build
fi

echo "Compiling schemes"

npm run build:schemes 2>&1 || {
	echo "Failed to compile schemes"
	exit 1
}

if $SHOULD_BUILD_PLUGINS; then
	echo "Building plugins"
	mkdir -p plugins/target

	if [[ -n "${ROOT_PATH-}" ]]; then
		mkdir -p "$ROOT_PATH"/.storage/plugins
		echo "Created plugin storage in" "$ROOT_PATH"
	fi

	npm run build:plugins 2>&1 || {
		echo "Failed to build plugins"
		exit 1
	}
fi
