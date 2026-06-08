#!/bin/bash

KEEP_SERVICES=false

for arg in "$@"; do
    case "$arg" in
        --keep-services) KEEP_SERVICES=true ;;
    esac
done

files_to_delete=(
    "./core/extensions/security/logic/AuthProviders/certificates"
    "./core/extensions/security/logic/AuthProviders/dropbox.ts"
    "./scripts/enterprise"
    "./.ci/**/*.{yml,yaml,sh}"
    "./deploy"
    "./docs"
    "./.gitlab-ci.{yml,yaml}"
    "./examples"
    "./gx"
)

if [ "$KEEP_SERVICES" = false ]; then
    files_to_delete+=("./services")
fi

files_to_delete+=($(find . -name '*.npmrc'))
files_to_delete+=($(find . -name '*.pem'))

for file in "${files_to_delete[@]}"; do
    rm -rf "$file"
done
