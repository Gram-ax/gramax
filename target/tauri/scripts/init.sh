#!/bin/bash

set -euo pipefail

export LANG="ru_RU.UTF-8"
export LC_COLLATE="C"
export LC_CTYPE="UTF-8"
export LC_MESSAGES="C"
export LC_MONETARY="C"
export LC_NUMERIC="C"
export LC_TIME="C"
export LC_ALL=

export LDFLAGS="-L/opt/homebrew/opt/llvm/lib"
export CPPFLAGS="-I/opt/homebrew/opt/llvm/include"
export PATH="/opt/homebrew/opt/llvm/bin:$PATH"

BUILD_DATE=$(date "+%Y.%-m.%-d")
VERSION_COMMIT_COUNT=$(git rev-list --count --date=local --after="$(date +"%Y-%m-01T00:00:00")" HEAD)
export VERSION_COMMIT_COUNT=$VERSION_COMMIT_COUNT;

export VERSION_WIN=$BUILD_DATE-win.$VERSION_COMMIT_COUNT
export VERSION_X64=$BUILD_DATE-mac-intel.$VERSION_COMMIT_COUNT 
export VERSION_ARM64=$BUILD_DATE-mac-silicon.$VERSION_COMMIT_COUNT
export VERSION_ANDROID=$BUILD_DATE-android.$VERSION_COMMIT_COUNT
export VERSION_IOS=$BUILD_DATE

APP_NAME=Gramax_

export ARM64_FILENAME="$APP_NAME""$VERSION_ARM64"
export X64_FILENAME="$APP_NAME""$VERSION_X64"
export WIN_FILENAME="$APP_NAME""$VERSION_WIN"
export ANDROID_FILENAME="$APP_NAME""$VERSION_ANDROID"
export IOS_FILENAME="$APP_NAME""$VERSION_IOS"

notary() {
  if [[ -n ${APPLE_SIGNING_IDENTITY+x} ]]; then
    xcrun notarytool submit --keychain-profile "ics-it" --wait --timeout 5m "$1"
    xcrun stapler staple "$1"
  else
    echo "APPLE_SIGNING_IDENTITY is not set. Skip notary.."
  fi
}

signexe() {
  if [[ -n ${WINDOWS_SIGNING_CRT+x} && -n ${WINDOWS_SIGNING_KEY+x} ]]; then
    echo "Signing $1"
    osslsigncode sign -certs "$WINDOWS_SIGNING_CRT" -key "$WINDOWS_SIGNING_KEY" -n Gramax -i app.gramax.ax -t http://timestamp.digicert.com -in "$1" "$1.signed"
    echo "Verifying signature"
    set +euo pipefail
    osslsigncode verify "$1.signed"
    set -euo pipefail
    mv "$1.signed" "$1"
  else
    echo "WINDOWS_SIGNING_CRT, WINDOWS_SIGNING_KEY are not set. Skip signing.."
  fi
}

export -f notary
export -f signexe

cd "$(dirname "$0")"/.. || exit 9

set +euo pipefail