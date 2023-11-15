#!/bin/bash

source "$(dirname "$0")"/init.sh

set +euo pipefail

rm -r bundle/setup/*.{ipa,apk} 2> /dev/null
mkdir -p bundle/setup

set -euo pipefail

{
  echo "Building iOS"
  mkdir -p "src-tauri/gen/apple/assets"
  cargo tauri ios build -c "{ \"package\": { \"version\": \"$VERSION_IOS\" } }" --build-number "$VERSION_COMMIT_COUNT"
  echo "Copying to iOS bundle"
  cp src-tauri/gen/apple/build/arm64/* bundle/setup
  (cd bundle/setup; mv ./*.ipa "./$IOS_FILENAME.ipa")
}

{
  echo "Building Android"
  cargo tauri android build -d --apk -c "{ \"package\": { \"version\": \"$VERSION_ANDROID\" } }"

  echo "Copying to APKs bundle";
  cp src-tauri/gen/android/app/build/outputs/apk/**/debug/*.apk bundle/setup
  (cd bundle/setup; mv ./*-universal-*.apk "./$ANDROID_FILENAME.apk") 
}
