#!/bin/bash

set -euo pipefail

export LANGUAGE="en_US"
export LANG="en_US.UTF-8"
export LC_COLLATE="C"
export LC_MESSAGES="C"
export LC_MONETARY="C"
export LC_NUMERIC="C"
export LC_TIME="C"
export LC_ALL=

export LDFLAGS="-L/opt/homebrew/opt/llvm/lib"
export CPPFLAGS="-I/opt/homebrew/opt/llvm/include"
export PATH="/opt/homebrew/opt/llvm/bin:$(pwd):$PATH"

if [ -n "${NDK_HOME-}" ]; then
  export PATH="$NDK_HOME/toolchains/llvm/prebuilt/darwin-x86_64/bin:$PATH"
else
  echo "NDK_HOME is not set, skipping..."
fi

ONLY_ENV=false

for arg in "$@"; do
  case "$arg" in
  "--only-env") ONLY_ENV=true ;;
  esac
done

BUILD_DATE=$(date "+%Y.%-m.%-d")
export VERSION_COMMIT_COUNT=$(git rev-list --count --date=local --after="$(date +"%Y-%m-01T00:00:00")" HEAD)

generate_version() {
  case $1 in
  ios)
    echo "${BUILD_DATE}"
    ;;
  *)
    echo "${BUILD_DATE}-$1.${VERSION_COMMIT_COUNT}"
    ;;
  esac
}

generate_filename() {
  case $1 in
  ios)
    echo "${APP_NAME}$VERSION_IOS-ios.$2"
    ;;
  *)
    echo "${APP_NAME}$2"
    ;;
  esac
}

export VERSION_WIN=$(generate_version "win")
export VERSION_X64=$(generate_version "mac-intel")
export VERSION_ARM64=$(generate_version "mac-silicon")
export VERSION_LINUX=$(generate_version "linux")
export VERSION_ANDROID=$(generate_version "android")
export VERSION_IOS=$(generate_version "ios")
export VERSION_DOCPORTAL=$(generate_version "docportal")
export VERSION_WEB=$(generate_version "web")
export VERSION_GIT_PROXY=$(generate_version "git-proxy")


export PROFILE="release"
export PROFILE_FLAGS=""

PRODUCT_NAME="Gramax"
APP_NAME="Gramax_"
PRODUCT_ID="gramax.app"

if [[ -z ${BRANCH+x} || "$BRANCH" != "master" ]]; then
  PROFILE_FLAGS="--profile development"
  PROFILE="development"

  if [[ "$BRANCH" == "develop" && "$IS_MERGE_REQUEST" != "true" ]]; then
    PRODUCT_NAME="Gramax Dev"
    PRODUCT_ID="gramax.dev"
    APP_NAME="Gramax_Dev_"
  else
    PRODUCT_NAME="Gramax Test"
    PRODUCT_ID="gramax.dev"
    APP_NAME="Gramax_Test_"
  fi 
fi

export PRODUCT_ID
export PRODUCT_NAME

export WIN_FILENAME=$(generate_filename "win" "$VERSION_WIN")
export X64_FILENAME=$(generate_filename "mac-intel" "$VERSION_X64")
export ARM64_FILENAME=$(generate_filename "mac-silicon" "$VERSION_ARM64")
export LINUX_FILENAME=$(generate_filename "linux" "$VERSION_LINUX")
export ANDROID_FILENAME=$(generate_filename "android" "$VERSION_ANDROID")
export IOS_FILENAME=$(generate_filename "ios" "$VERSION_COMMIT_COUNT")

if $ONLY_ENV; then
  return 0
fi

macos_notary() {
  if [[ -n ${APPLE_SIGNING_IDENTITY+x} ]]; then
    xcrun notarytool submit "$1" --apple-id "$APPLE_SIGNING_APPLE_ID" --team-id "$APPLE_TEAM_ID" --password "$APPLE_SIGNING_PASSWORD" --wait --timeout 10m
    xcrun stapler staple "$1"
  else
    echo "APPLE_SIGNING_IDENTITY is not set. Skip notary.."
  fi
}

export -f macos_notary

cd "$(dirname "$0")"/../../apps/tauri || exit 9

set +euo pipefail
