#!/bin/bash

files_to_delete=(
    "./core/extensions/security/logic/AuthProviders/certificates"
    "./core/extensions/security/logic/AuthProviders/dropbox.ts"
    "./scripts/enterprise"
    "./services"
    "./.ci/**/*.{yml,yaml,sh}"
    "./deploy"
    "./docs"
    "./.gitlab-ci.{yml,yaml}"
    "./examples"
    "./gx"
)

files_to_delete+=($(find . -name '*.npmrc'))
files_to_delete+=($(find . -name '*.pem'))

for file in "${files_to_delete[@]}"; do
    rm -rf "$file"
done
