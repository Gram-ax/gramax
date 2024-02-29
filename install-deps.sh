#!/bin/bash

set -euo pipefail

echo "Installing packages"

CI=false

for arg in "$@"; do
  case "$arg" in
    "--ci") CI=true ;;
  esac
done

install() {
    printf "Installing: %s" "$1"

    if $CI; then
      printf " (CI)\n"
      npm --silent --prefix "$1" --force ci --cache .npm --prefer-offline --no-audit
    else
      printf "\n"
      npm --prefix "$1" --force i --cache .npm
    fi
}

if ! $CI || ! [ -d "node_modules" ]; then
  install .

  if [ -f "services/package.json" ]; then
    install services
  fi
else
  echo "node_modules already exists; skipping"
fi

echo "Building schemes"
npm run build:schemes